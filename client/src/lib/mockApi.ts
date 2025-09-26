// Mock API service for development testing when backend is unavailable
import { ALL_SUBJECTS, ALL_CLASSES } from '@/../../shared/educationSystem';

export const mockApiResponses: Record<string, any> = {
  '/api/user/sms-credits': {
    smsCredits: 1000,
    currentBalance: 1000,
    totalUsed: 150,
    monthlyUsage: 45,
    lastUpdated: new Date().toISOString()
  },
  
  '/api/sms/templates': [
    {
      id: 1,
      name: 'হাজিরা অনুস্মারক',
      type: 'attendance',
      template: 'প্রিয় {{studentName}} এর অভিভাবক, {{date}} তারিখে আপনার সন্তান ক্লাসে {{attendanceStatus}} ছিল। {{batchName}} - {{teacherName}}',
      description: 'দৈনিক হাজিরার জন্য SMS টেমপ্লেট',
      language: 'bengali',
      isActive: true,
      variables: [
        { id: 1, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
        { id: 2, variableName: 'date', description: 'তারিখ', isRequired: true },
        { id: 3, variableName: 'attendanceStatus', description: 'হাজিরার অবস্থা', isRequired: true },
        { id: 4, variableName: 'batchName', description: 'ব্যাচের নাম', isRequired: true },
        { id: 5, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
      ]
    },
    {
      id: 2,
      name: 'পরীক্ষার বিজ্ঞপ্তি',
      type: 'exam_notification',
      template: 'প্রিয় {{studentName}} এর অভিভাবক, {{examTitle}} পরীক্ষা {{examDate}} তারিখে {{examTime}} সময়ে অনুষ্ঠিত হবে। সিলেবাস: {{syllabus}}। সময়কাল: {{duration}} মিনিট। - {{teacherName}}',
      description: 'পরীক্ষার জন্য বিজ্ঞপ্তি SMS',
      language: 'bengali',
      isActive: true,
      variables: [
        { id: 6, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
        { id: 7, variableName: 'examTitle', description: 'পরীক্ষার নাম', isRequired: true },
        { id: 8, variableName: 'examDate', description: 'পরীক্ষার তারিখ', isRequired: true },
        { id: 9, variableName: 'examTime', description: 'পরীক্ষার সময়', isRequired: true },
        { id: 10, variableName: 'syllabus', description: 'সিলেবাস', isRequired: true },
        { id: 11, variableName: 'duration', description: 'সময়কাল', isRequired: true },
        { id: 12, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
      ]
    },
    {
      id: 3,
      name: 'পরীক্ষার ফলাফল',
      type: 'exam_result',
      template: 'প্রিয় {{studentName}} এর অভিভাবক, {{examTitle}} পরীক্ষার ফলাফল: প্রাপ্ত নম্বর {{obtainedMarks}}/{{totalMarks}} ({{percentage}}%)। গ্রেড: {{grade}}। অবস্থান: {{rank}}। - {{teacherName}}',
      description: 'পরীক্ষার ফলাফল SMS',
      language: 'bengali',
      isActive: true,
      variables: [
        { id: 13, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
        { id: 14, variableName: 'examTitle', description: 'পরীক্ষার নাম', isRequired: true },
        { id: 15, variableName: 'obtainedMarks', description: 'প্রাপ্ত নম্বর', isRequired: true },
        { id: 16, variableName: 'totalMarks', description: 'পূর্ণ নম্বর', isRequired: true },
        { id: 17, variableName: 'percentage', description: 'শতকরা নম্বর', isRequired: true },
        { id: 18, variableName: 'grade', description: 'গ্রেড', isRequired: true },
        { id: 19, variableName: 'rank', description: 'অবস্থান', isRequired: true },
        { id: 20, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
      ]
    },
    {
      id: 4,
      name: 'মাসিক পরীক্ষার ফলাফল',
      type: 'monthly_exam',
      template: 'প্রিয় {{studentName}} এর অভিভাবক, {{month}} মাসের ফলাফল: গড় নম্বর {{averageMarks}}%, হাজিরা {{attendancePercentage}}%, অবস্থান {{rank}}/{{totalStudents}}। মোট পরীক্ষা: {{totalExams}}টি। - {{teacherName}}',
      description: 'মাসিক ফলাফলের জন্য SMS',
      language: 'bengali',
      isActive: true,
      variables: [
        { id: 21, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
        { id: 22, variableName: 'month', description: 'মাসের নাম', isRequired: true },
        { id: 23, variableName: 'averageMarks', description: 'গড় নম্বর', isRequired: true },
        { id: 24, variableName: 'attendancePercentage', description: 'হাজিরার শতকরা', isRequired: true },
        { id: 25, variableName: 'rank', description: 'অবস্থান', isRequired: true },
        { id: 26, variableName: 'totalStudents', description: 'মোট ছাত্রসংখ্যা', isRequired: true },
        { id: 27, variableName: 'totalExams', description: 'মোট পরীক্ষা', isRequired: true },
        { id: 28, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
      ]
    }
  ],
  
  '/api/teacher/dashboard': {
    success: true,
    teacher: {
      id: 'teacher-current',
      name: 'Teacher',
      email: 'teacher@coaching.com',
      phoneNumber: '01762602056'
    },
    batches: []
  },
  
  '/api/batches': [
    {
      id: 'batch-22che',
      name: 'HSC Chemistry Batch 2022',
      subject: 'chemistry', 
      batchCode: '22che',
      currentStudents: 1,
      maxStudents: 30,
      status: 'active'
    }
  ],
  
  '/api/batches/batch-22che/students': [
    {
      id: 'student-sahid',
      firstName: 'Sahid',
      lastName: 'Rahman',
      studentId: '22CHE001',
      phoneNumber: '01818291546',
      parentPhoneNumber: '01818291546',
      batchId: 'batch-22che'
    }
  ],
  
  '/api/sms/test-send': {
    success: true,
    sentCount: 1,
    failedCount: 0,
    totalCost: 1,
    message: 'Test SMS sent successfully to 1 student (limited for testing)'
  },
  
  '/api/sms/templates/create-defaults': {
    success: true,
    message: 'Default templates created successfully',
    templates: [
      {
        id: 1,
        name: 'হাজিরা অনুস্মারক',
        type: 'attendance',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{date}} তারিখে আপনার সন্তান ক্লাসে {{attendanceStatus}} ছিল। {{batchName}} - {{teacherName}}',
        description: 'দৈনিক হাজিরার জন্য SMS টেমপ্লেট',
        language: 'bengali',
        isActive: true,
        variables: [
          { id: 1, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { id: 2, variableName: 'date', description: 'তারিখ', isRequired: true },
          { id: 3, variableName: 'attendanceStatus', description: 'হাজিরার অবস্থা', isRequired: true },
          { id: 4, variableName: 'batchName', description: 'ব্যাচের নাম', isRequired: true },
          { id: 5, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      },
      {
        id: 2,
        name: 'পরীক্ষার বিজ্ঞপ্তি',
        type: 'exam_notification',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{examTitle}} পরীক্ষা {{examDate}} তারিখে {{examTime}} সময়ে অনুষ্ঠিত হবে। সিলেবাস: {{syllabus}}। সময়কাল: {{duration}} মিনিট। - {{teacherName}}',
        description: 'পরীক্ষার জন্য বিজ্ঞপ্তি SMS',
        language: 'bengali',
        isActive: true,
        variables: [
          { id: 6, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { id: 7, variableName: 'examTitle', description: 'পরীক্ষার নাম', isRequired: true },
          { id: 8, variableName: 'examDate', description: 'পরীক্ষার তারিখ', isRequired: true },
          { id: 9, variableName: 'examTime', description: 'পরীক্ষার সময়', isRequired: true },
          { id: 10, variableName: 'syllabus', description: 'সিলেবাস', isRequired: false },
          { id: 11, variableName: 'duration', description: 'পরীক্ষার সময়কাল', isRequired: true },
          { id: 12, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      },
      {
        id: 3,
        name: 'পরীক্ষার ফলাফল',
        type: 'exam_result',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{examTitle}} পরীক্ষায় আপনার সন্তানের নম্বর {{marks}}/{{totalMarks}} ({{percentage}}%)। অবস্থান: {{rank}}/{{totalStudents}}। - {{teacherName}}',
        description: 'পরীক্ষার ফলাফলের জন্য SMS',
        language: 'bengali',
        isActive: true,
        variables: [
          { id: 13, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { id: 14, variableName: 'examTitle', description: 'পরীক্ষার নাম', isRequired: true },
          { id: 15, variableName: 'marks', description: 'প্রাপ্ত নম্বর', isRequired: true },
          { id: 16, variableName: 'totalMarks', description: 'পূর্ণমান', isRequired: true },
          { id: 17, variableName: 'percentage', description: 'শতকরা নম্বর', isRequired: true },
          { id: 18, variableName: 'rank', description: 'অবস্থান', isRequired: true },
          { id: 19, variableName: 'totalStudents', description: 'মোট ছাত্রসংখ্যা', isRequired: true },
          { id: 20, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      },
      {
        id: 4,
        name: 'মাসিক পরীক্ষার ফলাফল',
        type: 'monthly_exam',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{month}} মাসের ফলাফল: গড় নম্বর {{averageMarks}}%, হাজিরা {{attendancePercentage}}%, অবস্থান {{rank}}/{{totalStudents}}। মোট পরীক্ষা: {{totalExams}}টি। - {{teacherName}}',
        description: 'মাসিক ফলাফলের জন্য SMS',
        language: 'bengali',
        isActive: true,
        variables: [
          { id: 21, variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { id: 22, variableName: 'month', description: 'মাসের নাম', isRequired: true },
          { id: 23, variableName: 'averageMarks', description: 'গড় নম্বর', isRequired: true },
          { id: 24, variableName: 'attendancePercentage', description: 'হাজিরার শতকরা', isRequired: true },
          { id: 25, variableName: 'rank', description: 'অবস্থান', isRequired: true },
          { id: 26, variableName: 'totalStudents', description: 'মোট ছাত্রসংখ্যা', isRequired: true },
          { id: 27, variableName: 'totalExams', description: 'মোট পরীক্ষা', isRequired: true },
          { id: 28, variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      }
    ]
  }
};

// Mock attendance data
export const mockAttendanceData: Record<string, any> = {
  '/api/attendance': [
    {
      id: 1,
      studentId: 'student-sahid',
      batchId: 'batch-22che',
      date: '2025-09-26',
      status: 'present',
      createdAt: new Date().toISOString()
    }
  ],
  
  '/api/attendance/batch/batch-22che': [
    {
      studentId: 'student-sahid',
      firstName: 'Sahid',
      lastName: 'Rahman',
      studentNumber: '22CHE001',
      attendance: [
        { date: '2025-09-26', status: 'present' },
        { date: '2025-09-25', status: 'present' },
        { date: '2025-09-24', status: 'absent' },
        { date: '2025-09-23', status: 'present' }
      ]
    }
  ]
};

// Mock monthly results data  
export const mockMonthlyResults: Record<string, any> = {
  '/api/monthly-results': [
    {
      id: 1,
      studentId: 'student-sahid',
      batchId: 'batch-22che',
      year: 2025,
      month: 9, // September
      classLevel: 'HSC',
      examAverage: 85,
      totalExams: 3,
      presentDays: 20,
      absentDays: 2,
      excusedDays: 0,
      workingDays: 22,
      attendancePercentage: 91,
      bonusMarks: 8, // 30 - 22 = 8
      totalScore: 93, // 85 + 8 = 93
      grade: 'A+',
      rank: 1,
      createdAt: new Date().toISOString()
    }
  ]
};

// Mock exam data
export const mockExamData: Record<string, any> = {
  '/api/exams': [
    {
      id: 'exam-1',
      title: 'রসায়ন প্রথম পত্র - অধ্যায় ১',
      subject: 'chemistry',
      targetClass: 'HSC',
      chapter: 'পরমাণুর গঠন',
      examDate: '2025-09-28T10:00:00.000Z',
      duration: 60,
      examType: 'written',
      examMode: 'regular',
      totalMarks: 50,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'exam-2', 
      title: 'রসায়ন MCQ টেস্ট - অধ্যায় ২',
      subject: 'chemistry',
      targetClass: 'HSC',
      chapter: 'মৌলের পর্যায়বৃত্ত ধর্ম',
      examDate: '2025-10-02T14:00:00.000Z',
      duration: 45,
      examType: 'mcq',
      examMode: 'online',
      totalMarks: 30,
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]
};

// Development mode API interceptor
export function setupMockApi() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch for development
  window.fetch = async (url: string | Request | URL, options?: RequestInit): Promise<Response> => {
    const urlString = url.toString();
    
    // Check if this is a mock-able API request
    if (urlString.startsWith('/api/')) {
      console.log('🔧 [Mock API]', options?.method || 'GET', urlString);
      
      // Handle different endpoints
      if (mockApiResponses[urlString]) {
        return new Response(JSON.stringify(mockApiResponses[urlString]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle dynamic batch student endpoints
      if (urlString.includes('/api/batches/') && urlString.includes('/students')) {
        const batchId = urlString.match(/\/api\/batches\/([^\/]+)\/students/)?.[1];
        if (batchId === 'batch-22che') {
          return new Response(JSON.stringify(mockApiResponses['/api/batches/batch-22che/students']), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle dynamic attendance endpoints  
      if (urlString.includes('/api/attendance/batch/')) {
        const match = urlString.match(/\/api\/attendance\/batch\/([^\/]+)\/(.+)/);
        if (match) {
          const [, batchId, date] = match;
          // Return existing attendance or empty array
          return new Response(JSON.stringify([
            {
              studentId: 'student-sahid',
              isPresent: true,
              notes: '',
              date: date
            }
          ]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Handle attendance endpoints
      if (mockAttendanceData[urlString]) {
        return new Response(JSON.stringify(mockAttendanceData[urlString]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle monthly results
      if (mockMonthlyResults[urlString]) {
        return new Response(JSON.stringify(mockMonthlyResults[urlString]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle exam endpoints
      if (mockExamData[urlString]) {
        return new Response(JSON.stringify(mockExamData[urlString]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle POST requests for template creation
      if (urlString === '/api/sms/templates' && options?.method === 'POST') {
        console.log('🔧 [Mock API] Creating new template');
        return new Response(JSON.stringify({ id: Date.now(), success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle attendance save
      if (urlString.includes('/api/attendance') && options?.method === 'POST') {
        console.log('🔧 [Mock API] Saving attendance');
        if (urlString === '/api/attendance/take') {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Attendance recorded successfully',
            summary: {
              total: 1,
              present: 1, 
              absent: 0
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ success: true, message: 'Attendance saved' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle monthly results generation
      if (urlString === '/api/monthly-results/generate' && options?.method === 'POST') {
        console.log('🔧 [Mock API] Generating monthly results');
        const body = JSON.parse(options?.body as string || '{}');
        const { batchId, year, month } = body;
        
        const selectedBatch = mockApiResponses['/api/teacher/dashboard'].batches.find((b: any) => b.id === batchId);
        if (!selectedBatch) {
          return new Response(JSON.stringify({ success: false, error: 'Batch not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Generate mock monthly results for students
        const monthlyResults = selectedBatch.students.map((student: any, index: number) => {
          const examAverage = 70 + Math.random() * 25; // 70-95%
          const attendancePercentage = 75 + Math.random() * 25; // 75-100%
          const workingDays = 22;
          const presentDays = Math.floor((attendancePercentage / 100) * workingDays);
          const bonusMarks = Math.max(0, 30 - workingDays);
          const finalScore = Math.round((examAverage * 0.7) + (attendancePercentage * 0.2) + (bonusMarks * 0.1));
          
          return {
            studentId: student.id,
            studentName: student.name,
            batchId: batchId,
            classLevel: selectedBatch.classLevel,
            examAverage: Math.round(examAverage),
            attendancePercentage: Math.round(attendancePercentage),
            bonusMarks: bonusMarks,
            finalScore: finalScore,
            rank: index + 1, // Will be sorted later
            totalStudents: selectedBatch.students.length,
            presentDays: presentDays,
            workingDays: workingDays,
            totalExams: 4 + Math.floor(Math.random() * 3) // 4-6 exams
          };
        }).sort((a: any, b: any) => b.finalScore - a.finalScore)
          .map((result: any, index: number) => ({ ...result, rank: index + 1 }));

        return new Response(JSON.stringify({
          success: true,
          message: `Monthly results generated successfully for ${selectedBatch.name}`,
          results: monthlyResults
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle monthly results fetch
      if (urlString.match(/^\/api\/monthly-results\/[^\/]+\/\d{4}\/\d{1,2}$/)) {
        console.log('🔧 [Mock API] Fetching monthly results');
        const pathParts = urlString.split('/');
        const batchId = pathParts[3];
        const year = pathParts[4];  
        const month = pathParts[5];
        
        const selectedBatch = mockApiResponses['/api/teacher/dashboard'].batches.find((b: any) => b.id === batchId);
        if (!selectedBatch) {
          return new Response(JSON.stringify({ success: false, error: 'Batch not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Return empty results initially (user needs to generate first)
        return new Response(JSON.stringify({
          success: true,
          results: [] // Empty initially, will be populated after generation
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle top performers fetch
      if (urlString.match(/^\/api\/top-performers\/\d{4}\/\d{1,2}$/)) {
        console.log('🔧 [Mock API] Fetching top performers');
        const pathParts = urlString.split('/');
        const year = pathParts[3];
        const month = pathParts[4];
        
        // Generate mock top performers from all batches
        const allBatches = mockApiResponses['/api/teacher/dashboard'].batches;
        const topPerformers: any[] = [];
        
        allBatches.forEach((batch: any) => {
          // Get top 5 students from each batch
          const batchTopPerformers = batch.students.slice(0, 5).map((student: any, index: number) => {
            const finalScore = 95 - (index * 3) + Math.random() * 3; // Descending scores
            return {
              studentId: student.id,
              year: parseInt(year),
              month: parseInt(month),
              classLevel: batch.classLevel,
              rank: index + 1,
              finalScore: Math.round(finalScore),
              studentName: student.name,
              studentPhoto: null
            };
          });
          topPerformers.push(...batchTopPerformers);
        });

        return new Response(JSON.stringify({
          success: true,
          topPerformers: topPerformers
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For non-API requests, use original fetch
    return originalFetch(url, options);
  };
  
  console.log('🔧 Mock API interceptor activated for development');
}