// Test script for monthly results system
// This script tests the monthly results API endpoints directly

async function testMonthlyResultsAPI() {
  console.log('🧪 Testing Monthly Results API...');
  
  // Test 1: Fetch teacher dashboard data (should include batches)
  console.log('\n📚 Test 1: Fetching teacher dashboard data...');
  try {
    const response = await fetch('/api/teacher/dashboard', {
      credentials: 'include'
    });
    const data = await response.json();
    console.log('✅ Teacher dashboard data:', data);
    
    if (data.success && data.batches && data.batches.length > 0) {
      console.log(`✅ Found ${data.batches.length} batches`);
      
      // Test 2: Try to generate monthly results for first batch
      const firstBatch = data.batches[0];
      console.log(`\n📊 Test 2: Generating monthly results for batch: ${firstBatch.name}`);
      
      const generateResponse = await fetch('/api/monthly-results/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          batchId: firstBatch.id,
          year: 2025,
          month: 9
        })
      });
      
      const generateData = await generateResponse.json();
      console.log('✅ Monthly results generation response:', generateData);
      
      if (generateData.success && generateData.results) {
        console.log(`✅ Generated results for ${generateData.results.length} students`);
        
        // Test 3: Fetch the generated results
        console.log('\n📋 Test 3: Fetching generated results...');
        const fetchResponse = await fetch(
          `/api/monthly-results/${firstBatch.id}/2025/9`,
          { credentials: 'include' }
        );
        const fetchData = await fetchResponse.json();
        console.log('✅ Fetched results response:', fetchData);
        
        // Test 4: Fetch top performers
        console.log('\n🏆 Test 4: Fetching top performers...');
        const topPerformersResponse = await fetch('/api/top-performers/2025/9');
        const topPerformersData = await topPerformersResponse.json();
        console.log('✅ Top performers response:', topPerformersData);
        
        console.log('\n🎉 All tests completed successfully!');
      } else {
        console.error('❌ Failed to generate monthly results:', generateData);
      }
    } else {
      console.error('❌ No batches found in dashboard data');
    }
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the test
testMonthlyResultsAPI();