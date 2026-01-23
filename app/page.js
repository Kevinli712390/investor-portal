'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function InvestorPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currentInvestor, setCurrentInvestor] = useState(null)
  const [investments, setInvestments] = useState([])
  const [properties, setProperties] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('investors')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (data) {
      setCurrentInvestor(data)
      setIsLoggedIn(true)
      await loadInvestorData(data.id)
    } else {
      alert('Invalid credentials')
    }
    setLoading(false)
  }

  const loadInvestorData = async (investorId) => {
    // Load investments
    const { data: investmentsData } = await supabase
      .from('investments')
      .select('*')
      .eq('investor_id', investorId)
    
    setInvestments(investmentsData || [])

    // Load properties
    const { data: propertiesData } = await supabase
      .from('properties')
      .select('*')
    
    setProperties(propertiesData || [])

    // Load transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('investor_id', investorId)
    
    setTransactions(transactionsData || [])
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentInvestor(null)
    setEmail('')
    setPassword('')
    setInvestments([])
    setProperties([])
    setTransactions([])
  }

  // Calculate totals
  const totalDistributions = transactions
    .filter(t => t.type === 'Distribution')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  
  const totalFees = transactions
    .filter(t => t.type === 'Fee')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Investor Portal</h1>
            <p className="text-gray-600">Access your real estate investments</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="investor@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-1">Demo Credentials:</p>
            <p className="text-sm text-blue-600">john@email.com / demo123</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentInvestor?.name}</h1>
            <p className="text-sm text-gray-600">Investor since {currentInvestor?.join_date}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Invested</p>
            <p className="text-3xl font-bold text-gray-900">${parseFloat(currentInvestor?.total_invested || 0).toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Properties</p>
            <p className="text-3xl font-bold text-blue-600">{investments.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Distributions</p>
            <p className="text-3xl font-bold text-green-600">${totalDistributions.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Fees</p>
            <p className="text-3xl font-bold text-red-600">${totalFees.toLocaleString()}</p>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Properties</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {investments.map(inv => {
                const property = properties.find(p => p.id === inv.property_id)
                return (
                  <div key={inv.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{property?.address}</h3>
                        <p className="text-sm text-gray-600">Purchased: {property?.purchase_date}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {parseFloat(inv.ownership_percentage).toFixed(1)}% ownership
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Your Investment</p>
                        <p className="font-semibold text-gray-900">${parseFloat(inv.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Purchase Price</p>
                        <p className="font-semibold text-gray-900">${parseFloat(property?.purchase_price || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Current Value</p>
                        <p className="font-semibold text-green-600">${parseFloat(property?.current_value || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(trans => {
                  const property = properties.find(p => p.id === trans.property_id)
                  const amount = parseFloat(trans.amount)
                  return (
                    <tr key={trans.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trans.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{property?.address.split(',')[0]}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          trans.type === 'Distribution' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trans.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{trans.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {amount > 0 ? '+' : ''}${amount.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}