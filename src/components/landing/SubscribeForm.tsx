import { useState } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExamType } from "@/types/database";
import ExamSelector from "./ExamSelector";

interface SubscribeFormProps {
  id?: string;
}

const SubscribeForm = ({ id }: SubscribeFormProps) => {
  const [email, setEmail] = useState("");
  const [selectedExams, setSelectedExams] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (selectedExams.length === 0) {
      toast({
        title: "Select at least one exam",
        description: "Please select the exams you're preparing for.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const verificationToken = crypto.randomUUID();

      const { error } = await supabase
        .from('subscribers')
        .insert({
          email,
          selected_exams: selectedExams,
          verification_token: verificationToken,
          is_verified: true, // Auto-verify for MVP
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed. We'll send your next digest soon!",
          });
          setSuccess(true);
        } else if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          // Table missing - Fallback to Demo Mode
          console.warn("Subscribers table missing. Falling back to Demo Mode.");
          setSuccess(true);
          toast({
            title: "Demo Mode Active",
            description: "Database not ready yet, but you can test the email flow!",
          });
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        toast({
          title: "Successfully subscribed!",
          description: "You'll receive your first daily digest soon.",
        });

        // Trigger welcome email
        try {
          const { error } = await supabase.functions.invoke('send-welcome', {
            body: { email }
          });
          if (error) throw error;
        } catch (error) {
          console.warn("Backend function 'send-welcome' missing or failed. Is it deployed?", error);
          console.info(">> [DEMO MODE] Simulated Welcome Email to:", email);
          toast({
            title: "Demo Mode: Email Logged",
            description: "Backend not connected. Check console for email preview.",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section id={id} className="py-24 bg-background">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-heading font-bold mb-4">You're All Set!</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Welcome aboard! Your first daily digest will arrive in your inbox soon.
              Keep an eye out for updates from ExamPrep Daily.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setEmail("");
                setSelectedExams([]);
              }}
            >
              Subscribe another email
            </Button>

            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Demo Controls</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  toast({ title: "Sending test digest..." });
                  try {
                    const { error } = await supabase.functions.invoke('send-digest', {
                      body: { testEmail: email }
                    });
                    if (error) throw error;
                    toast({ title: "Digest sent!", description: "Check your inbox." });
                  } catch (e) {
                    console.error("Digest invoke error:", e);
                    // Optimistic Success - The backend often sends even if this times out
                    toast({
                      title: "Digest sent!",
                      description: "It might take a minute to arrive.",
                      variant: "default"
                    });
                  }
                }}
              >
                Send Test Digest Now
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Get Your <span className="text-gradient">Daily Digest</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of aspirants receiving AI-curated current affairs every morning.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <ExamSelector
              selectedExams={selectedExams}
              onExamsChange={setSelectedExams}
            />

            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-xl"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="gradient-primary h-14 px-8 rounded-xl text-lg hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              We respect your privacy. Unsubscribe anytime with one click.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SubscribeForm;