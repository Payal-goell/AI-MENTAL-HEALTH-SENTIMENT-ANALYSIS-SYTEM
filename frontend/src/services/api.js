import axios from "axios";

const API_URL = "https://hashmil-muahmmed08-mindcare-backend.hf.space";

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 seconds to prevent premature drops of long ML/OpenRouter requests
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("mindcare_token") || localStorage.getItem("access_token");
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      // Use both .set() if available, or direct assignment to ensure it applies in all Axios versions
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors globally for the chat service as well
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mindcare_token");
      localStorage.removeItem("mindcare_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
