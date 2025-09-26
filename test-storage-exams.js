// Test the improved storage functionality
import dotenv from 'dotenv';
dotenv.config();

import { createStorageClient } from './server/storage.js';

console.log('🧪 Testing improved storage exam functionality...');

async function testStorageExamOperations() {
  const storage = createStorageClient();
  
  try {
    console.log('📝 Creating exam via storage.createExam...');
    
    const testExam = {
      title: "Storage Test Exam",
      subject: "math",
      chapter: "Trigonometry",
      targetClass: "11",
      description: "Test exam via storage layer",
      instructions: "Complete all questions",
      examDate: new Date('2025-01-15T10:00:00Z'),
      duration: 90,
      examType: "written",
      examMode: "offline",
      batchId: null,
      targetStudents: null,
      questionSource: "file_upload",
      questionContent: null,
      questionPaperImage: null,
      totalMarks: 80,
      isActive: true,
      createdBy: "teacher-storage-test"
    };
    
    const createdExam = await storage.createExam(testExam);
    console.log('✅ Exam created successfully via storage:', createdExam.id);
    
    console.log('\n📋 Retrieving exams via getExamsByTeacher...');
    const teacherExams = await storage.getExamsByTeacher("teacher-storage-test");
    console.log(`📊 Found ${teacherExams.length} exams for teacher`);
    
    if (teacherExams.length > 0) {
      const exam = teacherExams[0];
      console.log('📄 Exam details:');
      console.log(`   - ID: ${exam.id}`);
      console.log(`   - Title: ${exam.title}`);
      console.log(`   - Subject: ${exam.subject}`);
      console.log(`   - Date: ${exam.examDate}`);
      console.log(`   - Active: ${exam.isActive}`);
      console.log(`   - Created: ${exam.createdAt}`);
    }
    
    console.log('\n📊 Testing getAllActiveExams...');
    const allActiveExams = await storage.getAllActiveExams();
    console.log(`📋 Found ${allActiveExams.length} total active exams`);
    
    console.log('\n✅ All storage tests passed!');
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testStorageExamOperations();