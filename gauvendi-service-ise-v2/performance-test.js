// Performance Testing Script for Room Product Sellability API
// Run this script to test the optimized API performance

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000'; // Adjust as needed
const TEST_ENDPOINT = '/room-product-sellability/daily-prices';

// Test data matching your example
const testPayload = {
  propertyId: 'GV310786',
  fromDate: '2025-08-25',
  toDate: '2025-09-31',
  totalAdult: 3,
  totalChildren: 0,
  totalPet: 0,
  childAgeList: [],
  rfcRatePlanList: [
    // Add your actual RFC rate plan data here
    {
      id: 'test-rfc-rate-plan-1',
      rfcId: 'room-product-1',
      ratePlanId: 'sales-plan-1',
      name: 'Test Rate Plan',
      totalBaseRate: '100.00',
      isSellable: true
    }
  ],
  distributionChannelList: ['GV_SALES_ENGINE']
};

async function performanceTest() {
  console.log('🚀 Starting Performance Test...\n');
  
  const results = [];
  const testRuns = 5;
  
  for (let i = 1; i <= testRuns; i++) {
    console.log(`📊 Test Run ${i}/${testRuns}`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${API_BASE_URL}${TEST_ENDPOINT}`, testPayload, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        run: i,
        duration,
        status: 'SUCCESS',
        dataSize: response.data?.length || 0
      });
      
      console.log(`   ✅ Duration: ${duration}ms`);
      console.log(`   📦 Results: ${response.data?.length || 0} items`);
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        run: i,
        duration,
        status: 'ERROR',
        error: error.message
      });
      
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);
    }
    
    console.log('');
  }
  
  // Calculate statistics
  const successfulRuns = results.filter(r => r.status === 'SUCCESS');
  const durations = successfulRuns.map(r => r.duration);
  
  if (durations.length > 0) {
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    console.log('📈 Performance Summary:');
    console.log(`   Average Response Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Fastest Response: ${minDuration}ms`);
    console.log(`   Slowest Response: ${maxDuration}ms`);
    console.log(`   Success Rate: ${successfulRuns.length}/${testRuns} (${(successfulRuns.length/testRuns*100).toFixed(1)}%)`);
    
    if (avgDuration <= 1000) {
      console.log('   🎯 TARGET ACHIEVED: Average response time under 1 second!');
    } else {
      console.log(`   ⚠️  TARGET MISSED: Average response time is ${(avgDuration/1000).toFixed(2)}s (target: 1s)`);
    }
  } else {
    console.log('❌ All tests failed. Check your API endpoint and data.');
  }
  
  console.log('\n🔍 Detailed Results:');
  results.forEach(result => {
    console.log(`   Run ${result.run}: ${result.duration}ms - ${result.status}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
}

// Memory usage monitoring
function monitorMemory() {
  const used = process.memoryUsage();
  console.log('\n💾 Memory Usage:');
  for (let key in used) {
    console.log(`   ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
}

// Run the performance test
performanceTest()
  .then(() => {
    monitorMemory();
    console.log('\n✅ Performance test completed!');
  })
  .catch(error => {
    console.error('❌ Performance test failed:', error);
  });
