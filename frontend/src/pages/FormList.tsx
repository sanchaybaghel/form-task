import { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  BarChart3,
  Users,
  Calendar,
  FileText
} from 'lucide-react'
import backend from '../services/backend'

interface Form {
  _id: string
  title: string
  description: string
  settings: {
    isPublished: boolean
  }
  analytics: {
    totalSubmissions: number
  }
  createdAt: string
  fields?: any[] // <-- Add this line
}

const FormList = () => {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [latestSubmission, setLatestSubmission] = useState<any>(null)
  const [modalForm, setModalForm] = useState<Form | null>(null)
  const handleViewLatestSubmission = async (form: Form) => {
    try {
      setLoading(true)
      // Fetch latest submission for this form
      const res = await backend.get(`/submissions/form/${form._id}?page=1&limit=1`)
      const submission = res.data.submissions[0]
      setLatestSubmission(submission)
      setModalForm(form)
      setShowModal(true)
    } catch (error) {
      alert('Failed to fetch latest submission')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [searchTerm, statusFilter, currentPage])

  const fetchForms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

  const response = await backend.get(`/forms?${params}`)
      setForms(response.data.forms)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to fetch forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
  await backend.delete(`/forms/${formId}`)
        fetchForms()
      } catch (error) {
        console.error('Failed to delete form:', error)
      }
    }
  }

  const handleDuplicate = async (formId: string) => {
    try {
  await backend.post(`/forms/${formId}/duplicate`)
      fetchForms()
    } catch (error) {
      console.error('Failed to duplicate form:', error)
    }
  }

  const handlePublishToggle = async (formId: string, isPublished: boolean) => {
    try {
  await backend.patch(`/forms/${formId}/publish`, {
        isPublished: !isPublished
      })
      fetchForms()
    } catch (error) {
      console.error('Failed to update form status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-600">Manage your forms and view submissions</p>
        </div>
        <Link
          to="/forms/new"
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-auto"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Forms List */}
      <div className="card">
        <div className="card-content p-0">
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first form.
              </p>
              <div className="mt-6">
                <Link
                  to="/forms/new"
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forms.map((form) => (
                    <tr key={form._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {form.title}
                          </div>
                          {form.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {form.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            form.settings.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {form.settings.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {form.analytics.totalSubmissions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(form.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/form/${form._id}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Form"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleViewLatestSubmission(form)}
                            className="text-green-600 hover:text-green-900"
                            title="View Latest Submission"
                          >
                            <Users className="h-4 w-4" />
                          </button>
      {/* Modal for latest submission */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel="Latest Submission"
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          >
            &times;
          </button>
          <h2 className="text-xl font-bold mb-4">Latest Submission for: {modalForm?.title}</h2>
          {latestSubmission ? (
            <div className="space-y-4">
              {modalForm?.fields?.map((field: any) => {
                const fieldData = latestSubmission.data.find((d: any) => d.fieldId === field.id)
                if (!fieldData) return null
                return (
                  <div key={field.id} className="border-l-4 border-blue-200 pl-3">
                    <p className="font-medium text-gray-900">{field.label}</p>
                    <div className="text-gray-600">
                      {fieldData.files && fieldData.files.length > 0 ? (
                        <>
                          {fieldData.files.map((f: any, idx: number) => {
                            const isImage = f.filename.match(/\.(png|jpg|jpeg|gif)$/i)
                            const url = `${import.meta.env.VITE_BACKEND_URL?.replace('/api','') || 'http://localhost:4000'}/uploads/${f.filename}`
                            return isImage ? (
                              <img
                                key={idx}
                                src={url}
                                alt={f.originalName}
                                className="max-h-32 my-2 rounded border"
                              />
                            ) : (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                                {f.originalName}
                              </a>
                            )
                          })}
                        </>
                      ) : (
                        String(fieldData.value || '')
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p>No submissions found for this form.</p>
          )}
        </div>
      </Modal>
                          <Link
                            to={`/forms/${form._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Form"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/forms/${form._id}/submissions`}
                            className="text-green-600 hover:text-green-900"
                            title="View Submissions"
                          >
                            <Users className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/forms/${form._id}/analytics`}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Analytics"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(form._id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Duplicate Form"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(form._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Form"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormList