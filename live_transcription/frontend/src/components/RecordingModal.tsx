import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Users, MessageSquare, Brain } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { diarizeAudio, DiarizationSegment, analyzeText } from '@/lib/api';

interface RecordingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (text: string) => void;
}

interface AnalyzedSegment {
  text: string;
  label: 'Claim' | 'Evidence' | 'Non-informative';
  confidence: number;
}

const RecordingModal = ({ open, onClose, onComplete }: RecordingModalProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [diarizationSegments, setDiarizationSegments] = useState<DiarizationSegment[]>([]);
  const [analyzedSegments, setAnalyzedSegments] = useState<AnalyzedSegment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptBufferRef = useRef<string>('');
  const analyzeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

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
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const analyzeTranscript = async (text: string) => {
    if (!text.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const response = await analyzeText(text);
      const newSegments = response.segments.map(seg => ({
        text: seg.text,
        label: seg.label,
        confidence: seg.confidence,
      }));
      
      setAnalyzedSegments(prev => [...prev, ...newSegments]);
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

      if (!SpeechRecognition) {
        toast({
          title: 'Not supported',
          description: 'Speech recognition is not supported in this browser.',
          variant: 'destructive',
        });
        stopRecording();
        return;
      }

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
          setTranscript(prev => prev + finalTranscript);
          transcriptBufferRef.current += finalTranscript;
          
          // Debounce analysis
          if (analyzeTimerRef.current) {
            clearTimeout(analyzeTimerRef.current);
          }
          
          analyzeTimerRef.current = setTimeout(() => {
            if (transcriptBufferRef.current.trim()) {
              analyzeTranscript(transcriptBufferRef.current);
              transcriptBufferRef.current = '';
            }
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast({
            title: 'Recording error',
            description: 'Speech recognition error. Please try again.',
            variant: 'destructive',
          });
        }
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      
      setIsRecording(true);
      setTranscript('');
      setDiarizationSegments([]);
      setAnalyzedSegments([]);

      toast({
        title: 'Recording started',
        description: 'Speak naturally. Live analysis is running...',
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
    setIsRecording(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (analyzeTimerRef.current) {
      clearTimeout(analyzeTimerRef.current);
    }

    // Analyze any remaining text
    if (transcriptBufferRef.current.trim()) {
      await analyzeTranscript(transcriptBufferRef.current);
      transcriptBufferRef.current = '';
    }
  };

  const handleComplete = () => {
    if (!transcript.trim()) {
      toast({
        title: 'No transcript',
        description: 'No speech was detected. Please try recording again.',
        variant: 'destructive',
      });
      return;
    }

    stopRecording();
    onComplete(transcript);
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Live Recording & Analysis
          </DialogTitle>
          <DialogDescription>
            Record audio with real-time transcription, speaker detection, and claim/evidence analysis
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Transcription Column */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Transcription
              </Badge>
            </div>
            <ScrollArea className="flex-1 border rounded-lg p-3">
              {transcript ? (
                <p className="text-sm whitespace-pre-wrap">{transcript}</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isRecording ? 'Listening...' : 'Transcript will appear here'}
                </p>
              )}
            </ScrollArea>
          </div>

          {/* Speaker Detection Column */}
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="text-xs w-fit">
              <Users className="w-3 h-3 mr-1" />
              Speakers ({diarizationSegments.length})
            </Badge>
            <ScrollArea className="flex-1 border rounded-lg p-3">
              {diarizationSegments.length > 0 ? (
                <div className="space-y-2">
                  {diarizationSegments.map((seg, idx) => (
                    <div key={idx} className="text-xs animate-fade-in">
                      <Badge 
                        variant="outline" 
                        className={`${getSpeakerColor(seg.speaker)} mb-1`}
                      >
                        {seg.speaker.toUpperCase()}
                      </Badge>
                      <div className="text-muted-foreground">
                        {formatTime(seg.start)} → {formatTime(seg.end)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isRecording ? 'Detecting speakers...' : 'Speakers will appear here'}
                </p>
              )}
            </ScrollArea>
          </div>

          {/* Analysis Column */}
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="text-xs w-fit">
              <Brain className="w-3 h-3 mr-1" />
              Analysis {isAnalyzing && '(analyzing...)'}
            </Badge>
            <ScrollArea className="flex-1 border rounded-lg p-3">
              {analyzedSegments.length > 0 ? (
                <div className="space-y-2">
                  {analyzedSegments.map((seg, idx) => (
                    <div key={idx} className="p-2 rounded border text-xs animate-fade-in">
                      <Badge 
                        variant="outline" 
                        className={`${getLabelColor(seg.label)} mb-1`}
                      >
                        {seg.label}
                      </Badge>
                      <p className="mt-1">{seg.text}</p>
                      <p className="text-muted-foreground mt-1">
                        {(seg.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isRecording ? 'Analysis will appear here...' : 'Claims & evidence will appear here'}
                </p>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="min-w-[140px]">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button 
                  variant="secondary" 
                  onClick={stopRecording}
                  className="min-w-[140px]"
                >
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Stop
                </Button>
                <Button onClick={handleComplete}>
                  Use Transcript
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingModal;
