import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Activity, MessageSquare, Users, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { diarizeAudio, DiarizationSegment, analyzeText } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface TranscriptSegment {
  text: string;
  timestamp: number;
  speaker?: string;
}

interface AnalyzedSegment {
  text: string;
  label: 'Claim' | 'Evidence' | 'Non-informative';
  confidence: number;
  speaker?: string;
}

const LiveAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [diarizationSegments, setDiarizationSegments] = useState<DiarizationSegment[]>([]);
  const [analyzedSegments, setAnalyzedSegments] = useState<AnalyzedSegment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');
  const analyzeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
      'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
      'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
      'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30',
    ];
    const speakerIndex = parseInt(speaker.replace('spk_', '')) || 0;
    return colors[speakerIndex % colors.length];
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Claim':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'Evidence':
        return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
      case 'Non-informative':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const analyzeTranscript = async (text: string) => {
    if (!text.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const response = await analyzeText(text);
      const newAnalyzedSegments = response.segments.map(seg => ({
        text: seg.text,
        label: seg.label,
        confidence: seg.confidence,
      }));
      
      setAnalyzedSegments(prev => [...prev, ...newAnalyzedSegments]);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    try {
      // Start audio recording for diarization
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            const diarization = await diarizeAudio(event.data);
            if (diarization && diarization.length > 0) {
              setDiarizationSegments(prev => [...prev, ...diarization]);
            }
          } catch (err) {
            console.error('Diarization error:', err);
          }
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(500);

      // Start speech recognition for transcription
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            setTranscriptSegments(prev => [...prev, {
              text: finalTranscript.trim(),
              timestamp: Date.now(),
            }]);

            // Buffer transcript for analysis
            transcriptBufferRef.current += finalTranscript;
            
            // Debounce analysis - analyze every 3 seconds of speech
            if (analyzeTimerRef.current) {
              clearTimeout(analyzeTimerRef.current);
            }
            
            analyzeTimerRef.current = setTimeout(() => {
              if (transcriptBufferRef.current.trim()) {
                analyzeTranscript(transcriptBufferRef.current);
                transcriptBufferRef.current = '';
              }
            }, 3000);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setIsRecording(true);
      setTranscriptSegments([]);
      setDiarizationSegments([]);
      setAnalyzedSegments([]);

      toast({
        title: 'Live analysis started',
        description: 'Speak naturally. Your speech is being transcribed, diarized, and analyzed in real-time.',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Microphone error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (analyzeTimerRef.current) {
      clearTimeout(analyzeTimerRef.current);
    }

    // Analyze any remaining buffered text
    if (transcriptBufferRef.current.trim()) {
      await analyzeTranscript(transcriptBufferRef.current);
      transcriptBufferRef.current = '';
    }

    setIsRecording(false);
    
    toast({
      title: 'Recording stopped',
      description: 'Analysis complete.',
    });
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Live Analysis</h1>
                <p className="text-sm text-muted-foreground">Real-time transcription, diarization & claim detection</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isRecording && (
                <Badge variant="secondary" className="animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
              
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                size="lg"
                variant={isRecording ? 'destructive' : 'default'}
                className="min-w-[140px]"
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5 mr-2 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Transcription */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Live Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {transcriptSegments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    {isRecording ? 'Listening...' : 'Start recording to see transcription'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transcriptSegments.map((segment, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/50 animate-fade-in">
                        <p className="text-sm">{segment.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Speaker Diarization */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Speaker Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {diarizationSegments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    {isRecording ? 'Detecting speakers...' : 'Start recording to detect speakers'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diarizationSegments.map((segment, idx) => (
                      <div key={idx} className="animate-fade-in">
                        <Badge 
                          variant="outline" 
                          className={`${getSpeakerColor(segment.speaker)} mb-2`}
                        >
                          {segment.speaker.toUpperCase()}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(segment.start)} → {formatTime(segment.end)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Claim & Evidence Analysis */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Claim & Evidence
                {isAnalyzing && (
                  <Badge variant="secondary" className="ml-2 animate-pulse">
                    Analyzing...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {analyzedSegments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    {isRecording ? 'Analysis will appear here...' : 'Start recording to see analysis'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyzedSegments.map((segment, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border animate-fade-in">
                        <Badge 
                          variant="outline" 
                          className={`${getLabelColor(segment.label)} mb-2`}
                        >
                          {segment.label}
                        </Badge>
                        <p className="text-sm mt-2">{segment.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            Confidence: {(segment.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LiveAnalysis;
