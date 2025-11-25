import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Segment {
  id: string;
  text: string;
  label: 'Claim' | 'Evidence' | 'Non-informative';
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface Debater {
  id: string;
  name: string;
  text: string;
}

export interface AnalysisRun {
  id: string;
  timestamp: Date;
  text: string;
  segments: Segment[];
  source: 'paste' | 'record' | 'file' | 'video';
  debaters?: Debater[];
}

interface AnalysisState {
  currentText: string;
  debaters: Debater[];
  currentAnalysis: AnalysisRun | null;
  recentRuns: AnalysisRun[];
  isAnalyzing: boolean;
  
  setCurrentText: (text: string) => void;
  setDebaters: (debaters: Debater[]) => void;
  addDebater: () => void;
  removeDebater: (id: string) => void;
  updateDebater: (id: string, field: 'name' | 'text', value: string) => void;
  setCurrentAnalysis: (analysis: AnalysisRun | null) => void;
  addRecentRun: (run: AnalysisRun) => void;
  setIsAnalyzing: (value: boolean) => void;
  clearCurrentAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentText: '',
      debaters: [{ id: crypto.randomUUID(), name: 'Debater 1', text: '' }],
      currentAnalysis: null,
      recentRuns: [],
      isAnalyzing: false,

      setCurrentText: (text) => set({ currentText: text }),
      
      setDebaters: (debaters) => set({ debaters }),
      
      addDebater: () =>
        set((state) => ({
          debaters: [
            ...state.debaters,
            {
              id: crypto.randomUUID(),
              name: `Debater ${state.debaters.length + 1}`,
              text: '',
            },
          ],
        })),
      
      removeDebater: (id) =>
        set((state) => ({
          debaters: state.debaters.filter((d) => d.id !== id),
        })),
      
      updateDebater: (id, field, value) =>
        set((state) => ({
          debaters: state.debaters.map((d) =>
            d.id === id ? { ...d, [field]: value } : d
          ),
        })),
      
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      
      addRecentRun: (run) =>
        set((state) => ({
          recentRuns: [run, ...state.recentRuns].slice(0, 5),
        })),
      
      setIsAnalyzing: (value) => set({ isAnalyzing: value }),
      
      clearCurrentAnalysis: () =>
        set({ currentAnalysis: null, currentText: '', debaters: [{ id: crypto.randomUUID(), name: 'Debater 1', text: '' }] }),
    }),
    {
      name: 'adm-analysis-storage',
      partialize: (state) => ({ recentRuns: state.recentRuns }),
    }
  )
);
