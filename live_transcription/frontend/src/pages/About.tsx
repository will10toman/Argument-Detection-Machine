import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Database, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const About = () => {
  const navigate = useNavigate();

  const labels = [
    {
      icon: Tag,
      name: 'Claim',
      color: 'claim',
      description:
        'Assertions or statements that present a position, opinion, or conclusion requiring support.',
      examples: [
        'Climate change poses an existential threat to humanity.',
        'Universal healthcare improves population health outcomes.',
      ],
    },
    {
      icon: Tag,
      name: 'Evidence',
      color: 'evidence',
      description:
        'Data, facts, statistics, or examples that support or refute a claim.',
      examples: [
        "According to the WHO, 90% of the world's population breathes polluted air.",
        'A 2022 study found that countries with universal healthcare have 20% lower infant mortality.',
      ],
    },
    {
      icon: Tag,
      name: 'Non-informative',
      color: 'non-informative',
      description:
        'Text that does not contribute argument structure—greetings, transitions, or background context.',
      examples: [
        'In this essay, I will discuss various perspectives.',
        'Thank you for your attention.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">About ADM</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-4xl font-bold">Argument Detection Machine</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced AI-powered analysis to identify argumentative structures in text,
              distinguishing claims, evidence, and non-informative content.
            </p>
          </div>

          {/* How It Works */}
          <Card className="p-8 animate-slide-up">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              How It Works
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The Argument Detection Machine (ADM) uses state-of-the-art natural language
                processing models trained on diverse argumentative corpora. The system analyzes
                text at the sentence level and assigns labels based on learned patterns of
                argumentative discourse.
              </p>
              <p>
                Each prediction includes a confidence score (0-1) indicating the model's certainty.
                Higher scores mean greater confidence in the assigned label. Scores above 0.75
                typically indicate high reliability.
              </p>
              <p>
                ADM supports multiple input formats including direct text, speech-to-text
                transcription, document uploads (.txt, .pdf, .docx), and video transcription,
                making it versatile for various research and educational contexts.
              </p>
            </div>
          </Card>

          {/* Label Descriptions */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Label Definitions</h3>
            <div className="grid gap-6">
              {labels.map((label) => {
                const Icon = label.icon;
                const borderClass = label.name === 'Claim' ? 'border-l-claim' : 
                                   label.name === 'Evidence' ? 'border-l-evidence' : 
                                   'border-l-non-informative';
                const bgClass = label.name === 'Claim' ? 'bg-claim/10' : 
                               label.name === 'Evidence' ? 'bg-evidence/10' : 
                               'bg-non-informative/10';
                const textClass = label.name === 'Claim' ? 'text-claim' : 
                                 label.name === 'Evidence' ? 'text-evidence' : 
                                 'text-non-informative';
                return (
                  <Card
                    key={label.name}
                    className={`p-6 border-l-4 hover:shadow-card-hover transition-all duration-300 ${borderClass}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg shrink-0 ${bgClass}`}>
                        <Icon className={`w-6 h-6 ${textClass}`} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="text-xl font-semibold">{label.name}</h4>
                        <p className="text-muted-foreground">{label.description}</p>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Examples:</p>
                          <ul className="space-y-1">
                            {label.examples.map((example, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground italic">
                                "{example}"
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Card className="p-8 bg-gradient-card text-center">
            <h3 className="text-2xl font-semibold mb-4">Ready to Analyze?</h3>
            <p className="text-muted-foreground mb-6">
              Start detecting arguments in your text with AI-powered precision
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/')}
              className="bg-gradient-primary"
            >
              Get Started
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
