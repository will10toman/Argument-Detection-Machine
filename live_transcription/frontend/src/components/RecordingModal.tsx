import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface RecordingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (text: string) => void;
}

const RecordingModal = ({ open, onClose, onComplete }: RecordingModalProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: 'Not supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript((prev) => prev + finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: 'Recording error',
        description: 'Failed to record audio. Please try again.',
        variant: 'destructive',
      });
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript('');
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleComplete = () => {
    if (transcript.trim()) {
      onComplete(transcript);
      setTranscript('');
      onClose();
    } else {
      toast({
        title: 'No transcript',
        description: 'Please record some audio first.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setTranscript('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Audio</DialogTitle>
          <DialogDescription>
            Click the microphone to start recording. Speak clearly for best results.
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
                className="w-24 h-24 rounded-full bg-destructive hover:bg-destructive/90 animate-pulse"
              >
                <Square className="w-8 h-8" />
              </Button>
            )}
          </div>

          {/* Status */}
          <div className="text-center">
            {isRecording ? (
              <p className="text-sm text-muted-foreground">
                Recording... Click the button to stop
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click the microphone to start
              </p>
            )}
          </div>

          {/* Transcript Preview */}
          {transcript && (
            <div className="p-4 bg-muted rounded-lg min-h-[100px] max-h-[200px] overflow-auto">
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!transcript || isRecording}
              className="flex-1 bg-gradient-primary"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Use Transcript
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingModal;
