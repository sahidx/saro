// Comprehensive test for enhanced explanations and doubt solver
console.log('🧪 Starting comprehensive AI system test...\n');

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

async function testEnhancedQuestionGeneration(cookies) {
  console.log('\n📚 Testing enhanced question generation...');
  
  const response = await fetch('http://localhost:3001/api/ai/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      subject: 'math',
      classLevel: '8',
      chapter: 'বীজগণিত',
      questionType: 'mcq',
      questionCategory: 'math-based',
      difficulty: 'medium',
      count: 2
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Question generation successful');
    
    if (data.questions && data.questions.length > 0) {
      const question = data.questions[0];
      console.log('📝 Sample question:', question.questionText);
      console.log('📖 Answer preview:', question.answer?.substring(0, 200) + '...');
      
      // Check for enhanced explanations
      const hasStepByStep = question.answer?.includes('সমাধান:') || question.answer?.includes('ধাপ');
      const hasFormula = question.answer?.includes('সূত্র') || question.answer?.includes('=');
      const hasExample = question.answer?.includes('বাস্তব জীবন') || question.answer?.includes('উদাহরণ');
      
      console.log('🔍 Enhanced explanation check:');
      console.log('   Step-by-step:', hasStepByStep ? '✅' : '❌');
      console.log('   Formula/calculation:', hasFormula ? '✅' : '❌');
      console.log('   Real-life example:', hasExample ? '✅' : '❌');
      
      return hasStepByStep || hasFormula;
    } else {
      console.log('❌ No questions generated');
      return false;
    }
  } else {
    const error = await response.text();
    console.log('❌ Question generation failed:', error);
    return false;
  }
}

async function testDoubtSolver(cookies) {
  console.log('\n🤖 Testing AI doubt solver...');
  
  const response = await fetch('http://localhost:3001/api/ai/solve-doubt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      doubt: '2x + 5 = 15 সমাধান কর',
      subject: 'math',
      stream: false
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Doubt solver response received');
    
    if (data.solution) {
      console.log('📖 Solution preview:', data.solution.substring(0, 300) + '...');
      
      // Check for proper solution structure
      const hasSteps = data.solution.includes('ধাপ') || data.solution.includes('সমাধান');
      const hasMath = data.solution.includes('x') || data.solution.includes('=');
      
      console.log('🔍 Solution quality check:');
      console.log('   Has step-by-step:', hasSteps ? '✅' : '❌');
      console.log('   Has mathematical content:', hasMath ? '✅' : '❌');
      
      return hasSteps && hasMath;
    } else {
      console.log('❌ No solution received');
      return false;
    }
  } else {
    const error = await response.text();
    console.log('❌ Doubt solver failed:', error);
    return false;
  }
}

async function testCurriculumCompliance(cookies) {
  console.log('\n📋 Testing curriculum compliance for different classes...');
  
  const testCases = [
    { classLevel: '6', subject: 'math', chapter: 'প্রাকৃতিক সংখ্যা' },
    { classLevel: '9-10', subject: 'general_math', chapter: 'ত্রিকোণমিতি' },
    { classLevel: '11-12', subject: 'higher_math', chapter: 'ক্যালকুলাস' }
  ];
  
  let passedTests = 0;
  
  for (const testCase of testCases) {
    console.log(`\n  Testing Class ${testCase.classLevel} - ${testCase.subject}...`);
    
    const response = await fetch('http://localhost:3001/api/ai/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        ...testCase,
        questionType: 'mcq',
        questionCategory: 'math-based',
        difficulty: 'medium',
        count: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        console.log(`  ✅ Class ${testCase.classLevel} question generated successfully`);
        passedTests++;
      } else {
        console.log(`  ❌ Class ${testCase.classLevel} question generation failed`);
      }
    } else {
      console.log(`  ❌ Class ${testCase.classLevel} request failed`);
    }
  }
  
  console.log(`\n📊 Curriculum tests: ${passedTests}/${testCases.length} passed`);
  return passedTests === testCases.length;
}

// Main test runner
async function runAllTests() {
  try {
    const cookies = await loginAsTeacher();
    if (!cookies) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    const enhancedQuestionsWork = await testEnhancedQuestionGeneration(cookies);
    const doubtSolverWorks = await testDoubtSolver(cookies);
    const curriculumWorks = await testCurriculumCompliance(cookies);
    
    console.log('\n🏁 FINAL RESULTS:');
    console.log('Enhanced explanations:', enhancedQuestionsWork ? '✅ WORKING' : '❌ NEEDS FIX');
    console.log('Doubt solver:', doubtSolverWorks ? '✅ WORKING' : '❌ NEEDS FIX');
    console.log('Curriculum compliance:', curriculumWorks ? '✅ WORKING' : '❌ NEEDS FIX');
    
    const allWorking = enhancedQuestionsWork && doubtSolverWorks && curriculumWorks;
    console.log('\nOverall status:', allWorking ? '🎉 ALL SYSTEMS WORKING!' : '⚠️ Some issues found');
    
  } catch (error) {
    console.error('🚨 Test suite error:', error.message);
  }
}

// Run tests
runAllTests();