import axios from 'axios'

const API = axios.create({ baseURL: 'https://hashmil-muahmmed08-mindcare-backend.hf.space' })

// Auto-attach JWT token
API.interceptors.request.use(config => {
    const token = localStorage.getItem('mindcare_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Handle 401
API.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('mindcare_token')
            localStorage.removeItem('mindcare_user')
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export default API
