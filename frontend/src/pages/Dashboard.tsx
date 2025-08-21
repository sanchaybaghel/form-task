import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Clock,
  Eye,
  Plus
} from 'lucide-react'
import backend from '../services/backend'

interface DashboardStats {
  overview: {
    totalForms: number
    publishedForms: number
    draftForms: number
    totalSubmissions: number
    recentSubmissionsCount: number
  }
  topForms: Array<{
    _id: string
    title: string
    analytics: {
      totalSubmissions: number
    }
  }>
  recentActivity: Array<{
    formTitle: string
    submittedAt: string
  }>
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
  const response = await backend.get('/analytics/dashboard')
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your forms and submissions</p>
        </div>
        <Link
          to="/forms/new"
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.totalForms}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.publishedForms}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.totalSubmissions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overview.recentSubmissionsCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Forms and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Forms */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Performing Forms</h3>
            <p className="card-description">Forms with the most submissions</p>
          </div>
          <div className="card-content">
            {stats.topForms.length > 0 ? (
              <div className="space-y-4">
                {stats.topForms.map((form) => (
                  <div key={form._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{form.title}</p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {form.analytics.totalSubmissions} submissions
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No forms yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <p className="card-description">Latest form submissions</p>
          </div>
          <div className="card-content">
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        New submission to <span className="font-medium">{activity.formTitle}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-description">Get started with common tasks</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/forms/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Create Form</p>
                <p className="text-sm text-gray-600">Build a new form</p>
              </div>
            </Link>

            <Link
              to="/forms"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">View Forms</p>
                <p className="text-sm text-gray-600">Manage existing forms</p>
              </div>
            </Link>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
              <TrendingUp className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-600">View form insights</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
              <Clock className="h-6 w-6 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Recent</p>
                <p className="text-sm text-gray-600">Latest submissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
     
    </div>
  )
}

export default Dashboard