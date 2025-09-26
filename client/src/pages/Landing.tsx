import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { GraduationCap, BookOpen, Users, Award, FlaskConical, Zap, Cpu, User, UserPlus, Smartphone, MonitorSpeaker, Trophy, Target, Calendar, MessageSquare, CheckCircle, PlayCircle, Monitor, Phone, Mail, Calculator, BookA } from 'lucide-react';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import { useAuth } from '@/hooks/useAuth';
import MonthlyTopPerformers from '@/components/MonthlyTopPerformers';


const addStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().min(11, 'Phone number must be at least 11 digits'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
});

type AddStudentData = z.infer<typeof addStudentSchema>;


export default function Landing() {
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Fetch courses from API
  const { data: courses = [], isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch teacher profiles for displaying on landing page  
  const { data: teacherProfiles } = useQuery<any[]>({
    queryKey: ["/api/teacher-profiles"],
  });

  // Get Belal Sir's profile for display
  const belalSirProfile = teacherProfiles?.[0];

  // Profile Picture Component for Landing Page
  const ProfilePicture = () => {
    return (
      <>
        <img 
          src="/assets/images/golam-sarowar-sir.jpg" 
          alt="Golam Sarowar Sir Profile" 
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // If Sir's photo fails to load, show initials instead of fallback to developer photo
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const initialsDiv = parent.querySelector('.initials-fallback') as HTMLElement;
              if (initialsDiv) {
                initialsDiv.style.display = 'flex';
              }
            }
          }}
        />
        <div className="initials-fallback absolute inset-0 flex items-center justify-center text-6xl font-bold text-white hidden bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full">
          GS
        </div>
      </>
    );
  };

  // Helper function to get icon based on iconName
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "FlaskConical": return FlaskConical;
      case "Monitor": return Monitor;
      case "BookOpen": return BookOpen;
      case "GraduationCap": return GraduationCap;
      default: return FlaskConical;
    }
  };

  // Professional color scheme with colors
  const getColorClasses = (colorScheme: string) => {
    switch (colorScheme) {
      case "cyan": return {
        cardBg: "bg-gradient-to-br from-cyan-50 to-blue-50",
        cardBorder: "border-cyan-200 hover:border-cyan-300",
        iconBg: "bg-gradient-to-br from-cyan-500 to-blue-500",
        titleColor: "text-cyan-900"
      };
      case "purple": return {
        cardBg: "bg-gradient-to-br from-purple-50 to-indigo-50",
        cardBorder: "border-purple-200 hover:border-purple-300",
        iconBg: "bg-gradient-to-br from-purple-500 to-indigo-500",
        titleColor: "text-purple-900"
      };
      case "green": return {
        cardBg: "bg-gradient-to-br from-emerald-50 to-green-50",
        cardBorder: "border-emerald-200 hover:border-emerald-300",
        iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
        titleColor: "text-emerald-900"
      };
      case "yellow": return {
        cardBg: "bg-gradient-to-br from-amber-50 to-yellow-50",
        cardBorder: "border-amber-200 hover:border-amber-300",
        iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500",
        titleColor: "text-amber-900"
      };
      case "red": return {
        cardBg: "bg-gradient-to-br from-rose-50 to-red-50",
        cardBorder: "border-rose-200 hover:border-rose-300",
        iconBg: "bg-gradient-to-br from-rose-500 to-red-500",
        titleColor: "text-rose-900"
      };
      case "blue": return {
        cardBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
        cardBorder: "border-blue-200 hover:border-blue-300",
        iconBg: "bg-gradient-to-br from-blue-500 to-indigo-500",
        titleColor: "text-blue-900"
      };
      default: return {
        cardBg: "bg-gradient-to-br from-slate-50 to-gray-50",
        cardBorder: "border-slate-200 hover:border-slate-300",
        iconBg: "bg-gradient-to-br from-slate-500 to-gray-500",
        titleColor: "text-slate-900"
      };
    }
  };



  const addStudentForm = useForm<AddStudentData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { firstName: '', lastName: '', phoneNumber: '', email: '' },
  });






  const handleAddStudent = (data: AddStudentData) => {
    // TODO: Implement add student functionality
    const generatedPassword = Math.random().toString(36).slice(-8);
    console.log('Add student:', { ...data, generatedPassword });
    alert(`Student added! Generated password: ${generatedPassword}`);
    addStudentForm.reset();
    setIsAddStudentModalOpen(false);
  };

  // This component will only render when user is NOT authenticated
  // Authentication redirection is handled by App.tsx

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Light theme background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-12 h-12 border-2 border-blue-300/50 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/3 w-8 h-8 border-2 border-yellow-400/50 rounded-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-6 h-6 border-2 border-blue-400/50 rounded-full"></div>
      </div>

      {/* Light Professional Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-blue-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <Calculator className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">GS Student Nursing Center by Golam Sarowar Sir</h1>
                <p className="text-sm text-blue-700 font-medium">Mathematics & Science Coaching Center</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md"
                data-testid="login-button"
              >
                <User className="responsive-icon mr-2" />
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Professional Corporate Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Professional Background with Colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Professional Icon Group */}
            <div className="inline-flex items-center gap-4 mb-12 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200 p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="text-white w-7 h-7" />
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookA className="text-white w-7 h-7" />
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="text-white w-7 h-7" />
              </div>
            </div>

            {/* Professional Title with Colors */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white drop-shadow-lg" data-testid="hero-title">
              GS Student Nursing Center
            </h1>
            
            {/* Professional Subtitle with Colors */}
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-semibold text-amber-300 mb-3 drop-shadow-md">by Golam Sarowar Sir</h2>
              <div className="text-xl md:text-2xl text-blue-100 bengali-heading drop-shadow-sm">
                স্টুডেন্ট নার্সিং সেন্টার বাই গোলাম সারোয়ার স্যার
              </div>
            </div>

            {/* Professional Description with Colors */}
            <p className="text-lg md:text-xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-sm" data-testid="hero-subtitle">
              গণিত ও বিজ্ঞানে উৎকর্ষতার সাথে ৬ষ্ঠ থেকে ১০ম শ্রেণির শিক্ষার্থীদের জন্য বিশেষজ্ঞ নির্দেশনা
            </p>

            {/* Professional Feature Cards with Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-5xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-blue-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Calculator className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3 text-center">গণিতে দক্ষতা</h3>
                <p className="text-blue-700 text-base text-center leading-relaxed">উচ্চতর ও সাধারণ গণিতে বিশেষ প্রশিক্ষণ</p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-emerald-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BookA className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-3 text-center">বিজ্ঞান শিক্ষা</h3>
                <p className="text-emerald-700 text-base text-center leading-relaxed">পদার্থ, রসায়ন ও জীববিজ্ঞানে পূর্ণাঙ্গ পাঠ</p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-amber-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3 text-center">লক্ষ্য অর্জন</h3>
                <p className="text-amber-700 text-base text-center leading-relaxed">পরীক্ষায় সর্বোচ্চ ফলাফলের নিশ্চয়তা</p>
              </div>
            </div>

            {/* Professional Call to Action with Colors */}
            <div className="text-center">
              <p className="text-blue-100 text-xl mb-8 drop-shadow-sm">আপনার গণিত ও বিজ্ঞানের যাত্রা শুরু করতে প্রস্তুত?</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-10 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 font-bold"
                >
                  <User className="mr-3 w-6 h-6" />
                  Student Login
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-3 border-amber-400 bg-white/10 text-amber-300 hover:bg-amber-400 hover:text-blue-900 px-10 py-4 text-lg rounded-xl transition-all duration-300 font-bold backdrop-blur-sm"
                >
                  <BookOpen className="mr-3 w-6 h-6" />
                  Teacher Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Champions Section - Colorful Professional Theme */}
      <section className="py-16 relative bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-y border-indigo-200">
        <MonthlyTopPerformers />
      </section>

      {/* Professional Features Section with Colors */}
      <section className="py-16 relative bg-gradient-to-br from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 rounded-full px-6 py-3 mb-6">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700 font-semibold text-base">আমাদের কোর্স সমূহ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6 bengali-heading" data-testid="features-title">
              গণিত ও বিজ্ঞানে বিশেষায়িত শিক্ষা
            </h2>
            <p className="text-xl text-blue-700 max-w-3xl mx-auto bengali-body">
              ৬ষ্ঠ থেকে ১০ম শ্রেণি পর্যন্ত সর্বোচ্চ মানের গণিত ও বিজ্ঞান শিক্ষার নিশ্চয়তা
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coursesLoading ? (
              // Loading skeleton for courses
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-sm border border-gray-400/30 animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="w-14 h-14 bg-gray-400/50 rounded-xl mx-auto mb-3"></div>
                    <div className="h-6 bg-gray-400/50 rounded mx-auto w-3/4"></div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-20 bg-gray-400/50 rounded-lg"></div>
                  </CardContent>
                </Card>
              ))
            ) : courses.length > 0 ? (
              // Dynamic course cards from database
              courses
                .filter(course => course.isActive)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((course) => {
                  const IconComponent = getIcon(course.iconName);
                  const colorClasses = getColorClasses(course.colorScheme);
                  
                  return (
                    <Card 
                      key={course.id} 
                      className={`${colorClasses.cardBg} border ${colorClasses.cardBorder} shadow-md hover:shadow-lg transition-all duration-300 rounded-lg`}
                      data-testid={`course-card-${course.id}`}
                    >
                      <CardHeader className="pb-4">
                        <div className={`w-14 h-14 ${colorClasses.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <IconComponent className="text-white w-7 h-7" />
                        </div>
                        <CardTitle className={`${colorClasses.titleColor} text-center text-lg font-bold`}>
                          {course.titleBangla}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className={`${colorClasses.titleColor} text-center text-sm bg-white/80 p-4 rounded-lg font-medium`}>
                          {course.description}
                        </CardDescription>
                        {course.targetClass && (
                          <div className="mt-4 text-center">
                            <span className={`inline-block px-4 py-2 text-sm rounded-full bg-white/60 ${colorClasses.titleColor} font-semibold border ${colorClasses.cardBorder.split(' ')[0]}`}>
                              শ্রেণী: {course.targetClass}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
            ) : (
              // No courses available
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">কোন কোর্স পাওয়া যায়নি</h3>
                <p className="text-slate-600">শীঘ্রই নতুন কোর্স যোগ করা হবে।</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Professional CTA Section with Colors */}
      <section className="py-16 relative bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-white rounded-3xl shadow-2xl border border-emerald-200 p-12 md:p-16">
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 rounded-full px-6 py-3 mb-8">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold text-base">এখনই যোগদান করুন</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold text-emerald-900 mb-6 bengali-heading" data-testid="cta-title">
                  গণিত ও বিজ্ঞানে দক্ষতা অর্জনের জন্য প্রস্তুত?
                </h2>
                
                <p className="text-xl md:text-2xl font-semibold text-teal-600 mb-4">
                  Ready to Excel in Mathematics & Science?
                </p>
                
                <p className="text-lg text-emerald-700 mb-10 max-w-3xl mx-auto leading-relaxed bengali-body">
                  গোলাম সারোয়ার স্যারের ২০+ বছরের অভিজ্ঞতা ও বিশেষজ্ঞ শিক্ষার মাধ্যমে গণিত ও বিজ্ঞানে পারদর্শিতা অর্জন করুন
                </p>

                {/* Colorful Action buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    data-testid="cta-student-login-button"
                  >
                    <User className="w-6 h-6 mr-3" />
                    Student Login
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    size="lg" 
                    variant="outline"
                    className="border-3 border-emerald-400 text-emerald-600 hover:bg-emerald-500 hover:text-white px-10 py-4 text-lg font-bold rounded-xl transition-all duration-300"
                    data-testid="cta-teacher-login-button"
                  >
                    <GraduationCap className="w-6 h-6 mr-3" />
                    Teacher Login
                  </Button>
                </div>

                {/* Colorful Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-emerald-200">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">5000+</div>
                    <div className="text-blue-700 text-base font-medium">সফল শিক্ষার্থী</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-600 mb-2">20+</div>
                    <div className="text-emerald-700 text-base font-medium">বছরের অভিজ্ঞতা</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
                    <div className="text-purple-700 text-base font-medium">সাফল্যের হার</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Perfect Professional Profile Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-t-4 border-indigo-300 py-24 relative z-10 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-300 rounded-full px-8 py-4 mb-8 shadow-lg">
              <User className="w-6 h-6 text-indigo-600" />
              <span className="text-indigo-700 font-bold text-lg">প্রতিষ্ঠাতার পরিচয়</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4">আমাদের প্রতিষ্ঠাতার সাথে পরিচয়</h2>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-8">Meet Our Founder</h3>
            <div className="w-32 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto rounded-full shadow-lg"></div>
          </div>
          
          <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl p-16 border-2 border-blue-300 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Enhanced Profile Image - Even Larger */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-80 h-80 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-full flex items-center justify-center border-8 border-white shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                    <ProfilePicture />
                  </div>
                  {/* Decorative rings */}
                  <div className="absolute inset-0 w-80 h-80 rounded-full border-4 border-blue-200 opacity-30 animate-pulse"></div>
                  <div className="absolute -inset-2 w-84 h-84 rounded-full border-2 border-indigo-100 opacity-20"></div>
                </div>
              </div>
              
              {/* Enhanced Profile Information */}
              <div className="flex-1 text-center lg:text-left space-y-6">
                <div className="space-y-4">
                  <h3 className="text-5xl font-bold text-blue-900 mb-4 bengali-heading drop-shadow-lg">গোলাম সারোয়ার</h3>
                  <h4 className="text-4xl font-bold text-emerald-700 mb-8 drop-shadow-lg">Golam Sarowar Sir</h4>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-center lg:justify-start gap-5 bg-white/95 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="w-9 h-9 text-white" />
                    </div>
                    <span className="text-xl text-slate-900 bengali-body font-bold">গণিত ও বিজ্ঞান শিক্ষক - ১৫+ বছরের অভিজ্ঞতা</span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-5 bg-white/95 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-emerald-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <BookOpen className="w-9 h-9 text-white" />
                    </div>
                    <span className="text-xl text-slate-900 font-bold">Mathematics & Science Expert</span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-5 bg-white/95 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-indigo-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="w-9 h-9 text-white" />
                    </div>
                    <span className="text-lg text-slate-900 font-bold leading-tight">Assistant Math Teacher at Mohadevpur Satnamongala Pilot High School, Mohadevpur, Naogaon</span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-5 bg-white/95 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calculator className="w-9 h-9 text-white" />
                    </div>
                    <span className="text-xl text-slate-900 bengali-body font-bold">উচ্চতর গণিত ও সাধারণ গণিত বিশেষজ্ঞ</span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-5 bg-white/95 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-purple-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Award className="w-9 h-9 text-white" />
                    </div>
                    <span className="text-xl text-slate-900 font-bold">৫০০০+ সফল শিক্ষার্থী</span>
                  </div>
                </div>
                
                {/* Enhanced Contact Information */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-center lg:justify-start gap-5 bg-white/95 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-green-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Phone className="w-9 h-9 text-white" />
                    </div>
                    <span className="text-xl font-bold">
                      <a href="tel:01762602056" className="text-green-700 hover:text-green-800 transition-colors">
                        01762602056
                      </a>
                    </span>
                  </div>
                </div>
                
                {/* Professional Quote */}
                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl border-l-4 border-indigo-500 shadow-lg">
                  <p className="text-lg italic text-indigo-800 font-medium leading-relaxed">
                    "With years of experience in Mathematics and Science education, I am committed to providing students with the knowledge and skills they need to excel in their academic journey. My goal is to make complex mathematical and scientific concepts accessible and engaging for every student."
                  </p>
                </div>
                

              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-700 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <Calculator className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">GS Student Nursing Center by Golam Sarowar Sir</p>
                <p className="text-sm text-slate-300">Excellence in Mathematics & Science Education</p>
                <p className="text-xs text-slate-400 mt-1">📞 01762602056</p>
              </div>
            </div>
            
            {/* Copyright Information */}
            <div className="text-center border-t border-slate-700 pt-4 mt-4 w-full">
              <p className="text-sm text-slate-400">
                © 2025 All Rights Reserved | Created by{' '}
                <a 
                  href="https://www.facebook.com/share/17MW5DRtR7/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white font-medium underline transition-colors duration-200"
                  data-testid="developer-link"
                >
                  Sahid Rahman
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>


      {/* Add Student Modal */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent className="max-w-md bg-gray-800 border border-emerald-400/50 text-white shadow-2xl" aria-describedby="add-student-description">
          <DialogHeader>
            <DialogTitle className="text-emerald-300 text-xl font-bold">Add New Student</DialogTitle>
            <p id="add-student-description" className="text-gray-200 text-sm">
              Add a new student to the system. A password will be automatically generated.
            </p>
          </DialogHeader>
          
          <Form {...addStudentForm}>
            <form onSubmit={addStudentForm.handleSubmit(handleAddStudent)} className="space-y-4">
              <FormField
                control={addStudentForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-300">First Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter first name" 
                        {...field} 
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-400"
                        data-testid="input-first-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addStudentForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-300">Last Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter last name" 
                        {...field} 
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-400"
                        data-testid="input-last-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addStudentForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-300">Phone Number (will be used as ID)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter phone number" 
                        {...field} 
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-400"
                        data-testid="input-student-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addStudentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Email (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email address" 
                        {...field} 
                        className="bg-slate-800 border-slate-600 text-white"
                        data-testid="input-student-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                data-testid="add-student-submit"
              >
                Add Student & Generate Password
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
