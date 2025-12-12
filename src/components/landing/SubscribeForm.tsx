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
      console.log("Subscribing via RPC:", email);

      const { data, error } = await supabase.rpc('handle_new_subscription', {
        p_email: email,
        p_selected_exams: selectedExams
      });

      if (error) throw error;

      console.log("Subscription Result:", data);

      const result = Array.isArray(data) ? data[0] : data; // RPC can return array

      if (result?.status === 'updated') {
        toast({
          title: "Subscription Updated",
          description: "We've added these exams to your existing preferences.",
        });
      } else {
        toast({
          title: "Successfully subscribed!",
          description: "You'll receive your first daily digest soon.",
        });

        // Trigger welcome email only on NEW insert
        // Trigger immediate digest for new users
        try {
          console.log("Triggering Welcome Digest...");
          // We use 'testEmail' param to force a single email send to this user immediately
          const { error } = await supabase.functions.invoke('send-digest', {
            body: { testEmail: email }
          });
          if (error) console.error("Welcome digest failed:", error);
        } catch (e) { console.warn("Welcome digest error:", e); }
      }

      setSuccess(true);

    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription failed",
        description: error.message || "Something went wrong. Please check your connection.",
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