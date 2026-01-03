const axios = require('axios');

// ManyChat API credentials
const MANYCHAT_API_KEY = '3869965:7a92d58f78aa78e731be7de5a660b625';
const PAGE_ID = '3869965'; // Extracted from API key

// ManyChat API base URL
const BASE_URL = 'https://api.manychat.com/fb';

// Create axios instance with authentication
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

console.log('🔍 Testing ManyChat API...\n');

async function testEndpoint(name, method, endpoint, data = null) {
  try {
    console.log(`\n📡 Testing: ${name}`);
    console.log(`   Endpoint: ${method} ${endpoint}`);

    let response;
    if (method === 'GET') {
      response = await api.get(endpoint);
    } else if (method === 'POST') {
      response = await api.post(endpoint, data);
    }

    console.log(`   ✅ Success!`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
    if (error.response?.data) {
      console.log(`   Details:`, JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('           MANYCHAT API EXPLORATION TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Get page info
  await testEndpoint('Get Page Info', 'GET', '/page/getInfo');

  // Test 2: Get tags list
  await testEndpoint('Get Tags', 'GET', '/page/getTags');

  // Test 3: Get custom fields
  await testEndpoint('Get Custom Fields', 'GET', '/page/getCustomFields');

  // Test 4: Get flows/automations
  await testEndpoint('Get Flows', 'GET', '/page/getFlows');

  // Test 5: Get bot fields (might include statistics)
  await testEndpoint('Get Bot Fields', 'GET', '/page/getBotFields');

  // Test 6: Get growth tools
  await testEndpoint('Get Growth Tools', 'GET', '/page/getGrowthTools');

  // Test 7: Find subscribers (might help understand what data we can track)
  await testEndpoint('Find Subscriber By System Field', 'POST', '/subscriber/findBySystemField', {
    field_name: 'first_name',
    field_value: 'test'
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                    TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 ANALYSIS:');
  console.log('Based on the successful endpoints above, we can determine:');
  console.log('1. What subscriber data is available');
  console.log('2. What custom fields we can create for tracking');
  console.log('3. What flows/automations exist');
  console.log('4. How to structure our tracking system\n');
}

runTests().catch(error => {
  console.error('Fatal error:', error.message);
});
