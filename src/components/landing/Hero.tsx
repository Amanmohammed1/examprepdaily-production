import { ArrowRight, Sparkles, Zap, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Current Affairs</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Stay Ahead with{' '}
            <span className="text-gradient">Smart Digests</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Get AI-summarized current affairs, RBI circulars, and government updates delivered to your inbox daily. Tailored for your target exam.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: Zap, text: "AI Summarized" },
              { icon: Mail, text: "Daily Digest" },
              { icon: Sparkles, text: "Exam Focused" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="gradient-primary text-lg px-8 py-6 rounded-xl shadow-glow hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Get Your Daily Digest
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">Free forever. No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        {/* Floating cards preview */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
              {[
                { title: "RBI Monetary Policy", category: "Banking", color: "primary" },
                { title: "Union Budget 2025 Highlights", category: "Economy", color: "accent" },
                { title: "New SEBI Regulations", category: "Finance", color: "success" },
              ].map((item, index) => (
                <div 
                  key={item.title}
                  className="gradient-card rounded-xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                    item.color === 'primary' ? 'bg-primary/10 text-primary' :
                    item.color === 'accent' ? 'bg-accent/10 text-accent' :
                    'bg-success/10 text-success'
                  }`}>
                    {item.category}
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">AI-generated summary with key points for quick revision...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;