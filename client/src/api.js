import axios from 'axios';

// This creates one single instance of Axios that knows the URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});

export default API;