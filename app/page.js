'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

export default function InvestorPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
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
    const { data: investmentsData } = await supabase
      .from('investments')
      .select('*')
      .eq('investor_id', investorId)
    
    setInvestments(investmentsData || [])

    const { data: propertiesData } = await supabase
      .from('properties')
      .select('*')
    
    setProperties(propertiesData || [])

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
    setActiveTab('dashboard')
  }

  const totalDistributions = transactions
    .filter(t => t.type === 'Distribution')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  
  const totalFees = transactions
    .filter(t => t.type === 'Fee')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)

  const netReturn = totalDistributions - totalFees
  const roi = currentInvestor?.total_invested > 0 
    ? ((netReturn / parseFloat(currentInvestor.total_invested)) * 100).toFixed(2)
    : 0

  // Analytics data
  const monthlyReturns = [
    { month: 'Jan', amount: 2800 },
    { month: 'Feb', amount: 3200 },
    { month: 'Mar', amount: 2900 },
    { month: 'Apr', amount: 3500 },
    { month: 'May', amount: 3800 },
    { month: 'Jun', amount: 4300 },
  ]

  const propertyPerformance = investments.map(inv => {
    const property = properties.find(p => p.id === inv.property_id)
    const propertyTransactions = transactions.filter(t => t.property_id === inv.property_id)
    const returns = propertyTransactions
      .filter(t => t.type === 'Distribution')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
    return {
      name: property?.address?.split(',')[0] || 'Property',
      invested: parseFloat(inv.amount),
      returns: returns,
      appreciation: parseFloat(property?.current_value || 0) - parseFloat(property?.purchase_price || 0)
    }
  })

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
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

          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documents
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Invested</p>
                <p className="text-3xl font-bold text-gray-900">${parseFloat(currentInvestor?.total_invested || 0).toLocaleString()}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Returns</p>
                <p className="text-3xl font-bold text-green-600">${netReturn.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">ROI: {roi}%</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Properties</p>
                <p className="text-3xl font-bold text-blue-600">{investments.length}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Distributions YTD</p>
                <p className="text-3xl font-bold text-purple-600">${totalDistributions.toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Breakdown</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={investments.map((inv, idx) => {
                        const property = properties.find(p => p.id === inv.property_id)
                        return {
                          name: property?.address?.split(',')[0] || 'Property',
                          value: parseFloat(inv.amount)
                        }
                      })}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `$${(entry.value / 1000).toFixed(0)}k`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {investments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {transactions.slice(0, 5).sort((a, b) => new Date(b.date) - new Date(a.date)).map(trans => {
                    const property = properties.find(p => p.id === trans.property_id)
                    return (
                      <div key={trans.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{trans.description}</p>
                          <p className="text-xs text-gray-500">{property?.address?.split(',')[0]} • {trans.date}</p>
                        </div>
                        <span className={`text-sm font-semibold ${parseFloat(trans.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(trans.amount) > 0 ? '+' : ''}${parseFloat(trans.amount).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Property Summary */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Properties</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investments.map(inv => {
                    const property = properties.find(p => p.id === inv.property_id)
                    const appreciation = parseFloat(property?.current_value || 0) - parseFloat(property?.purchase_price || 0)
                    const appreciationPercent = ((appreciation / parseFloat(property?.purchase_price || 1)) * 100).toFixed(1)
                    
                    return (
                      <div key={inv.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{property?.address}</h3>
                            <p className="text-sm text-gray-600">{parseFloat(inv.ownership_percentage).toFixed(1)}% ownership</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${appreciation >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {appreciation >= 0 ? '+' : ''}{appreciationPercent}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Your Investment</p>
                            <p className="font-semibold text-gray-900">${parseFloat(inv.amount).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Current Value</p>
                            <p className="font-semibold text-gray-900">${parseFloat(property?.current_value || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Returns Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#93c5fd" name="Returns" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Performance Comparison</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={propertyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="invested" fill="#3b82f6" name="Invested" />
                  <Bar dataKey="returns" fill="#10b981" name="Returns" />
                  <Bar dataKey="appreciation" fill="#f59e0b" name="Appreciation" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Average Monthly Return</h3>
                <p className="text-3xl font-bold text-gray-900">${(totalDistributions / 6).toFixed(0)}</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% vs last period</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Portfolio ROI</h3>
                <p className="text-3xl font-bold text-gray-900">{roi}%</p>
                <p className="text-sm text-gray-500 mt-1">Since inception</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Appreciation</h3>
                <p className="text-3xl font-bold text-gray-900">
                  ${propertyPerformance.reduce((sum, p) => sum + p.appreciation, 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">Unrealized gains</p>
              </div>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {investments.map(inv => {
              const property = properties.find(p => p.id === inv.property_id)
              const propertyTrans = transactions.filter(t => t.property_id === inv.property_id)
              const propertyReturns = propertyTrans.filter(t => t.type === 'Distribution').reduce((sum, t) => sum + parseFloat(t.amount), 0)
              
              return (
                <div key={inv.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{property?.address}</h2>
                        <p className="text-gray-600">Purchased {property?.purchase_date}</p>
                      </div>
                      <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {parseFloat(inv.ownership_percentage).toFixed(1)}% Owner
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Your Investment</p>
                        <p className="text-xl font-bold text-gray-900">${parseFloat(inv.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Purchase Price</p>
                        <p className="text-xl font-bold text-gray-900">${parseFloat(property?.purchase_price || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Current Value</p>
                        <p className="text-xl font-bold text-green-600">${parseFloat(property?.current_value || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Your Returns</p>
                        <p className="text-xl font-bold text-purple-600">${propertyReturns.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Property Transactions</h3>
                      <div className="space-y-2">
                        {propertyTrans.map(trans => (
                          <div key={trans.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{trans.description}</p>
                              <p className="text-xs text-gray-500">{trans.date}</p>
                            </div>
                            <span className={`text-sm font-semibold ${parseFloat(trans.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(trans.amount) > 0 ? '+' : ''}${parseFloat(trans.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">All Transactions</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Filter</button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Export CSV</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(trans => {
                    const property = properties.find(p => p.id === trans.property_id)
                    const amount = parseFloat(trans.amount)
                    return (
                      <tr key={trans.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trans.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{property?.address?.split(',')[0]}</td>
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
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tax Documents</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-xs">PDF</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">K-1 Form 2024</p>
                        <p className="text-sm text-gray-500">Tax Year 2024 • 245 KB</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Download</button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-xs">PDF</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">1099 Form 2024</p>
                        <p className="text-sm text-gray-500">Tax Year 2024 • 187 KB</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Download</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Statements</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['December 2024', 'November 2024', 'October 2024', 'September 2024'].map(month => (
                    <div key={month} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">PDF</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{month}</p>
                          <p className="text-sm text-gray-500">Statement</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">View</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Property Documents</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-xs">DOC</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Operating Agreement</p>
                        <p className="text-sm text-gray-500">All Properties • 1.2 MB</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Download</button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-xs">PDF</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Property Appraisals 2024</p>
                        <p className="text-sm text-gray-500">Updated annually • 3.5 MB</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Download</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}