// Test enhanced AI explanations for questions
const fetch = require('node-fetch');

async function testAIQuestionGeneration() {
  try {
    console.log('🧪 Testing enhanced AI question generation with explanations...');
    
    // Test math question with enhanced explanations
    const response = await fetch('http://localhost:3001/api/ai/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test' // Mock session for testing
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

    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI Response received');
      
      if (data.questions && data.questions.length > 0) {
        const firstQuestion = data.questions[0];
        console.log('📝 Sample question:', firstQuestion.questionText);
        console.log('📖 Enhanced explanation:', firstQuestion.answer);
        
        // Check if explanation has proper structure
        const hasStepByStep = firstQuestion.answer.includes('সমাধান:') || firstQuestion.answer.includes('ধাপ');
        const hasFormula = firstQuestion.answer.includes('সূত্র') || firstQuestion.answer.includes('=');
        const hasExample = firstQuestion.answer.includes('বাস্তব জীবন') || firstQuestion.answer.includes('উদাহরণ');
        
        console.log('🔍 Explanation quality check:');
        console.log('   Step-by-step solution:', hasStepByStep ? '✅' : '❌');
        console.log('   Formula/calculation:', hasFormula ? '✅' : '❌');  
        console.log('   Real-life example:', hasExample ? '✅' : '❌');
        
        if (hasStepByStep && hasFormula) {
          console.log('🎉 Enhanced explanations working correctly!');
        } else {
          console.log('⚠️ Explanations need improvement');
        }
      } else {
        console.log('❌ No questions generated');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Request failed:', errorText);
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

async function testAIDoubtSolver() {
  try {
    console.log('\n🤖 Testing AI doubt solver...');
    
    const response = await fetch('http://localhost:3001/api/ai/solve-doubt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test' // Mock session
      },
      body: JSON.stringify({
        doubt: 'x + 5 = 12 সমাধান কর',
        subject: 'math',
        stream: false
      })
    });

    console.log('📊 Doubt solver response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI Doubt solver response received');
      console.log('📖 Solution:', data.solution?.substring(0, 200) + '...');
    } else {
      const errorText = await response.text();
      console.log('❌ Doubt solver failed:', errorText);
    }
    
  } catch (error) {
    console.error('🚨 Doubt solver test error:', error.message);
  }
}

// Run tests
(async () => {
  await testAIQuestionGeneration();
  await testAIDoubtSolver();
  console.log('\n🏁 Testing completed!');
})();