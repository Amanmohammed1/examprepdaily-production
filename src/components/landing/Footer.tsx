import { Mail, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-xl">ExamPrep Daily</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#subscribe" className="hover:text-foreground transition-colors">Subscribe</a>
              <a href="mailto:support@examprepdaily.com" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-1">
              Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> for exam aspirants
            </p>
            <p className="mt-2">© {new Date().getFullYear()} ExamPrep Daily. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;