// Backend API Configuration
// Single source of truth for backend URL

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const API_ROUTES = {
  ADM_PREDICT: `${API_BASE_URL}/api/adm/predict`,
  DIARIZE: `${API_BASE_URL}/api/diarize`,
};
