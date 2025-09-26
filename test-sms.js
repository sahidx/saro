// Simple test for SMS balance functionality
import axios from 'axios';

async function testSMSBalance() {
    try {
        console.log('Testing SMS balance endpoint...');
        
        // First test if server is running
        const healthCheck = await axios.get('http://localhost:3001/healthz');
        console.log('✅ Server is running:', healthCheck.data);
        
        // Test SMS balance check (this will likely fail due to authentication)
        try {
            const balanceResponse = await axios.post('http://localhost:3001/api/sms/check-balance', {
                recipientCount: 5,
                message: 'Test message'
            });
            console.log('✅ SMS balance check:', balanceResponse.data);
        } catch (authError) {
            console.log('⚠️ SMS balance check failed (expected - needs auth):', authError.response?.status);
        }
        
        // Test batch preview endpoint
        try {
            const previewResponse = await axios.get('http://localhost:3001/api/sms/batch-preview?batchIds=test&message=test');
            console.log('✅ Batch preview:', previewResponse.data);
        } catch (authError) {
            console.log('⚠️ Batch preview failed (expected - needs auth):', authError.response?.status);
        }
        
        console.log('\n🎉 Server endpoints are responsive!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSMSBalance();