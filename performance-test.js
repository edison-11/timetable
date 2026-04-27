const axios = require('axios');
const { performance } = require('perf_hooks');

async function performanceTest() {
  console.log('=== Performance Testing ===\n');

  // Test 1: Rate Limiting Test
  console.log('1. Testing Rate Limiting...');
  const startTime = performance.now();
  
  try {
    const requests = [];
    // Make 10 rapid requests to test rate limiting
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.get('http://localhost:5000/api/health')
          .then(res => ({ status: res.status, success: true }))
          .catch(err => ({ status: err.response?.status || 500, success: false, message: err.message }))
      );
    }
    
    const results = await Promise.all(requests);
    const endTime = performance.now();
    
    const successCount = results.filter(r => r.success).length;
    const rateLimitedCount = results.filter(r => r.status === 429).length;
    
    console.log(`✓ Completed ${results.length} requests in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`✓ Successful requests: ${successCount}`);
    console.log(`✓ Rate limited requests: ${rateLimitedCount}`);
    console.log(`✓ Rate limiting is ${rateLimitedCount > 0 ? 'WORKING' : 'NOT TRIGGERED'}\n`);
    
  } catch (error) {
    console.log('✗ Rate limiting test failed:', error.message);
  }

  // Test 2: Concurrent Request Test
  console.log('2. Testing Concurrent Requests...');
  const concurrentStartTime = performance.now();
  
  try {
    const concurrentRequests = [];
    // Make 20 concurrent requests
    for (let i = 0; i < 20; i++) {
      concurrentRequests.push(
        axios.get('http://localhost:5000/api/health')
          .then(res => ({ status: res.status, success: true, time: Date.now() }))
          .catch(err => ({ status: err.response?.status || 500, success: false, message: err.message, time: Date.now() }))
      );
    }
    
    const concurrentResults = await Promise.all(concurrentRequests);
    const concurrentEndTime = performance.now();
    
    const concurrentSuccessCount = concurrentResults.filter(r => r.success).length;
    const avgResponseTime = concurrentResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (concurrentEndTime - r.time), 0) / concurrentSuccessCount;
    
    console.log(`✓ Completed ${concurrentResults.length} concurrent requests in ${(concurrentEndTime - concurrentStartTime).toFixed(2)}ms`);
    console.log(`✓ Successful concurrent requests: ${concurrentSuccessCount}`);
    console.log(`✓ Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`✓ Concurrent handling is ${concurrentSuccessCount >= 15 ? 'GOOD' : 'NEEDS IMPROVEMENT'}\n`);
    
  } catch (error) {
    console.log('✗ Concurrent request test failed:', error.message);
  }

  // Test 3: Load Test
  console.log('3. Testing Load Handling...');
  const loadStartTime = performance.now();
  
  try {
    const loadRequests = [];
    // Make 50 requests over 2 seconds
    for (let i = 0; i < 50; i++) {
      loadRequests.push(
        new Promise(resolve => {
          setTimeout(() => {
            axios.get('http://localhost:5000/api/health')
              .then(res => resolve({ status: res.status, success: true }))
              .catch(err => resolve({ status: err.response?.status || 500, success: false }));
          }, Math.random() * 2000); // Random delay up to 2 seconds
        })
      );
    }
    
    const loadResults = await Promise.all(loadRequests);
    const loadEndTime = performance.now();
    
    const loadSuccessCount = loadResults.filter(r => r.success).length;
    const errorCount = loadResults.filter(r => !r.success).length;
    
    console.log(`✓ Completed ${loadResults.length} load requests in ${(loadEndTime - loadStartTime).toFixed(2)}ms`);
    console.log(`✓ Successful load requests: ${loadSuccessCount}`);
    console.log(`✓ Failed requests: ${errorCount}`);
    console.log(`✓ Success rate: ${((loadSuccessCount / loadResults.length) * 100).toFixed(1)}%`);
    console.log(`✓ Load handling is ${loadSuccessCount >= 45 ? 'EXCELLENT' : loadSuccessCount >= 35 ? 'GOOD' : 'NEEDS IMPROVEMENT'}\n`);
    
  } catch (error) {
    console.log('✗ Load test failed:', error.message);
  }

  // Test 4: Memory and CPU Simulation
  console.log('4. Testing Stress Scenarios...');
  
  try {
    // Test with authentication
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Make authenticated requests under stress
    const stressRequests = [];
    for (let i = 0; i < 15; i++) {
      stressRequests.push(
        axios.get('http://localhost:5000/api/teachers', { headers })
          .then(res => ({ status: res.status, success: true, dataLength: JSON.stringify(res.data).length }))
          .catch(err => ({ status: err.response?.status || 500, success: false }))
      );
    }
    
    const stressResults = await Promise.all(stressRequests);
    const stressSuccessCount = stressResults.filter(r => r.success).length;
    const avgDataSize = stressResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.dataLength, 0) / stressSuccessCount;
    
    console.log(`✓ Completed ${stressResults.length} authenticated stress requests`);
    console.log(`✓ Successful authenticated requests: ${stressSuccessCount}`);
    console.log(`✓ Average response data size: ${avgDataSize.toFixed(0)} bytes`);
    console.log(`✓ Authenticated stress handling is ${stressSuccessCount >= 12 ? 'GOOD' : 'NEEDS IMPROVEMENT'}\n`);
    
  } catch (error) {
    console.log('✗ Stress test failed:', error.message);
  }

  console.log('=== Performance Testing Complete ===');
}

performanceTest().catch(console.error);
