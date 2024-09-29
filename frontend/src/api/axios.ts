import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',  // adjust this to your API URL
  withCredentials: true,  // This is important for sending cookies with requests
});

export default api;
