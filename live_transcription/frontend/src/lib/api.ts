import axios from 'axios';
import { Segment } from '@/store/analysisStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AnalyzeTextResponse {
  run_id: string;
  segments: Array<{
    text: string;
    label: 'Claim' | 'Evidence' | 'Non-informative';
    confidence: number;
    start_index: number;
    end_index: number;
  }>;
}

export const analyzeText = async (text: string): Promise<AnalyzeTextResponse> => {
  const response = await api.post<AnalyzeTextResponse>('/api/adm/analyze-text', { text });
  return response.data;
};

export const uploadFile = async (file: File): Promise<AnalyzeTextResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<AnalyzeTextResponse>('/api/adm/upload-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadVideo = async (file: File): Promise<AnalyzeTextResponse> => {
  const formData = new FormData();
  formData.append('video', file);
  
  const response = await api.post<AnalyzeTextResponse>('/api/adm/upload-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getRunDetail = async (runId: string): Promise<AnalyzeTextResponse> => {
  const response = await api.get<AnalyzeTextResponse>(`/api/adm/runs/${runId}`);
  return response.data;
};

export const exportRunCSV = async (runId: string): Promise<Blob> => {
  const response = await api.get(`/api/adm/runs/${runId}/export.csv`, {
    responseType: 'blob',
  });
  return response.data;
};

export const exportRunJSON = async (runId: string): Promise<Blob> => {
  const response = await api.get(`/api/adm/runs/${runId}/export.json`, {
    responseType: 'blob',
  });
  return response.data;
};

export const convertSegmentsToCSV = (segments: Segment[]): string => {
  const headers = ['Text', 'Label', 'Confidence'];
  const rows = segments.map((seg) => [
    `"${seg.text.replace(/"/g, '""')}"`,
    seg.label,
    seg.confidence.toFixed(4),
  ]);
  
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};
