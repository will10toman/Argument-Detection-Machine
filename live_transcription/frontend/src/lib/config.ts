// Backend API Configuration
// Toggle between local development and production

const ENV = import.meta.env.MODE || 'development';

export const API_CONFIG = {
  // ADM Analysis API (existing)
  ADM_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // Diarization API
  DIARIZATION_BASE_URL: ENV === 'production' 
    ? 'https://myserver.com'  // Update this when deploying to production
    : 'http://127.0.0.1:8000',
};

export const getApiUrl = (service: 'adm' | 'diarization'): string => {
  return service === 'adm' ? API_CONFIG.ADM_BASE_URL : API_CONFIG.DIARIZATION_BASE_URL;
};
