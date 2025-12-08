import { Brain, Clock, Target, Newspaper, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Summaries",
    description: "Our AI analyzes articles and extracts key points relevant to your exam preparation.",
    color: "primary",
  },
  {
    icon: Target,
    title: "Exam-Focused Content",
    description: "Content tagged and filtered specifically for RBI, SEBI, UPSC, SSC, and banking exams.",
    color: "accent",
  },
  {
    icon: Clock,
    title: "Daily Delivery",
    description: "Fresh content delivered to your inbox every morning, ready for your study session.",
    color: "success",
  },
  {
    icon: Newspaper,
    title: "Multiple Sources",
    description: "Aggregated from RBI circulars, PIB releases, leading newspapers, and government sites.",
    color: "warning",
  },
  {
    icon: Shield,
    title: "Verified Information",
    description: "Content sourced only from official and trusted sources to ensure accuracy.",
    color: "primary",
  },
  {
    icon: Zap,
    title: "Quick Read Format",
    description: "Each article condensed into 3-4 sentence summaries with bullet-point key takeaways.",
    color: "accent",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-card">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Everything You Need to <span className="text-gradient">Stay Updated</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We handle the information overload so you can focus on what matters - your preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-background border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                  feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                  feature.color === 'accent' ? 'bg-accent/10 text-accent' :
                  feature.color === 'success' ? 'bg-success/10 text-success' :
                  'bg-warning/10 text-warning'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;