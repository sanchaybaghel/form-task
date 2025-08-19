import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FormBuilder from './pages/FormBuilder'
import FormList from './pages/FormList'
import FormSubmissions from './pages/FormSubmissions'
import FormAnalytics from './pages/FormAnalytics'
import PublicForm from './pages/PublicForm'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="forms" element={<FormList />} />
        <Route path="forms/new" element={<FormBuilder />} />
        <Route path="forms/:id/edit" element={<FormBuilder />} />
        <Route path="forms/:id/submissions" element={<FormSubmissions />} />
        <Route path="forms/:id/analytics" element={<FormAnalytics />} />
      </Route>
      <Route path="/form/:id" element={<PublicForm />} />
    </Routes>
  )
}

export default App 