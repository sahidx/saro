// Test batch deletion functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

async function testBatchDeletion() {
  console.log('🧪 Testing batch deletion functionality...');
  
  try {
    // 1. Get all batches first
    console.log('\n1️⃣ Fetching all batches...');
    const batchesResponse = await fetch(`${BASE_URL}/batches`);
    const batches = await batchesResponse.json();
    console.log('Batches found:', batches.length);
    batches.forEach(batch => {
      console.log(`  - ${batch.id}: ${batch.name}`);
    });
    
    // 2. Try to delete the test batch (should succeed - empty batch)
    const emptyBatchId = 'batch-test-delete';
    console.log(`\n2️⃣ Attempting to delete empty batch: ${emptyBatchId}`);
    const deleteResponse1 = await fetch(`${BASE_URL}/batches/${emptyBatchId}`, {
      method: 'DELETE'
    });
    const deleteResult1 = await deleteResponse1.json();
    console.log('Delete empty batch result:', deleteResult1);
    
    // 3. Try to delete batch with students (should fail)
    const batchWithStudentsId = 'batch-with-students';
    console.log(`\n3️⃣ Attempting to delete batch with students: ${batchWithStudentsId}`);
    const deleteResponse2 = await fetch(`${BASE_URL}/batches/${batchWithStudentsId}`, {
      method: 'DELETE'
    });
    const deleteResult2 = await deleteResponse2.json();
    console.log('Delete batch with students result:', deleteResult2);
    
    // 4. Verify batch list after deletion
    console.log('\n4️⃣ Fetching batches after deletion test...');
    const batchesAfterResponse = await fetch(`${BASE_URL}/batches`);
    const batchesAfter = await batchesAfterResponse.json();
    console.log('Batches remaining:', batchesAfter.length);
    batchesAfter.forEach(batch => {
      console.log(`  - ${batch.id}: ${batch.name}`);
    });
    
    console.log('\n✅ Batch deletion test completed!');
    
  } catch (error) {
    console.error('❌ Error testing batch deletion:', error);
  }
}

testBatchDeletion();