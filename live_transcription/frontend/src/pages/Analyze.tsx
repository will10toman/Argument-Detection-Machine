import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Upload, Mic, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAnalysisStore } from '@/store/analysisStore';
import { analyzeText, uploadFile, uploadVideo } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResultsSegments from '@/components/ResultsSegments';
import ResultsHighlights from '@/components/ResultsHighlights';
import ResultsCharts from '@/components/ResultsCharts';
import ResultsJson from '@/components/ResultsJson';
import RecordingModal from '@/components/RecordingModal';
import FileUploadModal from '@/components/FileUploadModal';
import VideoUploadModal from '@/components/VideoUploadModal';
import DiarizationModal from '@/components/DiarizationModal';

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
    setDebaters,
    addDebater,
    removeDebater,
    updateDebater,
    setCurrentAnalysis,
    setIsAnalyzing,
    addRecentRun,
  } = useAnalysisStore();

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDiarizationModal, setShowDiarizationModal] = useState(false);

  useEffect(() => {
    if (mode === 'record') {
      setShowRecordModal(true);
    } else if (mode === 'file') {
      setShowFileModal(true);
    } else if (mode === 'video') {
      setShowVideoModal(true);
    } else if (mode === 'diarize') {
      setShowDiarizationModal(true);
    }
  }, [mode]);

  const handleAnalyze = async () => {
    const textToAnalyze = mode === 'paste' 
      ? debaters.map(d => `${d.name}: ${d.text}`).join('\n\n')
      : currentText;
    
    if (!textToAnalyze.trim()) {
      toast({
        title: 'No text to analyze',
        description: mode === 'paste' ? 'Please enter text for at least one debater.' : 'Please enter some text first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeText(textToAnalyze);
      const run = {
        id: response.run_id || crypto.randomUUID(),
        timestamp: new Date(),
        text: textToAnalyze,
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
      
      toast({
        title: 'Analysis complete',
        description: `Found ${run.segments.length} segments.`,
      });
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.response?.data?.message || 'Failed to analyze text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    setShowRecordModal(false);
    toast({
      title: 'Recording complete',
      description: 'Transcription ready for analysis.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Analysis Workbench</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecordModal(true)}
              >
                <Mic className="w-4 h-4 mr-2" />
                Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiarizationModal(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Diarize
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Text Editor */}
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {mode === 'paste' ? 'Debate Input' : 'Input Text'}
              </h2>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (mode === 'paste' ? debaters.every(d => !d.text.trim()) : !currentText.trim())}
                className="bg-gradient-primary"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Analyze
              </Button>
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
                  placeholder="Paste or type your text here for analysis..."
                  className="flex-1 resize-none font-mono text-sm"
                />
                
                <div className="mt-4 text-xs text-muted-foreground">
                  {currentText.length} characters • {currentText.split(/\s+/).filter(Boolean).length} words
                </div>
              </>
            )}
          </Card>

          {/* Right Panel - Results */}
          <Card className="p-6 flex flex-col overflow-hidden">
            {!currentAnalysis ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter text and click Analyze to see results
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
      <RecordingModal
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onComplete={handleRecordingComplete}
      />
      
      <FileUploadModal
        open={showFileModal}
        onClose={() => setShowFileModal(false)}
        onUpload={handleFileUpload}
      />
      
      <VideoUploadModal
        open={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onUpload={handleVideoUpload}
      />
      
      <DiarizationModal
        open={showDiarizationModal}
        onClose={() => setShowDiarizationModal(false)}
      />
    </div>
  );
};

export default Analyze;
