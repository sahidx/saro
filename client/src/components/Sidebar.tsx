import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  FileText, 
  HelpCircle, 
  CalendarCheck, 
  MessageSquare, 
  Bell,
  DollarSign, 
  Megaphone,
  LogOut,
  Menu,
  X,
  GraduationCap,
  BookOpen,
  User,
  CreditCard,
  Settings,
  Code,
  Trophy
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const teacherMenuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/' },
  { icon: Megaphone, label: 'AI Questions', href: '/teacher/ai-questions' },
  { icon: MessageSquare, label: 'SMS Management', href: '/teacher/sms-management' },
  { icon: FileText, label: 'Exam Management', href: '/teacher/exams' },
  { icon: Trophy, label: 'Monthly Rankings', href: '/teacher/rankings' },
  { icon: CalendarCheck, label: 'Attendance', href: '/attendance' },
  { icon: DollarSign, label: 'Fee Collection', href: '/teacher/fees' },
  { icon: Bell, label: 'Students', href: '/teacher/students' },
  { icon: Settings, label: 'API Keys', href: '/teacher/api-settings' },
  { icon: HelpCircle, label: 'Question Bank', href: '/teacher/question-bank' },
  { icon: BookOpen, label: 'Course Management', href: '/courses' },
  { icon: User, label: 'Profile Management', href: '/profile' },
];

const studentMenuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/' },
  { icon: HelpCircle, label: 'AI Help', href: '/student/ai-help' },
  { icon: FileText, label: 'My Exams', href: '/student/exams' },
  { icon: CalendarCheck, label: 'Attendance', href: '/student/attendance' },
  { icon: BookOpen, label: 'Question Bank', href: '/student/question-bank' },
  { icon: Code, label: 'Developer', href: '/student/developer' },
];

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Hide mobile menu for Question Bank page
  const showMobileMenu = !location.includes('/teacher/question-bank');

  const menuItems = (user as any)?.role === 'teacher' ? teacherMenuItems : studentMenuItems;

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Belal Sir</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Chemistry & ICT Care</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "responsive-button flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                isActive 
                  ? "bg-primary text-white" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src={(user as any)?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150'}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
            data-testid="user-profile-image"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white" data-testid="user-name">
              {(user as any)?.firstName} {(user as any)?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize" data-testid="user-role">
              {(user as any)?.role}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="responsive-button text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {showMobileMenu && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
          data-testid="mobile-menu-toggle"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={cn("w-64 bg-surface shadow-lg border-r border-gray-200 hidden lg:block", className)}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 w-64 h-full bg-surface shadow-lg border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
