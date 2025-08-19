import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, Calendar, Users, TrendingUp } from 'lucide-react'
import axios from 'axios'

interface Analytics {
  formId: string
  period: string
  totalSubmissions: number
  periodSubmissions: number
  dailyStats: Array<{ date: string; count: number }>
  fieldStats: {
    [key: string]: {
      label: string
      type: string
      totalResponses: number
      responseRate: string
      optionDistribution?: { [key: string]: number }
    }
  }
  recentSubmissions: Array<{ date: string; fieldCount: number }>
  averageFieldsPerSubmission: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const FormAnalytics = () => {
  const { id } = useParams()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [id, period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/analytics/form/${id}?period=${period}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Analytics</h1>
          <p className="text-gray-600">View detailed insights about your form</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalSubmissions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Period Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.periodSubmissions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Fields/Response</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.averageFieldsPerSubmission}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Download className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.periodSubmissions > 0 
                    ? Math.round((analytics.periodSubmissions / analytics.totalSubmissions) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Submissions Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Daily Submissions</h3>
            <p className="card-description">Submission trend over time</p>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, 'Submissions']}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Field Response Rates */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Field Response Rates</h3>
            <p className="card-description">How often each field gets answered</p>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(analytics.fieldStats).map(([id, stats]) => ({
                  name: stats.label,
                  rate: parseFloat(stats.responseRate)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Response Rate']} />
                  <Bar dataKey="rate" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Field Statistics */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Field Statistics</h3>
          <p className="card-description">Detailed breakdown by field</p>
        </div>
        <div className="card-content">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analytics.fieldStats).map(([fieldId, stats]) => (
                  <tr key={fieldId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stats.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {stats.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.totalResponses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${stats.responseRate}%` }}
                          ></div>
                        </div>
                        <span>{stats.responseRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.optionDistribution && (
                        <div className="text-xs">
                          {Object.entries(stats.optionDistribution).map(([option, count]) => (
                            <div key={option} className="flex justify-between">
                              <span>{option}:</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Submissions</h3>
          <p className="card-description">Latest form responses</p>
        </div>
        <div className="card-content">
          {analytics.recentSubmissions.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentSubmissions.map((submission, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {new Date(submission.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {submission.fieldCount} fields answered
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent submissions</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormAnalytics 