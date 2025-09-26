// Complete Bangladesh Education System - Subjects and Classes Configuration
export interface Subject {
  id: string;
  name: string;
  nameBangla: string;
  icon: string;
  color: string;
  classes: string[];
  category: 'science' | 'arts' | 'commerce' | 'general';
}

export interface Class {
  id: string;
  name: string;
  nameBangla: string;
  level: 'primary' | 'secondary' | 'higher_secondary';
  subjects: string[];
}

// All subjects in Bangladesh education system
export const ALL_SUBJECTS: Subject[] = [
  // Science Subjects
  {
    id: 'physics',
    name: 'Physics',
    nameBangla: 'পদার্থবিজ্ঞান',
    icon: '⚛️',
    color: 'text-blue-600 bg-blue-50',
    classes: ['9', '10', '11', '12'],
    category: 'science'
  },
  {
    id: 'chemistry',
    name: 'Chemistry', 
    nameBangla: 'রসায়ন',
    icon: '🧪',
    color: 'text-green-600 bg-green-50',
    classes: ['9', '10', '11', '12'],
    category: 'science'
  },
  {
    id: 'biology',
    name: 'Biology',
    nameBangla: 'জীববিজ্ঞান',
    icon: '🧬',
    color: 'text-emerald-600 bg-emerald-50',
    classes: ['9', '10', '11', '12'],
    category: 'science'
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    nameBangla: 'গণিত',
    icon: '🔢',
    color: 'text-purple-600 bg-purple-50',
    classes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'general'
  },
  {
    id: 'higher_mathematics',
    name: 'Higher Mathematics',
    nameBangla: 'উচ্চতর গণিত',
    icon: '📐',
    color: 'text-indigo-600 bg-indigo-50', 
    classes: ['11', '12'],
    category: 'science'
  },
  
  // Language Subjects
  {
    id: 'bangla',
    name: 'Bangla',
    nameBangla: 'বাংলা',
    icon: '📚',
    color: 'text-red-600 bg-red-50',
    classes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'general'
  },
  {
    id: 'english',
    name: 'English',
    nameBangla: 'ইংরেজি',
    icon: '🇬🇧',
    color: 'text-sky-600 bg-sky-50',
    classes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'general'
  },
  {
    id: 'arabic',
    name: 'Arabic',
    nameBangla: 'আরবি',
    icon: '📖',
    color: 'text-amber-600 bg-amber-50',
    classes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'general'
  },
  
  // Social Sciences
  {
    id: 'history',
    name: 'History',
    nameBangla: 'ইতিহাস',
    icon: '🏛️',
    color: 'text-orange-600 bg-orange-50',
    classes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'arts'
  },
  {
    id: 'geography',
    name: 'Geography',
    nameBangla: 'ভূগোল',
    icon: '🌍',
    color: 'text-teal-600 bg-teal-50',
    classes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'arts'
  },
  {
    id: 'civics',
    name: 'Civics',
    nameBangla: 'পৌরনীতি ও সুশাসন',
    icon: '🏛️',
    color: 'text-slate-600 bg-slate-50',
    classes: ['9', '10', '11', '12'],
    category: 'arts'
  },
  {
    id: 'economics',
    name: 'Economics',
    nameBangla: 'অর্থনীতি',
    icon: '📈',
    color: 'text-yellow-600 bg-yellow-50',
    classes: ['11', '12'],
    category: 'arts'
  },
  {
    id: 'sociology',
    name: 'Sociology',
    nameBangla: 'সমাজকর্ম',
    icon: '👥',
    color: 'text-pink-600 bg-pink-50',
    classes: ['11', '12'],
    category: 'arts'
  },
  
  // Commerce Subjects
  {
    id: 'accounting',
    name: 'Accounting',
    nameBangla: 'হিসাববিজ্ঞান',
    icon: '💼',
    color: 'text-gray-600 bg-gray-50',
    classes: ['11', '12'],
    category: 'commerce'
  },
  {
    id: 'business_studies',
    name: 'Business Studies',
    nameBangla: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা',
    icon: '🏢',
    color: 'text-blue-700 bg-blue-50',
    classes: ['11', '12'],
    category: 'commerce'
  },
  {
    id: 'finance',
    name: 'Finance',
    nameBangla: 'ফিন্যান্স ও ব্যাংকিং',
    icon: '🏦',
    color: 'text-green-700 bg-green-50',
    classes: ['11', '12'],
    category: 'commerce'
  },
  
  // Technology Subjects
  {
    id: 'ict',
    name: 'ICT',
    nameBangla: 'তথ্য ও যোগাযোগ প্রযুক্তি',
    icon: '💻',
    color: 'text-cyan-600 bg-cyan-50',
    classes: ['9', '10', '11', '12'],
    category: 'general'
  },
  
  // Religious Studies
  {
    id: 'islam',
    name: 'Islam & Moral Education',
    nameBangla: 'ইসলাম ও নৈতিক শিক্ষা',
    icon: '☪️',
    color: 'text-emerald-700 bg-emerald-50',
    classes: ['6', '7', '8', '9', '10', '11', '12'],
    category: 'general'
  },
  
  // Others
  {
    id: 'general_science',
    name: 'General Science',
    nameBangla: 'সাধারণ বিজ্ঞান',
    icon: '🔬',
    color: 'text-violet-600 bg-violet-50',
    classes: ['6', '7', '8'],
    category: 'general'
  },
  {
    id: 'bangladesh_studies',
    name: 'Bangladesh & Global Studies',
    nameBangla: 'বাংলাদেশ ও বিশ্বপরিচয়',
    icon: '🇧🇩',
    color: 'text-red-700 bg-red-50',
    classes: ['6', '7', '8'],
    category: 'general'
  }
];

// All classes in Bangladesh education system
export const ALL_CLASSES: Class[] = [
  // Primary Level
  {
    id: '6',
    name: 'Class 6',
    nameBangla: '৬ষ্ঠ শ্রেণি',
    level: 'primary',
    subjects: ['bangla', 'english', 'mathematics', 'general_science', 'bangladesh_studies', 'islam', 'arabic']
  },
  {
    id: '7', 
    name: 'Class 7',
    nameBangla: '৭ম শ্রেণি',
    level: 'primary',
    subjects: ['bangla', 'english', 'mathematics', 'general_science', 'bangladesh_studies', 'islam', 'arabic']
  },
  {
    id: '8',
    name: 'Class 8', 
    nameBangla: '৮ম শ্রেণি',
    level: 'primary',
    subjects: ['bangla', 'english', 'mathematics', 'general_science', 'bangladesh_studies', 'islam', 'arabic']
  },
  
  // Secondary Level (SSC)
  {
    id: '9',
    name: 'Class 9 (SSC)',
    nameBangla: '৯ম শ্রেণি (এসএসসি)',
    level: 'secondary',
    subjects: ['bangla', 'english', 'mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'ict', 'islam', 'arabic']
  },
  {
    id: '10',
    name: 'Class 10 (SSC)',
    nameBangla: '১০ম শ্রেণি (এসএসসি)',
    level: 'secondary', 
    subjects: ['bangla', 'english', 'mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography', 'civics', 'ict', 'islam', 'arabic']
  },
  
  // Higher Secondary Level (HSC)
  {
    id: '11',
    name: 'Class 11 (HSC)',
    nameBangla: '১১শ শ্রেণি (এইচএসসি)',
    level: 'higher_secondary',
    subjects: ['bangla', 'english', 'mathematics', 'physics', 'chemistry', 'biology', 'higher_mathematics', 'history', 'geography', 'civics', 'economics', 'sociology', 'accounting', 'business_studies', 'finance', 'ict', 'islam', 'arabic']
  },
  {
    id: '12',
    name: 'Class 12 (HSC)',
    nameBangla: '১২শ শ্রেণি (এইচএসসি)',
    level: 'higher_secondary',
    subjects: ['bangla', 'english', 'mathematics', 'physics', 'chemistry', 'biology', 'higher_mathematics', 'history', 'geography', 'civics', 'economics', 'sociology', 'accounting', 'business_studies', 'finance', 'ict', 'islam', 'arabic']
  }
];

// Helper functions
export const getSubjectById = (id: string) => ALL_SUBJECTS.find(s => s.id === id);
export const getClassById = (id: string) => ALL_CLASSES.find(c => c.id === id);
export const getSubjectsByClass = (classId: string) => {
  const classInfo = getClassById(classId);
  return classInfo ? classInfo.subjects.map(getSubjectById).filter(Boolean) : [];
};
export const getClassesBySubject = (subjectId: string) => {
  const subject = getSubjectById(subjectId);
  return subject ? subject.classes.map(getClassById).filter(Boolean) : [];
};