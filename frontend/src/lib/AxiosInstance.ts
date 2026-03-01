import axios from 'axios';

const AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/',
    // baseURL: 'https://bookappoiment.onrender.com/api/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Add a request interceptor to add the access token
AxiosInstance.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
AxiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error("No refresh token");

                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/'}token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return axios(originalRequest);
            } catch (refreshError) {
                console.warn("Session expired. Redirecting to login.");
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                if (typeof window !== 'undefined') {
                    window.location.href = '/';
                }
                return Promise.reject(refreshError);
            }
        }

        // Log network errors more clearly
        if (error.message === 'Network Error') {
            console.error("Network Error: Backend might be down or Database connection failed.");
        }

        return Promise.reject(error);
    }
);

export default AxiosInstance;
