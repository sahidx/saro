// Test teacher question generation with explanation display
console.log('🧪 Testing teacher question generation with explanations...\n');

async function loginAsTeacher() {
  console.log('🔐 Logging in as teacher...');
  
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber: '01762602056',
      password: 'golam123'
    })
  });

  if (loginResponse.ok) {
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Teacher login successful');
    return cookies;
  } else {
    const error = await loginResponse.text();
    console.log('❌ Login failed:', error);
    return null;
  }
}

async function testQuestionGeneration(cookies) {
  console.log('\n📚 Testing question generation for teachers...');
  
  const response = await fetch('http://localhost:3001/api/ai/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      subject: 'math',
      classLevel: '8', 
      chapter: '১. সংখ্যা পদ্ধতি - প্রাকৃতিক সংখ্যা',
      questionType: 'mcq',
      questionCategory: 'mixed',
      difficulty: 'medium',
      count: 2
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Question generation successful');
    console.log('📊 Generated', data.questions?.length || 0, 'questions');
    
    if (data.questions && data.questions.length > 0) {
      const question = data.questions[0];
      
      console.log('\n📝 SAMPLE QUESTION ANALYSIS:');
      console.log('Question Text:', question.questionText?.substring(0, 100) + '...');
      console.log('Has Options:', question.options ? '✅ Yes' : '❌ No');
      console.log('Has Correct Answer:', question.correctAnswer ? '✅ Yes' : '❌ No');
      console.log('Has Explanation:', question.explanation ? '✅ Yes' : '❌ No');
      console.log('Has Answer Field:', question.answer ? '✅ Yes' : '❌ No');
      
      // Check explanation content quality
      if (question.explanation) {
        console.log('\n🔍 EXPLANATION ANALYSIS:');
        console.log('Explanation Length:', question.explanation.length, 'characters');
        console.log('Has "সমাধান:":', question.explanation.includes('সমাধান:') ? '✅' : '❌');
        console.log('Has "ধাপ":', question.explanation.includes('ধাপ') ? '✅' : '❌');
        console.log('Has mathematical symbols:', /[+=\-×÷]/.test(question.explanation) ? '✅' : '❌');
        
        console.log('\n📖 Explanation Preview:');
        console.log(question.explanation.substring(0, 300) + '...');
      }
      
      if (question.answer) {
        console.log('\n📝 ANSWER FIELD ANALYSIS:');
        console.log('Answer Length:', question.answer.length, 'characters');
        console.log('Has "সমাধান:":', question.answer.includes('সমাধান:') ? '✅' : '❌');
        console.log('Has "ধাপ":', question.answer.includes('ধাপ') ? '✅' : '❌');
        console.log('Has mathematical symbols:', /[+=\-×÷]/.test(question.answer) ? '✅' : '❌');
        
        console.log('\n📖 Answer Field Preview:');
        console.log(question.answer.substring(0, 300) + '...');
      }
      
      return {
        hasExplanation: !!question.explanation,
        hasAnswer: !!question.answer,
        hasSteps: (question.explanation?.includes('সমাধান:') || question.answer?.includes('সমাধান:'))
      };
    }
  } else {
    const error = await response.text();
    console.log('❌ Question generation failed:', error);
    return null;
  }
}

// Run test
async function runTest() {
  try {
    const cookies = await loginAsTeacher();
    if (!cookies) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    const result = await testQuestionGeneration(cookies);
    
    console.log('\n🏁 TEST RESULTS:');
    if (result) {
      console.log('Question generation:', '✅ WORKING');
      console.log('Has explanation field:', result.hasExplanation ? '✅' : '❌');
      console.log('Has answer field:', result.hasAnswer ? '✅' : '❌');  
      console.log('Has step-by-step solve:', result.hasSteps ? '✅' : '❌');
      
      if (!result.hasExplanation && !result.hasAnswer) {
        console.log('\n⚠️  ISSUE: Questions lack explanation/answer fields');
      } else if (!result.hasSteps) {
        console.log('\n⚠️  ISSUE: Explanations lack step-by-step solutions');
      } else {
        console.log('\n🎉 EXPLANATIONS ARE WORKING PROPERLY!');
      }
    } else {
      console.log('Question generation:', '❌ FAILED');
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

runTest();