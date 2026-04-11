import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Automatically handle expired tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is definitively expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─────────────────────────── Auth ────────────────────────────────────────────
export const authApi = {
    login:              (credentials) => api.post('/auth/login', credentials),
    registerInstitution:(data)        => api.post('/auth/register-institution', data),
    registerVerifier:   (data)        => api.post('/auth/register-verifier', data),
    seedAdmin:          (data)        => api.post('/auth/seed-admin', data),
};

// ─────────────────────────── Institution ─────────────────────────────────────
export const institutionApi = {
    // Upload a student record – institutionId now comes from JWT server-side
    uploadRecord: (formData) => api.post('/institution/upload-record', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    // Get all records for the logged-in institution
    getRecords:   ()       => api.get('/institution/records'),
    // Get own profile
    getProfile:   ()       => api.get('/institution/profile'),
    // Delete a record
    deleteRecord: (id)     => api.delete(`/institution/records/${id}`),
    // Use AI to extract data for form auto-fill
    extractAiData: (formData) => api.post('/verify/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─────────────────────────── Verify ──────────────────────────────────────────
export const verifyApi = {
    extractCertificate: (formData) => api.post('/verify/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    verifyCertificate: (data) => api.post('/verify/data', data),
    getLogs: () => api.get('/verify/logs'),
    getMyHistory: (name) => api.get(`/verify/my-history?verifierName=${encodeURIComponent(name)}`),
};

// ─────────────────────────── Admin ───────────────────────────────────────────
export const adminApi = {
    getInstitutions:      ()     => api.get('/admin/institutions'),
    getVerifications:     ()     => api.get('/admin/verifications'),
    getRecords:           ()     => api.get('/admin/records'),
    getStats:             ()     => api.get('/admin/stats'),
    authorizeInstitution: (id)   => api.post('/admin/authorize-institution', { institutionId: id }),
    revokeInstitution:    (id)   => api.post('/admin/revoke-institution',    { institutionId: id }),
};

export default api;
