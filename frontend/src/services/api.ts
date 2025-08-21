import backend from './backend';

// Form related API calls
export const formService = {
  // Get all forms
  getForms: (params: Record<string, any> = {}) => backend.get('/forms', { params }),

  // Get single form by ID
  getForm: (id: string) => backend.get(`/forms/${id}`),

  // Create new form
  createForm: (formData: any) => backend.post('/forms', formData),

  // Update form
  updateForm: (id: string, formData: any) => backend.put(`/forms/${id}`, formData),

  // Delete form
  deleteForm: (id: string) => backend.delete(`/forms/${id}`),

  // Toggle publish
  togglePublish: (id: string, isPublished: boolean) =>
    backend.patch(`/forms/${id}/publish`, { isPublished }),

  // Submit form
  submitForm: (formId: string, data: any) =>
    backend.post(`/forms/${formId}/submissions`, data),

  // Get submissions
  getSubmissions: (formId: string, params: Record<string, any> = {}) =>
    backend.get(`/forms/${formId}/submissions`, { params }),

  // Get single submission
  getSubmission: (formId: string, submissionId: string) =>
    backend.get(`/forms/${formId}/submissions/${submissionId}`),

  // Auth
  login: (credentials: any) => backend.post('/auth/login', credentials),
  register: (userData: any) => backend.post('/auth/register', userData),
};
