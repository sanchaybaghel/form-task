import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, Eye, Trash2, Calendar, Users } from 'lucide-react'
import axios from 'axios'

interface Submission {
  _id: string
  data: Array<{
    fieldId: string
    value: any
    files?: Array<{
      filename: string
      originalName: string
      path: string
    }>
  }>
  metadata: {
    submittedAt: string
    ipAddress: string
    userAgent: string
  }
  status: 'pending' | 'approved' | 'rejected'
}

interface Form {
  _id: string
  title: string
  fields: Array<{
    id: string
    label: string
    type: string
  }>
}

const FormSubmissions = () => {
  const { id } = useParams()
  const [form, setForm] = useState<Form | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    fetchForm()
    fetchSubmissions()
  }, [id, currentPage])

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`)
      setForm(response.data)
    } catch (error) {
      console.error('Failed to fetch form:', error)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/submissions/form/${id}?page=${currentPage}&limit=20`)
      setSubmissions(response.data.submissions)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (submissionId: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await axios.delete(`/api/submissions/${submissionId}`)
        fetchSubmissions()
      } catch (error) {
        console.error('Failed to delete submission:', error)
      }
    }
  }

  const exportCSV = async () => {
    try {
      const response = await axios.get(`/api/submissions/form/${id}/export`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `submissions-${id}-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export submissions:', error)
    }
  }

  const getFieldValue = (submission: Submission, fieldId: string) => {
    const fieldData = submission.data.find(d => d.fieldId === fieldId)
    if (!fieldData) return ''
    
    if (fieldData.files && fieldData.files.length > 0) {
      return fieldData.files.map(f => f.originalName).join(', ')
    }
    
    if (Array.isArray(fieldData.value)) {
      return fieldData.value.join(', ')
    }
    
    return String(fieldData.value || '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Form not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
          <p className="text-gray-600">{form.title}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportCSV}
            className="btn btn-outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="card">
        <div className="card-content p-0">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
              <p className="mt-1 text-sm text-gray-500">
                This form hasn't received any submissions yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    {form.fields.map(field => (
                      <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(submission.metadata.submittedAt).toLocaleDateString()}
                        </div>
                      </td>
                      {form.fields.map(field => (
                        <td key={field.id} className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={getFieldValue(submission, field.id)}>
                            {getFieldValue(submission, field.id)}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            submission.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : submission.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(submission._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
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

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Submission Details</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Submission Info</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <p className="text-gray-900">
                      {new Date(selectedSubmission.metadata.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">IP Address:</span>
                    <p className="text-gray-900">{selectedSubmission.metadata.ipAddress}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Responses</h4>
                <div className="space-y-3">
                  {form.fields.map(field => {
                    const fieldData = selectedSubmission.data.find(d => d.fieldId === field.id)
                    if (!fieldData) return null
                    
                    return (
                      <div key={field.id} className="border-l-4 border-blue-200 pl-3">
                        <p className="font-medium text-gray-900">{field.label}</p>
                        <p className="text-gray-600">
                          {fieldData.files && fieldData.files.length > 0
                            ? fieldData.files.map(f => f.originalName).join(', ')
                            : String(fieldData.value || '')
                          }
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormSubmissions 