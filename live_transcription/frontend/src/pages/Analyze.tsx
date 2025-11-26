import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Mic, Activity, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalysisStore } from '@/store/analysisStore';
import { analyzeText, uploadFile, uploadVideo } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResultsSegments from '@/components/ResultsSegments';
import ResultsHighlights from '@/components/ResultsHighlights';
import ResultsCharts from '@/components/ResultsCharts';
import ResultsJson from '@/components/ResultsJson';
import LiveRecording from '@/components/LiveRecording';
import FileUploadModal from '@/components/FileUploadModal';
import VideoUploadModal from '@/components/VideoUploadModal';

const Analyze = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { toast } = useToast();
  
  const {
    currentText,
    debaters,
    currentAnalysis,
    isAnalyzing,
    setCurrentText,
    addDebater,
    removeDebater,
    updateDebater,
    setCurrentAnalysis,
    setIsAnalyzing,
    addRecentRun,
  } = useAnalysisStore();

  const [showFileModal, setShowFileModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const analyzeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-analyze with debounce when text changes
  const autoAnalyze = useCallback(async (text: string) => {
    if (!text.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const response = await analyzeText(text);
      const run = {
        id: response.run_id || crypto.randomUUID(),
        timestamp: new Date(),
        text: text,
        segments: response.segments.map((seg, idx) => ({
          id: `${response.run_id}-${idx}`,
          text: seg.text,
          label: seg.label,
          confidence: seg.confidence,
          startIndex: seg.start_index,
          endIndex: seg.end_index,
        })),
        source: (mode as any) || 'paste',
        debaters: mode === 'paste' ? debaters : undefined,
      };
      
      setCurrentAnalysis(run);
      addRecentRun(run);
    } catch (error: any) {
      console.error('Auto-analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [mode, debaters, isAnalyzing, setIsAnalyzing, setCurrentAnalysis, addRecentRun]);

  // Debounced auto-analysis
  useEffect(() => {
    const textToAnalyze = mode === 'paste' 
      ? debaters.map(d => `${d.name}: ${d.text}`).join('\n\n')
      : currentText;

    if (analyzeTimerRef.current) {
      clearTimeout(analyzeTimerRef.current);
    }

    if (textToAnalyze.trim()) {
      analyzeTimerRef.current = setTimeout(() => {
        autoAnalyze(textToAnalyze);
      }, 1500); // 1.5 second debounce
    }

    return () => {
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current);
      }
    };
  }, [currentText, debaters, mode, autoAnalyze]);

  useEffect(() => {
    if (mode === 'file') {
      setShowFileModal(true);
    } else if (mode === 'video') {
      setShowVideoModal(true);
    }
  }, [mode]);

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const response = await uploadFile(file);
      const extractedText = response.segments.map((s) => s.text).join(' ');
      setCurrentText(extractedText);
      
      const run = {
        id: response.run_id || crypto.randomUUID(),
        timestamp: new Date(),
        text: extractedText,
        segments: response.segments.map((seg, idx) => ({
          id: `${response.run_id}-${idx}`,
          text: seg.text,
          label: seg.label,
          confidence: seg.confidence,
          startIndex: seg.start_index,
          endIndex: seg.end_index,
        })),
        source: 'file' as const,
      };
      
      setCurrentAnalysis(run);
      addRecentRun(run);
      setShowFileModal(false);
      
      toast({
        title: 'File processed',
        description: `Extracted and analyzed text from ${file.name}`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to process file.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const response = await uploadVideo(file);
      const extractedText = response.segments.map((s) => s.text).join(' ');
      setCurrentText(extractedText);
      
      const run = {
        id: response.run_id || crypto.randomUUID(),
        timestamp: new Date(),
        text: extractedText,
        segments: response.segments.map((seg, idx) => ({
          id: `${response.run_id}-${idx}`,
          text: seg.text,
          label: seg.label,
          confidence: seg.confidence,
          startIndex: seg.start_index,
          endIndex: seg.end_index,
        })),
        source: 'video' as const,
      };
      
      setCurrentAnalysis(run);
      addRecentRun(run);
      setShowVideoModal(false);
      
      toast({
        title: 'Video processed',
        description: `Extracted and analyzed text from ${file.name}`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to process video.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecordingComplete = (text: string) => {
    setCurrentText(text);
    toast({
      title: 'Recording complete',
      description: 'Transcription complete. Analysis will update automatically.',
    });
  };

  const handleCloseModal = (modalSetter: (value: boolean) => void) => {
    modalSetter(false);
    navigate('/analyze', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Live Analysis Workbench</h1>
              <p className="text-xs text-muted-foreground">Analysis updates automatically as you type</p>
            </div>
            <div className="flex items-center gap-3">
              {isAnalyzing && (
                <Badge variant="secondary" className="animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  Analyzing...
                </Badge>
              )}
              {mode !== 'record' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/analyze?mode=record')}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Record
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                File
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Text Editor or Live Recording */}
          <Card className="p-6 flex flex-col border-2">
            {mode === 'record' ? (
              <LiveRecording onComplete={handleRecordingComplete} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {mode === 'paste' ? 'Debate Input' : 'Input Text'}
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {mode === 'paste' && <Users className="w-3 h-3 mr-1" />}
                    {mode === 'paste' ? `${debaters.length} Debaters` : 'Live Mode'}
                  </Badge>
                </div>
                
                {mode === 'paste' ? (
                  <div className="flex-1 flex flex-col gap-4 overflow-auto">
                    {debaters.map((debater, index) => (
                      <div key={debater.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={debater.name}
                            onChange={(e) => updateDebater(debater.id, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm font-medium border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Debater name"
                          />
                          {debaters.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDebater(debater.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <Textarea
                          value={debater.text}
                          onChange={(e) => updateDebater(debater.id, 'text', e.target.value)}
                          placeholder={`Enter ${debater.name}'s argument...`}
                          className="min-h-[120px] resize-none font-mono text-sm"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addDebater}
                      className="w-full border-dashed"
                    >
                      + Add New Debater
                    </Button>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Paste or type your text here. Analysis will update automatically..."
                      className="flex-1 resize-none font-mono text-sm"
                    />
                    
                    <div className="mt-4 text-xs text-muted-foreground">
                      {currentText.length} characters • {currentText.split(/\s+/).filter(Boolean).length} words
                    </div>
                  </>
                )}
              </>
            )}
          </Card>

          {/* Right Panel - Live Results */}
          <Card className="p-6 flex flex-col overflow-hidden border-2">
            {!currentAnalysis ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Activity className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Live Analysis Ready</h3>
                    <p className="text-sm text-muted-foreground">
                      Start typing or use Record/Upload buttons.<br />
                      Analysis will update automatically.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="segments" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="segments">Segments</TabsTrigger>
                  <TabsTrigger value="highlights">Highlights</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-auto mt-4">
                  <TabsContent value="segments" className="mt-0">
                    <ResultsSegments segments={currentAnalysis.segments} />
                  </TabsContent>
                  
                  <TabsContent value="highlights" className="mt-0">
                    <ResultsHighlights
                      text={currentAnalysis.text}
                      segments={currentAnalysis.segments}
                    />
                  </TabsContent>
                  
                  <TabsContent value="charts" className="mt-0">
                    <ResultsCharts segments={currentAnalysis.segments} />
                  </TabsContent>
                  
                  <TabsContent value="json" className="mt-0">
                    <ResultsJson analysis={currentAnalysis} />
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </Card>
        </div>
      </main>

      {/* Modals */}
      <FileUploadModal
        open={showFileModal}
        onClose={() => handleCloseModal(setShowFileModal)}
        onUpload={handleFileUpload}
      />
      
      <VideoUploadModal
        open={showVideoModal}
        onClose={() => handleCloseModal(setShowVideoModal)}
        onUpload={handleVideoUpload}
      />
    </div>
  );
};

export default Analyze;
