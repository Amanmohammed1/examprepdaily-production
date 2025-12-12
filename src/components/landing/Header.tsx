import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSubscribe: () => void;
}

const Header = ({ onSubscribe }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">ExamPrep Daily</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#subscribe" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Subscribe
            </a>
            <Link to="/live" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Live Feed
            </Link>
          </nav>

          <Button
            onClick={onSubscribe}
            className="gradient-primary rounded-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;