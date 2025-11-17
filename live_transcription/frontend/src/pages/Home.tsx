import { useNavigate } from 'react-router-dom';
import { Mic, FileText, Video, Type, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAnalysisStore } from '@/store/analysisStore';

const Home = () => {
  const navigate = useNavigate();
  const { recentRuns } = useAnalysisStore();

  const inputMethods = [
    {
      icon: Type,
      title: 'Paste Text',
      description: 'Copy and paste text for instant analysis',
      color: 'claim',
      route: '/analyze?mode=paste',
    },
    {
      icon: Mic,
      title: 'Record Audio',
      description: 'Speak your text using voice recording',
      color: 'evidence',
      route: '/analyze?mode=record',
    },
    {
      icon: FileText,
      title: 'Upload File',
      description: 'Upload .txt, .pdf, or .docx documents',
      color: 'primary',
      route: '/analyze?mode=file',
    },
    {
      icon: Video,
      title: 'Upload Video',
      description: 'Extract and analyze text from video',
      color: 'non-informative',
      route: '/analyze?mode=video',
    },
    {
      icon: Users,
      title: 'Live Diarization',
      description: 'Identify speakers in real-time audio',
      color: 'accent',
      route: '/analyze?mode=diarize',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                EDILLY ADM
              </h1>
              <p className="text-muted-foreground mt-1">
                Argument Detection Machine Dashboard
              </p>
            </div>
            <button
              onClick={() => navigate('/about')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold">
              Analyze Arguments with AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Detect claims, evidence, and non-informative text with confidence scores.
              Choose your preferred input method below.
            </p>
          </div>

          {/* Input Method Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            {inputMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Card
                  key={method.title}
                  onClick={() => navigate(method.route)}
                  className="group cursor-pointer p-8 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-2xl bg-${method.color}/10`}>
                      <Icon className={`w-8 h-8 text-${method.color}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Analyses */}
          {recentRuns.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-2xl font-semibold">Recent Analyses</h3>
              <div className="grid grid-cols-1 gap-4">
                {recentRuns.slice(0, 3).map((run) => (
                  <Card
                    key={run.id}
                    onClick={() => navigate(`/run/${run.id}`)}
                    className="p-6 cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:border-primary"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(run.timestamp).toLocaleString()}
                        </p>
                        <p className="text-foreground line-clamp-2">{run.text}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-claim/10 text-claim">
                          {run.segments.filter((s) => s.label === 'Claim').length} Claims
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-evidence/10 text-evidence">
                          {run.segments.filter((s) => s.label === 'Evidence').length} Evidence
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
