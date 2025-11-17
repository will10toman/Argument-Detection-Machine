import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { diarizeAudio, DiarizationSegment } from '@/lib/api';

interface DiarizationModalProps {
  open: boolean;
  onClose: () => void;
}

const DiarizationModal = ({ open, onClose }: DiarizationModalProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<DiarizationSegment[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();


  const startRecording = async () => {
    try {
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
            console.log('Sending audio chunk to backend...', event.data.size, 'bytes');
            const diarization = await diarizeAudio(event.data);
            console.log('Received diarization:', diarization);
            
            if (diarization && diarization.length > 0) {
              setSegments(prev => [...prev, ...diarization]);
            }
          } catch (err) {
            console.error('Backend diarization error:', err);
            toast({
              title: 'Diarization error',
              description: err instanceof Error ? err.message : 'Failed to process audio chunk.',
              variant: 'destructive',
            });
          }
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        toast({
          title: 'Recording error',
          description: 'Failed to record audio.',
          variant: 'destructive',
        });
        stopRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording with 500ms chunks
      mediaRecorder.start(500);
      setIsRecording(true);
      setSegments([]);

      toast({
        title: 'Recording started',
        description: 'Speaking... Audio is being analyzed in real-time.',
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Microphone error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    
    toast({
      title: 'Recording stopped',
      description: `Captured ${segments.length} speaker segments.`,
    });
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  const getSpeakerColor = (speaker: string) => {
    const colors: Record<string, string> = {
      'spk_0': 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      'spk_1': 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
      'spk_2': 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      'spk_3': 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      'spk_4': 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
    };
    return colors[speaker] || 'bg-muted text-muted-foreground';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Live Speaker Diarization
          </DialogTitle>
          <DialogDescription>
            Record audio to identify and track different speakers in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recording Button */}
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                className="w-24 h-24 rounded-full bg-gradient-primary"
              >
                <Mic className="w-8 h-8" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={stopRecording}
                variant="destructive"
                className="w-24 h-24 rounded-full animate-pulse"
              >
                <Square className="w-8 h-8" />
              </Button>
            )}
          </div>

          {/* Status */}
          <div className="text-center">
            {isRecording ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording and analyzing...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {segments.length} speaker segments detected
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click the microphone to start
              </p>
            )}
          </div>

          {/* Speaker Timeline */}
          {segments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Speaker Timeline
              </h3>
              <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4">
                <div className="space-y-2" id="speaker-output">
                  {segments.map((seg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg flex items-center justify-between ${getSpeakerColor(seg.speaker)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{seg.speaker.replace('spk_', 'Speaker ')}</div>
                      </div>
                      <div className="text-sm font-mono">
                        {formatTime(seg.start)} → {formatTime(seg.end)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiarizationModal;
