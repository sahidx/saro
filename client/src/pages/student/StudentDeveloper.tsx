import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import MobileWrapper from '@/components/MobileWrapper';
import { 
  ArrowLeft, 
  Facebook,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Award,
  Code,
  GraduationCap,
  BookOpen,
  FlaskConical,
  Monitor,
  Heart,
  Building2,
  Target,
  Eye
} from 'lucide-react';
import { useLocation } from 'wouter';
import DEVELOPER_PROFILE from '@/data/developer-profile';

export default function StudentDeveloper() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [imageError, setImageError] = useState(false);

  // Get data from permanent profile
  const skills = DEVELOPER_PROFILE.skills.map(skill => ({
    name: skill.name,
    icon: skill.name.includes('Cyber Security') ? Building2 : 
          skill.name.includes('Bug Bounty') ? Target :
          skill.name.includes('Web Development') ? Code :
          skill.name.includes('React') ? Code :
          skill.name.includes('TypeScript') ? Code : BookOpen,
    color: skill.color
  }));

  const achievements = DEVELOPER_PROFILE.achievements.map(achievement => ({
    title: achievement.title,
    year: achievement.year,
    icon: achievement.type === 'leadership' ? Award :
          achievement.type === 'education' ? GraduationCap :
          achievement.type === 'professional' && achievement.title.includes('Cyber') ? Target :
          achievement.type === 'professional' ? Award : BookOpen
  }));

  // Get Praggo services from permanent profile
  const praggoServices = DEVELOPER_PROFILE.company.services.map(service => ({
    name: service.name,
    namebn: service.nameBengali,
    icon: service.category === 'construction' ? Building2 :
          service.category === 'technology' ? Monitor :
          service.category === 'education' ? (service.name.includes('Study Abroad') ? BookOpen : GraduationCap) :
          service.category === 'marketing' ? Target :
          service.category === 'agriculture' ? Heart :
          service.category === 'real-estate' ? Building2 : Building2
  }));

  return (
    <MobileWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/student')}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  data-testid="back-button"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-800">About Developer</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 space-y-6">
          
          {/* Profile Card */}
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-24 h-24 rounded-full mb-4 shadow-lg overflow-hidden">
                {!imageError ? (
                  <img 
                    src={DEVELOPER_PROFILE.personal.profileImage}
                    alt={DEVELOPER_PROFILE.personal.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">SR</span>
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                {DEVELOPER_PROFILE.personal.name}
              </CardTitle>
              <CardDescription className="text-lg text-purple-600 font-medium">
                {DEVELOPER_PROFILE.personal.title} • {DEVELOPER_PROFILE.personal.subtitle}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Education</p>
                    <p className="text-sm text-gray-600">B.Sc in Civil Engineering (Ongoing)</p>
                    <p className="text-xs text-gray-500">Gopalganj Science and Technology University</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Location</p>
                    <p className="text-sm text-gray-600">Gopalganj, Bangladesh</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Position</p>
                    <p className="text-sm text-gray-600">Founder & CEO of Praggo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Heart className="w-5 h-5" />
                About Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {DEVELOPER_PROFILE.bio.bengali.intro}
                </p>
                
                <p className="text-gray-700 leading-relaxed">
                  {DEVELOPER_PROFILE.bio.bengali.mission}
                </p>

                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <p className="text-purple-800 font-medium italic">
                    "{DEVELOPER_PROFILE.bio.bengali.quote}"
                  </p>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <a 
                    href={DEVELOPER_PROFILE.personal.facebook}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">Facebook Profile</span>
                  </a>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Mail className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{DEVELOPER_PROFILE.personal.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Code className="w-5 h-5" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 ${skill.color} rounded-lg flex items-center justify-center`}>
                      <skill.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Praggo Group Services */}
          <Card className="border-2 border-indigo-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Building2 className="w-5 h-5" />
                Our Concern - Praggo Group
              </CardTitle>
              <CardDescription>
                Multiple business divisions under Praggo umbrella
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {praggoServices.map((service, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <service.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-indigo-800 mb-1">{service.name}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{service.namebn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements Section */}
          <Card className="border-2 border-orange-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Award className="w-5 h-5" />
                Achievements & Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <achievement.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{achievement.title}</h3>
                      <p className="text-sm text-orange-600 font-medium">{achievement.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack Used */}
          <Card className="border-2 border-cyan-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <Monitor className="w-5 h-5" />
                This App Was Built With
              </CardTitle>
              <CardDescription>
                Technologies used to create this learning platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'TailwindCSS', 'Express.js'].map((tech) => (
                  <Badge key={tech} variant="outline" className="justify-center p-2 border-cyan-300 text-cyan-700">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mission & Vision */}
          <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Target className="w-5 h-5" />
                Our Mission & Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Mission */}
                <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-purple-800">Mission</h3>
                  </div>
                  <p className="text-purple-700 leading-relaxed">
                    প্রযুক্তি ও উদ্ভাবনের মাধ্যমে শিক্ষা, নির্মাণ, কৃষি এবং ব্যবসায়িক ক্ষেত্রে গুণগত সেবা প্রদান করে সমাজের উন্নয়নে অবদান রাখা এবং দেশের অর্থনৈতিক প্রগতিতে ভূমিকা পালন করা।
                  </p>
                </div>

                {/* Vision */}
                <div className="bg-gradient-to-r from-indigo-100 to-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-indigo-800">Vision</h3>
                  </div>
                  <p className="text-indigo-700 leading-relaxed">
                    ২০৩০ সালের মধ্যে বাংলাদেশের একটি নেতৃস্থানীয় বহুমুখী প্রতিষ্ঠান হিসেবে প্রাগো গ্রুপকে প্রতিষ্ঠিত করা, যা শিক্ষা, প্রযুক্তি, নির্মাণ এবং কৃষিতে আন্তর্জাতিক মানের সেবা প্রদান করবে।
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message for Students */}
          <Card className="border-2 border-rose-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <Heart className="w-5 h-5" />
                Message for Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg">
                  <p className="text-gray-800 leading-relaxed">
                    প্রিয় ছাত্র-ছাত্রীরা, শিক্ষাই জাতির মেরুদণ্ড। আমাদের এই ডিজিটাল প্ল্যাটফর্মের মাধ্যমে তোমরা আধুনিক শিক্ষা পদ্ধতিতে রসায়ন ও আইসিটি বিষয়ে জ্ঞান অর্জন করতে পারবে।
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-800 font-medium text-center">
                    🚀 স্বপ্ন দেখো, কাজ করো, সফল হও! 💫
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center py-6 text-gray-500 text-sm">
            <p>Made with ❤️ by Md Sahid Rahman - Founder & CEO, Praggo Group</p>
            <p className="mt-1">Chemistry & ICT Care • 2025</p>
          </div>
        </div>
      </div>
    </MobileWrapper>
  );
}
