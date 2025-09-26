import React from 'react';
import { 
  Bot, 
  MessageSquare, 
  MessageCircle,
  FileText, 
  Trophy, 
  Users, 
  User,
  CreditCard, 
  Send,
  BookOpen,
  BarChart3,
  HelpCircle,
  Zap,
  Home,
  Brain,
  ClipboardList,
  GraduationCap,
  ShoppingCart,
  CalendarCheck,
  Calendar,
  Code
} from 'lucide-react';

interface IconGridItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

interface ResponsiveIconGridProps {
  items: IconGridItem[];
  isDarkMode?: boolean;
  activeTab?: string;
}

export function ResponsiveIconGrid({ items, isDarkMode, activeTab }: ResponsiveIconGridProps) {
  
  // Always show all features in a grid - no scrolling
  // Use responsive grid that adapts to different screen sizes
  const getGridColumns = () => {
    if (items.length <= 4) {
      return 'grid-cols-2'; // 2 columns for 4 or fewer items
    } else if (items.length <= 6) {
      return 'grid-cols-3'; // 3 columns for 5-6 items
    } else {
      return 'grid-cols-3 sm:grid-cols-4'; // 3 on mobile, 4 on larger screens for 7+ items
    }
  };

  // Responsive icon sizing
  const getSizeClasses = () => {
    if (items.length <= 4) {
      return { 
        container: 'w-16 h-16 sm:w-18 sm:h-18', 
        icon: 'w-5 h-5 sm:w-6 sm:h-6', 
        text: 'text-xs' 
      };
    } else {
      return { 
        container: 'w-14 h-14 sm:w-16 sm:h-16', 
        icon: 'w-4 h-4 sm:w-5 sm:h-5', 
        text: 'text-xs' 
      };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="w-full">
      <div className={`grid ${getGridColumns()} gap-2 sm:gap-3 justify-items-center`}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className="cursor-pointer transition-all duration-200 hover:scale-105"
          >
            <div
              className={`${sizeClasses.container} rounded-lg flex flex-col items-center justify-center p-2 sm:p-3 transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg ${
                activeTab === item.id
                  ? isDarkMode
                    ? 'bg-slate-800 border-2 border-purple-400 shadow-lg shadow-purple-400/20'
                    : 'bg-white border-2 border-orange-400 shadow-lg shadow-orange-400/20'
                  : isDarkMode
                  ? 'bg-slate-900 border border-slate-600 hover:border-purple-400 hover:bg-slate-800'
                  : 'bg-gray-50 border border-gray-200 hover:border-orange-400 hover:bg-white hover:shadow-md'
              }`}
              data-testid={`icon-${item.id}`}
            >
              <div className={`${sizeClasses.icon} mb-1 sm:mb-2 flex items-center justify-center transition-colors duration-200 ${
                activeTab === item.id
                  ? isDarkMode
                    ? 'text-purple-400'
                    : 'text-orange-500'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-purple-400'
                  : 'text-gray-500 hover:text-orange-500'
              }`}>
                {item.icon}
              </div>
              <span className={`${sizeClasses.text} font-medium text-center leading-tight transition-colors duration-200 ${
                activeTab === item.id
                  ? isDarkMode
                    ? 'text-purple-400'
                    : 'text-orange-500'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-purple-400'
                  : 'text-gray-500 hover:text-orange-500'
              }`}>
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Default export for compatibility
export default ResponsiveIconGrid;

// Predefined icon sets for different dashboard types
export const getTeacherIcons = (setLocation: (path: string) => void, setActiveTab?: (tab: string) => void): IconGridItem[] => [
  {
    id: 'overview',
    icon: <Home className="w-full h-full" />,
    label: 'Home',
    onClick: () => setLocation('/teacher')
  },
  {
    id: 'ai-questions',
    icon: <Brain className="w-full h-full" />,
    label: 'AI Gen',
    onClick: () => setLocation('/teacher/ai-questions')
  },
  {
    id: 'sms-balance',
    icon: <CreditCard className="w-full h-full" />,
    label: 'SMS Balance',
    onClick: () => setLocation('/teacher/sms-balance')
  },
  {
    id: 'exams',
    icon: <ClipboardList className="w-full h-full" />,
    label: 'Exams',
    onClick: () => setLocation('/teacher/exams')
  },
  {
    id: 'calendar',
    icon: <Calendar className="w-full h-full" />,
    label: 'Academic Calendar',
    onClick: () => setActiveTab ? setActiveTab('calendar') : setLocation('/teacher/calendar')
  },
  {
    id: 'attendance',
    icon: <CalendarCheck className="w-full h-full" />,
    label: 'Attendance',
    onClick: () => setActiveTab ? setActiveTab('attendance') : setLocation('/teacher/attendance')
  },
  {
    id: 'students',
    icon: <GraduationCap className="w-full h-full" />,
    label: 'Students',
    onClick: () => setLocation('/teacher/students')
  },
  {
    id: 'fees',
    icon: <CreditCard className="w-full h-full" />,
    label: 'Fee Collection',
    onClick: () => setActiveTab ? setActiveTab('fees') : setLocation('/teacher/fees')
  },
  {
    id: 'monthly-results',
    icon: <Trophy className="w-full h-full" />,
    label: 'Monthly Results',
    onClick: () => setLocation('/teacher/monthly-results')
  },

  {
    id: 'question-bank',
    icon: <FileText className="w-full h-full" />,
    label: 'প্রশ্নব্যাংক',
    onClick: () => setLocation('/teacher/question-bank')
  },
  {
    id: 'courses',
    icon: <BookOpen className="w-full h-full" />,
    label: 'কোর্স',
    onClick: () => setLocation('/courses')
  }
];

export const getStudentIcons = (setLocation: (path: string) => void): IconGridItem[] => [
  {
    id: 'overview',
    icon: <BarChart3 className="w-full h-full" />,
    label: 'Home',
    onClick: () => setLocation('/student')
  },
  {
    id: 'ai-doubts',
    icon: <Bot className="w-full h-full" />,
    label: 'AI Help',
    onClick: () => setLocation('/student/ai-help')
  },
  {
    id: 'ai-questions',
    icon: <Brain className="w-full h-full" />,
    label: 'AI Questions',
    onClick: () => setLocation('/student/ai-questions')
  },
  {
    id: 'exams',
    icon: <FileText className="w-full h-full" />,
    label: 'Exams',
    onClick: () => setLocation('/student/exams')
  },
  {
    id: 'attendance',
    icon: <CalendarCheck className="w-full h-full" />,
    label: 'Attendance',
    onClick: () => setLocation('/student/attendance')
  },
  {
    id: 'monthly-results',
    icon: <Trophy className="w-full h-full" />,
    label: 'Monthly Results',
    onClick: () => setLocation('/student/monthly-results')
  },
  {
    id: 'question-bank',
    icon: <FileText className="w-full h-full" />,
    label: 'প্রশ্নব্যাংক',
    onClick: () => setLocation('/student/question-bank')
  },
  {
    id: 'developer',
    icon: <Code className="w-full h-full" />,
    label: 'Developer',
    onClick: () => setLocation('/student/developer')
  }
];
