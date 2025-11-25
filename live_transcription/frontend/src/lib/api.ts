import { Segment } from '@/store/analysisStore';
import { API_BASE_URL, API_ROUTES } from './config';

export interface ADMResponse {
  label: 'claim' | 'evidence' | 'non_info';
}

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

export const classifyText = async (text: string): Promise<string> => {
  const res = await fetch(API_ROUTES.ADM_PREDICT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error('ADM request failed');

  const data: ADMResponse = await res.json();
  return data.label;
};

export const analyzeText = async (text: string): Promise<AnalyzeTextResponse> => {
  const label = await classifyText(text);
  
  // Convert single label response to segment format for UI compatibility
  const normalizedLabel = label === 'claim' ? 'Claim' 
    : label === 'evidence' ? 'Evidence' 
    : 'Non-informative';
  
  return {
    run_id: `run_${Date.now()}`,
    segments: [{
      text: text,
      label: normalizedLabel,
      confidence: 1.0,
      start_index: 0,
      end_index: text.length,
    }],
  };
};

// Placeholder functions for file upload (not implemented in new backend)
export const uploadFile = async (file: File): Promise<AnalyzeTextResponse> => {
  throw new Error('File upload not yet implemented in backend');
};

export const uploadVideo = async (file: File): Promise<AnalyzeTextResponse> => {
  throw new Error('Video upload not yet implemented in backend');
};

export const getRunDetail = async (runId: string): Promise<AnalyzeTextResponse> => {
  throw new Error('Run detail not yet implemented in backend');
};

export const exportRunCSV = async (runId: string): Promise<Blob> => {
  throw new Error('CSV export not yet implemented in backend');
};

export const exportRunJSON = async (runId: string): Promise<Blob> => {
  throw new Error('JSON export not yet implemented in backend');
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

// Diarization API
export interface DiarizationSegment {
  speaker: string;
  start: number;
  end: number;
}

export const diarizeAudio = async (audioBlob: Blob): Promise<DiarizationSegment[]> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  
  const response = await fetch(API_ROUTES.DIARIZE, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Diarization request failed');
  }
  
  const data = await response.json();
  return data.segments;
};
