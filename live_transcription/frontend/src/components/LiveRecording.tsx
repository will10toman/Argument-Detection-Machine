import { useState, useRef } from 'react';
import { Mic, Square, Users, MessageSquare, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { diarizeAudio, DiarizationSegment, analyzeText } from '@/lib/api';
import { extractCompleteSentences } from '@/lib/textUtils';

interface LiveRecordingProps {
  onComplete: (text: string) => void;
}

interface AnalyzedSegment {
  text: string;
  label: 'Claim' | 'Evidence' | 'Non-informative';
  confidence: number;
}

interface SpeakerData {
  speaker: string;
  transcript: string;
  analyzedSegments: AnalyzedSegment[];
}

interface TranscriptChunk {
  text: string;
  timestamp: number;
  analyzed: boolean;
}

const LiveRecording = ({ onComplete }: LiveRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [liveAnalyzedSegments, setLiveAnalyzedSegments] = useState<AnalyzedSegment[]>([]);
  const [speakerData, setSpeakerData] = useState<Map<string, SpeakerData>>(new Map());
  const [isProcessingDiarization, setIsProcessingDiarization] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptChunksRef = useRef<TranscriptChunk[]>([]);
  const sentenceBufferRef = useRef<string>('');
  const recordingStartTimeRef = useRef<number>(0);
  
  const { toast } = useToast();

  const getSpeakerColor = (speaker: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
      'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
      'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
    ];
    
    let speakerIndex = 0;
    if (speaker.startsWith('Speaker ')) {
      speakerIndex = parseInt(speaker.replace('Speaker ', '')) - 1;
    } else if (speaker.startsWith('spk_')) {
      speakerIndex = parseInt(speaker.replace('spk_', ''));
    }
    
    return colors[Math.max(0, speakerIndex) % colors.length];
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

  const analyzeLiveText = async (text: string) => {
    if (!text.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const response = await analyzeText(text);
      const newSegments = response.segments.map(seg => ({
        text: seg.text,
        label: seg.label,
        confidence: seg.confidence,
      }));
      
      setLiveAnalyzedSegments(prev => [...prev, ...newSegments]);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const assignTranscriptToSpeakers = async (
    chunks: TranscriptChunk[],
    diarizationSegments: DiarizationSegment[]
  ) => {
    const speakerMap = new Map<string, SpeakerData>();
    
    for (const chunk of chunks) {
      const activeSpeaker = diarizationSegments.find(
        seg => chunk.timestamp >= seg.start && chunk.timestamp <= seg.end
      );
      
      const speakerName = activeSpeaker?.speaker || 'Speaker 1';
      
      if (!speakerMap.has(speakerName)) {
        speakerMap.set(speakerName, {
          speaker: speakerName,
          transcript: '',
          analyzedSegments: [],
        });
      }
      
      const data = speakerMap.get(speakerName)!;
      data.transcript += chunk.text + ' ';
    }
    
    for (const [speaker, data] of speakerMap.entries()) {
      if (data.transcript.trim()) {
        try {
          const response = await analyzeText(data.transcript);
          data.analyzedSegments = response.segments.map(seg => ({
            text: seg.text,
            label: seg.label,
            confidence: seg.confidence,
          }));
        } catch (error) {
          console.error(`Analysis error for ${speaker}:`, error);
        }
      }
    }
    
    return speakerMap;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 48000,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

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
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const timeOffset = (Date.now() - recordingStartTimeRef.current) / 1000;
            
            transcriptChunksRef.current.push({
              text: transcript,
              timestamp: timeOffset,
              analyzed: false,
            });
            
            sentenceBufferRef.current += transcript + ' ';
            setLiveTranscript(prev => prev + transcript + ' ');
            
            const { complete, remaining } = extractCompleteSentences(sentenceBufferRef.current);
            
            for (const sentence of complete) {
              analyzeLiveText(sentence);
            }
            
            sentenceBufferRef.current = remaining;
          }
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
      
      recordingStartTimeRef.current = Date.now();
      transcriptChunksRef.current = [];
      sentenceBufferRef.current = '';
      setIsRecording(true);
      setLiveTranscript('');
      setLiveAnalyzedSegments([]);
      setSpeakerData(new Map());
      setIsProcessingDiarization(false);

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
    setIsProcessingDiarization(true);

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

    if (sentenceBufferRef.current.trim()) {
      await analyzeLiveText(sentenceBufferRef.current);
      
      const timeOffset = (Date.now() - recordingStartTimeRef.current) / 1000;
      transcriptChunksRef.current.push({
        text: sentenceBufferRef.current,
        timestamp: timeOffset,
        analyzed: true,
      });
      
      sentenceBufferRef.current = '';
    }

    try {
      const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      toast({
        title: 'Processing audio',
        description: 'Identifying speakers and organizing transcript...',
      });

      const segments = await diarizeAudio(completeAudioBlob);
      
      if (segments && segments.length > 0) {
        const speakerMap = await assignTranscriptToSpeakers(transcriptChunksRef.current, segments);
        setSpeakerData(speakerMap);
        
        toast({
          title: 'Diarization complete',
          description: `Identified ${speakerMap.size} speaker${speakerMap.size !== 1 ? 's' : ''}`,
        });
      } else {
        const singleSpeaker = new Map<string, SpeakerData>();
        singleSpeaker.set('Speaker 1', {
          speaker: 'Speaker 1',
          transcript: liveTranscript,
          analyzedSegments: liveAnalyzedSegments,
        });
        setSpeakerData(singleSpeaker);
      }
    } catch (error) {
      console.error('Diarization error:', error);
      toast({
        title: 'Diarization failed',
        description: 'Using single speaker mode',
        variant: 'destructive',
      });
      
      const singleSpeaker = new Map<string, SpeakerData>();
      singleSpeaker.set('Speaker 1', {
        speaker: 'Speaker 1',
        transcript: liveTranscript,
        analyzedSegments: liveAnalyzedSegments,
      });
      setSpeakerData(singleSpeaker);
    } finally {
      setIsProcessingDiarization(false);
    }
  };

  const handleComplete = () => {
    let fullTranscript = '';
    
    if (speakerData.size > 0) {
      fullTranscript = Array.from(speakerData.values())
        .map(data => data.transcript)
        .join(' ');
    } else {
      fullTranscript = liveTranscript;
    }
      
    if (!fullTranscript.trim()) {
      toast({
        title: 'No transcript',
        description: 'No speech was detected. Please try recording again.',
        variant: 'destructive',
      });
      return;
    }

    onComplete(fullTranscript);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Recording Controls */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Live Recording & Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Record audio with real-time transcription, speaker detection, and claim/evidence analysis
          </p>
        </div>
        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} size="lg">
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <>
              <Button 
                variant="secondary" 
                onClick={stopRecording}
                size="lg"
              >
                <Square className="w-4 h-4 mr-2 fill-current" />
                Stop
              </Button>
              <Button onClick={handleComplete} size="lg">
                Use Transcript
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recording Content */}
      <ScrollArea className="flex-1">
        {/* Phase 1: Recording - Show Live Transcription */}
        {isRecording && (
          <div className="p-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Badge variant="outline" className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30">
                  <Mic className="w-3 h-3 mr-1 animate-pulse" />
                  LIVE RECORDING
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Live Transcript Column */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Live Transcript
                  </div>
                  <div className="text-sm border rounded-lg p-3 bg-background/50 min-h-[200px]">
                    {liveTranscript || (
                      <span className="text-muted-foreground italic">
                        Listening...
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Analysis Column */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    Live Analysis
                  </div>
                  <div className="space-y-2">
                    {liveAnalyzedSegments.length > 0 ? (
                      liveAnalyzedSegments.map((seg, idx) => (
                        <div 
                          key={idx} 
                          className="p-2 rounded border text-xs bg-background/50"
                        >
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
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic border rounded-lg p-3 bg-background/50 min-h-[200px] flex items-center justify-center">
                        Analysis will appear here...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Processing - Show Loading State */}
        {isProcessingDiarization && (
          <div className="flex items-center justify-center h-full text-muted-foreground py-12">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-sm font-medium">Processing audio...</p>
              <p className="text-xs mt-2">Identifying speakers and organizing transcript</p>
            </div>
          </div>
        )}

        {/* Phase 3: Results - Show Speaker-Separated Data */}
        {!isRecording && !isProcessingDiarization && speakerData.size === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground py-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Click "Start Recording" to begin
              </p>
            </div>
          </div>
        )}

        {!isRecording && !isProcessingDiarization && speakerData.size > 0 && (
          <div className="space-y-4 p-4">
            {Array.from(speakerData.values()).map((data) => (
              <div 
                key={data.speaker}
                className="border rounded-lg p-4 bg-card animate-fade-in"
              >
                {/* Speaker Header */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  <Badge 
                    variant="outline" 
                    className={`${getSpeakerColor(data.speaker)}`}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    {data.speaker.toUpperCase()}
                  </Badge>
                  {data.analyzedSegments.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      {data.analyzedSegments.length} segments
                    </Badge>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Transcript Column */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Transcript
                    </div>
                    <div className="text-sm border rounded-lg p-3 bg-background/50 min-h-[100px]">
                      {data.transcript || (
                        <span className="text-muted-foreground italic">
                          Waiting for speech...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Analysis Column */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      Analysis
                    </div>
                    <div className="space-y-2">
                      {data.analyzedSegments.length > 0 ? (
                        data.analyzedSegments.map((seg, idx) => (
                          <div 
                            key={idx} 
                            className="p-2 rounded border text-xs bg-background/50"
                          >
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
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic border rounded-lg p-3 bg-background/50 min-h-[100px] flex items-center justify-center">
                          Analysis will appear here...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LiveRecording;
