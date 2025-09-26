// Test AI endpoints
import axios from 'axios';

async function testAIEndpoints() {
  console.log('🧪 Testing AI Endpoints...');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test 1: Try to access without auth
    console.log('\n1. Testing AI endpoint without authentication...');
    const response1 = await axios.post(`${baseUrl}/api/ai/generate-questions`, {
      subject: 'math',
      classLevel: '6',
      chapter: '১. সংখ্যা পদ্ধতি - প্রাকৃতিক সংখ্যা',
      questionType: 'mcq',
      count: 2
    }).catch(err => ({
      status: err.response?.status,
      data: err.response?.data
    }));
    
    console.log('Response:', response1.status, response1.data);
    
  } catch (error) {
    console.log('Error testing AI endpoints:', error.message);
  }
}

// Test praggoAI directly
async function testPraggoAIDirect() {
  console.log('\n🤖 Testing PraggoAI directly...');
  
  try {
    const { praggoAI } = await import('./server/praggoAI.js');
    
    const result = await praggoAI.generateQuestions(
      'math', 
      '6', 
      '১. সংখ্যা পদ্ধতি - প্রাকৃতিক সংখ্যা', 
      'mcq', 
      'mixed', 
      'easy', 
      2, 
      'test-user', 
      'teacher'
    );
    
    console.log('✅ Direct PraggoAI test successful!');
    console.log('Generated questions:', result.length);
    console.log('Sample question:', result[0]?.questionText?.substring(0, 100) + '...');
    
  } catch (error) {
    console.log('❌ Direct PraggoAI test failed:', error.message);
  }
}

testAIEndpoints();
testPraggoAIDirect();