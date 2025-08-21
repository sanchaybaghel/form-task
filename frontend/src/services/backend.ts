import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://form-task-t5ak.onrender.com/api';

const backend = axios.create({
  baseURL: API_BASE_URL
});


export default backend;
