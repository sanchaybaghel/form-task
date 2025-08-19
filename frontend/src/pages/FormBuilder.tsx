import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { 
  Plus, 
  Save, 
  Eye, 
  Settings,
  Trash2,
  Copy,
  Type,
  Mail,
  List,
  CheckSquare,
  Circle,
  AlignLeft,
  Upload,
  GripVertical,
  X
} from 'lucide-react'
import axios from 'axios'

interface FormField {
  id: string
  type: 'text' | 'email' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file'
  label: string
  placeholder?: string
  required: boolean
  fileData?: {
    base64: string
    name: string
    type: string
  }
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    fileTypes?: string[]
    maxFileSize?: number
  }
  options?: Array<{ label: string; value: string }>
  order: number
  settings?: {
    multiple?: boolean
    defaultValue?: any
  }
}

interface Form {
  _id?: string
  title: string
  description: string
  fields: FormField[]
  settings: {
    isPublished: boolean
    allowMultipleSubmissions: boolean
    maxSubmissions?: number
    thankYouMessage: string
    redirectUrl?: string
    theme: {
      primaryColor: string
      backgroundColor: string
    }
  }
}

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'email', label: 'Email Input', icon: Mail },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio Button', icon: Circle },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft },
  { type: 'file', label: 'File Upload', icon: Upload },
]

const FormBuilder = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>({
    title: '',
    description: '',
    fields: [],
    settings: {
      isPublished: false,
      allowMultipleSubmissions: true,
      thankYouMessage: 'Thank you for your submission!',
      theme: {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff'
      }
    }
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (id && id !== 'new') {
      fetchForm()
    }
  }, [id])

  const fetchForm = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/forms/${id}`)
      setForm(response.data)
    } catch (error) {
      console.error('Failed to fetch form:', error)
    } finally {
      setLoading(false)
    }
  }

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType as FormField['type'],
      label: `New ${fieldType} field`,
      required: false,
      order: form.fields.length,
      options: fieldType === 'select' || fieldType === 'radio' ? [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ] : undefined
    }
    
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
    setSelectedField(newField)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }))
  }

  const deleteField = (fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }))
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const duplicateField = (field: FormField) => {
    const newField: FormField = {
      ...field,
      id: `field_${Date.now()}`,
      label: `${field.label} (Copy)`,
      order: form.fields.length
    }
    
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(form.fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }))

    setForm(prev => ({
      ...prev,
      fields: updatedItems
    }))
  }

  const saveForm = async () => {
    // Frontend validation
    if (!form.title || form.title.trim().length === 0 || form.title.length > 100) {
      alert('Form title is required and must be less than 100 characters')
      return
    }

    for (const field of form.fields) {
      if (!field.label || field.label.trim().length === 0 || field.label.length > 100) {
        alert(`Field label is required and must be less than 100 characters. Problematic field: ${field.label || '(empty)'}`)
        return
      }
    }

    try {
      setSaving(true)
      
      if (id && id !== 'new') {
        await axios.put(`/api/forms/${id}`, form)
      } else {
        const response = await axios.post('/api/forms', form)
        navigate(`/forms/${response.data._id}/edit`)
        return
      }
      
      alert('Form saved successfully!')
    } catch (error: any) {
      console.error('Failed to save form:', error)
      const message = error.response?.data?.message || error.message || 'Unknown error'
      alert(`Failed to save form: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const publishForm = async () => {
    try {
      await axios.patch(`/api/forms/${id}/publish`, {
        isPublished: !form.settings.isPublished
      })
      
      setForm(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          isPublished: !prev.settings.isPublished
        }
      }))
      
      alert(form.settings.isPublished ? 'Form unpublished' : 'Form published!')
    } catch (error) {
      console.error('Failed to update form status:', error)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">
            {id === 'new' ? 'Create New Form' : 'Edit Form'}
          </h1>
          <p className="text-gray-600">Build your form with drag and drop</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
          {id !== 'new' && (
            <button
              onClick={publishForm}
              className={`btn ${form.settings.isPublished ? 'btn-secondary' : 'btn-primary'}`}
            >
              {form.settings.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          )}
          <button
            onClick={saveForm}
            disabled={saving}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Field Types Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Field Types</h3>
              <p className="card-description">Drag fields to your form</p>
            </div>
            <div className="card-content">
              <div className="space-y-2">
                {fieldTypes.map((fieldType) => {
                  const Icon = fieldType.icon
                  return (
                    <button
                      key={fieldType.type}
                      onClick={() => addField(fieldType.type)}
                      className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <Icon className="h-5 w-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">
                        {fieldType.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Form Builder */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <input
                type="text"
                placeholder="Form Title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none w-full"
              />
              <input
                type="text"
                placeholder="Form Description (optional)"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="text-gray-600 bg-transparent border-none outline-none w-full"
              />
            </div>
            <div className="card-content">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="form-fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="min-h-[400px] p-4 border-2 border-dashed border-gray-300 rounded-lg"
                    >
                      {form.fields.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500">Drag field types here to build your form</p>
                        </div>
                      ) : (
                        form.fields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`mb-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedField?.id === field.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedField(field)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        duplicateField(field)
                                      }}
                                      className="text-orange-600 hover:text-orange-900"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteField(field.id)
                                      }}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                  className="w-full font-medium text-gray-900 bg-transparent border-none outline-none mb-2"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                
                                {/* Field Preview */}
                                <div className="mt-3">
                                  {field.type === 'text' && (
                                    <input
                                      type="text"
                                      placeholder={field.placeholder || 'Enter text...'}
                                      className="input w-full"
                                      disabled
                                    />
                                  )}
                                  {field.type === 'email' && (
                                    <input
                                      type="email"
                                      placeholder={field.placeholder || 'Enter email...'}
                                      className="input w-full"
                                      disabled
                                    />
                                  )}
                                  {field.type === 'textarea' && (
                                    <textarea
                                      placeholder={field.placeholder || 'Enter text...'}
                                      className="input w-full"
                                      rows={3}
                                      disabled
                                    />
                                  )}
                                  {field.type === 'select' && (
                                    <select className="input w-full" disabled>
                                      {field.options?.map((option, idx) => (
                                        <option key={idx} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  {field.type === 'checkbox' && (
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600"
                                        disabled
                                      />
                                      <span className="ml-2 text-sm text-gray-600">Option</span>
                                    </div>
                                  )}
                                  {field.type === 'radio' && (
                                    <div className="space-y-2">
                                      {field.options?.map((option, idx) => (
                                        <div key={idx} className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`radio-${field.id}`}
                                            className="h-4 w-4 text-blue-600"
                                            disabled
                                          />
                                          <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {field.type === 'file' && (
                                    <div
                                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
                                      onClick={() => {
                                        const fileInput = document.getElementById(`file-input-${field.id}`) as HTMLInputElement | null;
                                        if (fileInput) {
                                          fileInput.click();
                                        }
                                      }}
                                    >
                                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-600">Click to upload files</p>
                                      <input
                                        type="file"
                                        id={`file-input-${field.id}`}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={(e) => {
                                          const files = e.target.files;
                                          if (files && files.length > 0) {
                                            const file = files[0];
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              updateField(field.id, { 
                                                fileData: {
                                                  base64: event.target?.result as string,
                                                  name: file.name,
                                                  type: file.type
                                                }
                                              });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                      {field.fileData?.base64 && (
                                        <div className="mt-2">
                                          <img
                                            src={field.fileData.base64}
                                            alt="Uploaded preview"
                                            className="mx-auto max-h-40"
                                          />
                                          <p className="text-xs text-gray-500 mt-1">{field.fileData.name}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 flex items-center space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={field.required}
                                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                      className="h-4 w-4 text-blue-600"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Required</span>
                                  </label>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </div>

        {/* Field Properties */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Field Properties</h3>
              <p className="card-description">Configure selected field</p>
            </div>
            <div className="card-content">
              {selectedField ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Type
                    </label>
                    <p className="text-sm text-gray-600 capitalize">{selectedField.type}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  
                  {(selectedField.type === 'text' || selectedField.type === 'email' || selectedField.type === 'textarea') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  )}
                  
                  {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options
                      </label>
                      <div className="space-y-2">
                        {selectedField.options?.map((option, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...(selectedField.options || [])]
                                newOptions[index] = { ...option, label: e.target.value }
                                updateField(selectedField.id, { options: newOptions })
                              }}
                              className="input flex-1"
                              placeholder="Option label"
                            />
                            <input
                              type="text"
                              value={option.value}
                              onChange={(e) => {
                                const newOptions = [...(selectedField.options || [])]
                                newOptions[index] = { ...option, value: e.target.value }
                                updateField(selectedField.id, { options: newOptions })
                              }}
                              className="input flex-1"
                              placeholder="Option value"
                            />
                            <button
                              onClick={() => {
                                const newOptions = selectedField.options?.filter((_, idx) => idx !== index)
                                updateField(selectedField.id, { options: newOptions })
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newOptions = [...(selectedField.options || []), { label: 'New Option', value: 'new_option' }]
                            updateField(selectedField.id, { options: newOptions })
                          }}
                          className="btn btn-outline w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedField.required}
                        onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Required field</span>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Select a field to configure its properties
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Form Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thank You Message
                </label>
                <textarea
                  value={form.settings.thankYouMessage}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, thankYouMessage: e.target.value }
                  }))}
                  className="input w-full"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Redirect URL (optional)
                </label>
                <input
                  type="url"
                  value={form.settings.redirectUrl || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, redirectUrl: e.target.value }
                  }))}
                  className="input w-full"
                  placeholder="https://example.com/thank-you"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.settings.allowMultipleSubmissions}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowMultipleSubmissions: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow multiple submissions from same user</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Submissions (optional)
                </label>
                <input
                  type="number"
                  value={form.settings.maxSubmissions || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, maxSubmissions: e.target.value ? parseInt(e.target.value) : undefined }
                  }))}
                  className="input w-full"
                  placeholder="100"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-primary"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormBuilder 