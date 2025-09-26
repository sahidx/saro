// Simple test using fetch to validate max count
async function testMaxQuestions() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject: 'math',
                classLevel: '8', 
                chapter: 'ভগ্নাংশ',
                questionType: 'mcq',
                questionCategory: 'mixed',
                difficulty: 'medium',
                count: 60 // More than 50 - should be rejected
            })
        });

        const data = await response.json();
        
        console.log('Response Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (response.status === 400 && data.error && data.error.includes('৫০টি')) {
            console.log('\n✅ SUCCESS: Maximum count validation working correctly!');
            console.log('✅ The system properly rejects requests for more than 50 questions');
        } else if (response.status === 401) {
            console.log('\n⚠️ Authentication required - this is expected without login session');
        } else {
            console.log('\n❌ FAIL: Maximum count validation not working as expected');
        }
    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testMaxQuestions();