/**
 * Test script to verify SMS balance features and template functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
let sessionCookie = '';

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(sessionCookie && { Cookie: sessionCookie }),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });

  // Capture session cookie from login
  if (response.headers.get('set-cookie') && url.includes('/auth/login')) {
    sessionCookie = response.headers.get('set-cookie');
  }

  return response;
}

async function testSMSFeatures() {
  console.log('🧪 Testing SMS Balance and Template Features...\n');

  try {
    // 1. Test login first
    console.log('1️⃣ Testing Login...');
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '01762602056', // Teacher's phone
        password: 'sir@123@'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.user?.firstName);
    } else {
      console.log('❌ Login failed:', await loginResponse.text());
      return;
    }

    // 2. Test SMS Credits endpoint
    console.log('\n2️⃣ Testing SMS Credits...');
    const creditsResponse = await makeRequest('/api/user/sms-credits');
    
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      console.log('✅ SMS Credits:', creditsData.smsCredits);
    } else {
      console.log('❌ SMS Credits failed:', await creditsResponse.text());
    }

    // 3. Test SMS Templates endpoint
    console.log('\n3️⃣ Testing SMS Templates...');
    const templatesResponse = await makeRequest('/api/sms/templates');
    
    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log('✅ SMS Templates count:', templatesData.length);
      templatesData.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name} (${template.type})`);
      });
    } else {
      console.log('❌ SMS Templates failed:', await templatesResponse.text());
    }

    // 4. Test SMS Balance Check
    console.log('\n4️⃣ Testing SMS Balance Check...');
    const balanceCheckResponse = await makeRequest('/api/sms/check-balance', {
      method: 'POST',
      body: JSON.stringify({
        recipientCount: 5,
        message: 'Test message for balance check'
      })
    });
    
    if (balanceCheckResponse.ok) {
      const balanceData = await balanceCheckResponse.json();
      console.log('✅ Balance Check Result:');
      console.log('   Has Balance:', balanceData.hasBalance);
      console.log('   Current Balance:', balanceData.currentBalance);
      console.log('   Required Credits:', balanceData.requiredCredits);
      console.log('   Recipient Count:', balanceData.recipientCount);
    } else {
      console.log('❌ Balance Check failed:', await balanceCheckResponse.text());
    }

    // 5. Test Batch Preview (might fail if no batches)
    console.log('\n5️⃣ Testing Batch SMS Preview...');
    const batchPreviewResponse = await makeRequest('/api/sms/batch-preview?batchIds=test&message=Sample%20message');
    
    if (batchPreviewResponse.ok) {
      const batchData = await batchPreviewResponse.json();
      console.log('✅ Batch Preview Result:');
      console.log('   Total Recipients:', batchData.totalRecipients);
      console.log('   Student Count:', batchData.studentCount);
      console.log('   Parent Count:', batchData.parentCount);
      console.log('   Total Cost:', batchData.totalCost);
    } else {
      const errorText = await batchPreviewResponse.text();
      console.log('⚠️ Batch Preview (expected if no batches):', errorText);
    }

    // 6. Test SMS Scheduler Status
    console.log('\n6️⃣ Testing SMS Scheduler Status...');
    const schedulerResponse = await makeRequest('/api/sms/scheduler/status');
    
    if (schedulerResponse.ok) {
      const schedulerData = await schedulerResponse.json();
      console.log('✅ SMS Scheduler Status:');
      console.log('   Is Running:', schedulerData.isRunning);
      console.log('   Is Processing:', schedulerData.isProcessing);
      console.log('   Today is Month End Alert:', schedulerData.todayIsMonthEndAlert);
      console.log('   Today is Monthly Results:', schedulerData.todayIsMonthlyResults);
      console.log('   Config:', schedulerData.config);
    } else {
      console.log('❌ Scheduler Status failed:', await schedulerResponse.text());
    }

    // 7. Test Template Creation
    console.log('\n7️⃣ Testing Template Creation...');
    const newTemplate = {
      name: 'Test Template',
      type: 'notice',
      template: 'Hello {{studentName}}, this is a test message from {{teacherName}}.',
      description: 'A test template for verification',
      isActive: true,
      variables: [
        {
          variableName: 'studentName',
          description: 'Student name',
          isRequired: true,
          defaultValue: 'Student'
        },
        {
          variableName: 'teacherName', 
          description: 'Teacher name',
          isRequired: true,
          defaultValue: 'Golam Sarowar Sir'
        }
      ]
    };

    const createTemplateResponse = await makeRequest('/api/sms/templates', {
      method: 'POST',
      body: JSON.stringify(newTemplate)
    });

    if (createTemplateResponse.ok) {
      const createdTemplate = await createTemplateResponse.json();
      console.log('✅ Template Created:', createdTemplate.name);
      console.log('   Template ID:', createdTemplate.id);
    } else {
      console.log('❌ Template Creation failed:', await createTemplateResponse.text());
    }

    console.log('\n🎉 SMS Feature Testing Complete!\n');

  } catch (error) {
    console.error('💥 Test Error:', error.message);
  }
}

// Run the test
testSMSFeatures().catch(console.error);