import React from 'react';
import { 
  Sun, Sunrise, Plus, BookOpen, BookHeart, Moon, 
  RefreshCcw, UtensilsCrossed, Activity, ChevronLeft, ChevronRight,
  Check, X, Sparkles, LayoutDashboard, Calendar
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  const icons: Record<string, React.ElementType> = {
    Sun, Sunrise, Plus, BookOpen, BookHeart, Moon, 
    RefreshCcw, UtensilsCrossed, Activity, ChevronLeft, ChevronRight,
    Check, X, Sparkles, LayoutDashboard, Calendar
  };

  const IconComponent = icons[name] || Activity;
  return <IconComponent className={className} size={size} />;
};