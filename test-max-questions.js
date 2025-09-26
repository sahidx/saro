// Test script to verify maximum 50 questions limit
const fetch = require('node-fetch');

async function testMaxQuestions() {
    try {
        // Test with count > 50
        const response = await fetch('http://localhost:3001/api/ai/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'connect.sid=test' // Mock session
            },
            body: JSON.stringify({
                subject: 'math',
                classLevel: '8',
                chapter: 'ভগ্নাংশ',
                questionType: 'mcq',
                questionCategory: 'mixed',
                difficulty: 'medium',
                count: 60 // More than 50
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
        
        if (response.status === 400 && data.error.includes('৫০টি')) {
            console.log('✅ Maximum count validation working correctly!');
        } else {
            console.log('❌ Maximum count validation failed');
        }

    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testMaxQuestions();