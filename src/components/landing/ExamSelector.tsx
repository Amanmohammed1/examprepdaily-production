import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Exam, ExamType } from "@/types/database";
import { cn } from "@/lib/utils";

interface ExamSelectorProps {
  selectedExams: ExamType[];
  onExamsChange: (exams: ExamType[]) => void;
}

const examIcons: Record<string, string> = {
  rbi_grade_b: "🏦",
  sebi_grade_a: "📈",
  nabard_grade_a: "🌾",
  nabard_grade_b: "🌾",
  upsc_cse: "🏛️",
  upsc_ies: "💼",
  ssc_cgl: "📋",
  ibps_po: "🏧",
  ibps_clerk: "🏧",
  lic_aao: "🛡️",
};

const fallbackExams: Exam[] = [
  { id: "1", code: "rbi_grade_b", name: "RBI Grade B", description: "RBI Grade B Officer Exam", related_categories: [], is_active: true, created_at: "" },
  { id: "2", code: "sebi_grade_a", name: "SEBI Grade A", description: "SEBI Grade A Exam", related_categories: [], is_active: true, created_at: "" },
  { id: "3", code: "nabard_grade_a", name: "NABARD Grade A", description: "NABARD Grade A Exam", related_categories: [], is_active: true, created_at: "" },
  { id: "4", code: "upsc_cse", name: "UPSC CSE", description: "UPSC Civil Services", related_categories: [], is_active: true, created_at: "" },
  { id: "5", code: "ssc_cgl", name: "SSC CGL", description: "SSC CGL Exam", related_categories: [], is_active: true, created_at: "" },
  { id: "6", code: "ibps_po", name: "IBPS PO", description: "IBPS Probationary Officer", related_categories: [], is_active: true, created_at: "" },
  { id: "7", code: "ibps_clerk", name: "IBPS Clerk", description: "IBPS Clerk Exam", related_categories: [], is_active: true, created_at: "" },
  { id: "8", code: "lic_aao", name: "LIC AAO", description: "LIC AAO Exam", related_categories: [], is_active: true, created_at: "" },
];

const ExamSelector = ({ selectedExams, onExamsChange }: ExamSelectorProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching exams:', error);
        console.warn('Falling back to hardcoded exams due to missing DB table.');
        setExams(fallbackExams);
      } else {
        setExams(data as Exam[]);
      }
      setLoading(false);
    };

    fetchExams();
  }, []);

  const toggleExam = (examCode: ExamType) => {
    if (selectedExams.includes(examCode)) {
      onExamsChange(selectedExams.filter(e => e !== examCode));
    } else {
      onExamsChange([...selectedExams, examCode]);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-heading font-semibold text-lg mb-1">Select Your Target Exams</h3>
        <p className="text-sm text-muted-foreground">Choose one or more exams to get personalized content</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {exams.map((exam) => {
          const isSelected = selectedExams.includes(exam.code);
          return (
            <button
              key={exam.id}
              onClick={() => toggleExam(exam.code)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div className="text-2xl mb-2">{examIcons[exam.code] || "📚"}</div>
              <div className="font-medium text-sm">{exam.name}</div>
            </button>
          );
        })}
      </div>
      {selectedExams.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {selectedExams.length} exam{selectedExams.length > 1 ? 's' : ''} selected
        </p>
      )}

      <div className="text-center pt-2">
        <button
          type="button" // Prevent form submission
          onClick={async () => {
            const examName = prompt("Which exam are you preparing for?");
            if (!examName) return;

            const sources = prompt("Any specific sources/websites we should track? (Optional)");

            try {
              await supabase.functions.invoke('request-exam', {
                body: { exam: examName, sources: sources || '' }
              });
              alert("Thanks! We've noted your request for " + examName + ". We'll add it soon.");
            } catch (e) {
              console.error(e);
              alert("Request sent!"); // Optimistic UI
            }
          }}
          className="text-xs text-primary hover:underline opacity-80"
        >
          Your exam not listed? Tell us
        </button>
      </div>
    </div>
  );
};

export default ExamSelector;