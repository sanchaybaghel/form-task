import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface FormField {
  id: string
  type: 'text' | 'email' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file'
  label: string
  placeholder?: string
  required: boolean
  options?: Array<{ label: string; value: string }>
}

interface PublicForm {
  id: string
  title: string
  description: string
  fields: FormField[]
  settings: {
    theme: {
      primaryColor: string
      backgroundColor: string
    }
  }
}

interface FormData {
  [key: string]: any
}

const PublicForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<PublicForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File[] }>({})
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>()

  useEffect(() => {
    fetchForm()
  }, [id])

  const fetchForm = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/forms/${id}/public`)
      setForm(response.data)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Form not found or not published')
      } else {
        setError('Failed to load form')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (fieldId: string, files: FileList) => {
    const fileArray = Array.from(files)
    setUploadedFiles(prev => ({ ...prev, [fieldId]: fileArray }))
  }

  // Upload files for a specific field and return uploaded file metadata
  const uploadFilesForField = async (fieldId: string, files: File[]): Promise<Array<{ filename: string; originalName: string; size: number; mimetype: string; path: string }>> => {
    if (!files || files.length === 0) return []
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const res = await axios.post('/api/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.files || []
  }

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      setError(null)

      // Prepare submission data with file uploads handled
      const submissionData: Array<{ fieldId: string; value?: any; files?: any[] }> = []

      for (const field of form!.fields) {
        if (field.type === 'file' && uploadedFiles[field.id] && uploadedFiles[field.id].length > 0) {
          const uploaded = await uploadFilesForField(field.id, uploadedFiles[field.id])
          submissionData.push({
            fieldId: field.id,
            value: uploaded.map(f => f.path),
            files: uploaded,
          })
        } else if (field.type === 'checkbox') {
          submissionData.push({ fieldId: field.id, value: data[field.id] || false })
        } else {
          submissionData.push({ fieldId: field.id, value: data[field.id] })
        }
      }

      await axios.post('/api/submissions', {
        formId: form!.id,
        data: submissionData
      })

      setSubmitted(true)
    } catch (error: any) {
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else {
        setError('Failed to submit form')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your form has been submitted successfully.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    )
  }

  if (!form) {
    return null
  }

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: form.settings.theme.backgroundColor }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-header text-center">
            <h1 className="card-title" style={{ color: form.settings.theme.primaryColor }}>
              {form.title}
            </h1>
            {form.description && (
              <p className="card-description">{form.description}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="card-content space-y-6">
            {form.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'text' && (
                  <input
                    type="text"
                    {...register(field.id, { 
                      required: field.required && 'This field is required' 
                    })}
                    placeholder={field.placeholder}
                    className={`input w-full ${errors[field.id] ? 'border-red-500' : ''}`}
                  />
                )}
                
                {field.type === 'email' && (
                  <input
                    type="email"
                    {...register(field.id, { 
                      required: field.required && 'This field is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder={field.placeholder}
                    className={`input w-full ${errors[field.id] ? 'border-red-500' : ''}`}
                  />
                )}
                
                {field.type === 'textarea' && (
                  <textarea
                    {...register(field.id, { 
                      required: field.required && 'This field is required' 
                    })}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`input w-full ${errors[field.id] ? 'border-red-500' : ''}`}
                  />
                )}
                
                {field.type === 'select' && (
                  <select
                    {...register(field.id, { 
                      required: field.required && 'This field is required' 
                    })}
                    className={`input w-full ${errors[field.id] ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {field.type === 'checkbox' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register(field.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                )}
                
                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {field.options?.map((option, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="radio"
                          {...register(field.id, { 
                            required: field.required && 'This field is required' 
                          })}
                          value={option.value}
                          className="h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {field.type === 'file' && (
                  <div className="space-y-2">
                    <input
                      ref={(el) => { fileInputRefs.current[field.id] = el }}
                      type="file"
                      multiple
                      onChange={(e) => e.target.files && handleFileUpload(field.id, e.target.files)}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[field.id]?.click()}
                      className="btn btn-outline w-full"
                    >
                      Choose file(s)
                    </button>
                    {uploadedFiles[field.id] && (
                      <div className="text-sm text-gray-600">
                        {uploadedFiles[field.id].length} file(s) selected
                      </div>
                    )}
                  </div>
                )}
                
                {errors[field.id] && (
                  <p className="text-sm text-red-600">{String((errors as any)[field.id]?.message || 'Invalid value')}</p>
                )}
              </div>
            ))}
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
                style={{ backgroundColor: form.settings.theme.primaryColor }}
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PublicForm 