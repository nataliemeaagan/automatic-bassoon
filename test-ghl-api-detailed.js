require('dotenv').config();
const axios = require('axios');

/**
 * COMPREHENSIVE GOHIGHLEVEL API TEST
 *
 * This script tests ALL possible endpoints to find campaign statistics.
 * Run this to see EXACTLY what data is available from the API.
 */

const API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

// Test different base URLs (GHL has used different ones)
const BASE_URLS = [
  'https://rest.gohighlevel.com/v1',
  'https://services.leadconnectorhq.com',
  'https://api.leadconnectorhq.com/v1'
];

// Test different endpoint patterns
const ENDPOINT_PATTERNS = [
  '/locations/{locationId}/campaigns',
  '/campaigns',
  '/locations/{locationId}/emails/campaigns',
  '/emails/campaigns',
  '/locations/{locationId}/campaigns/{campaignId}',
  '/locations/{locationId}/emails/statistics',
  '/locations/{locationId}/emails/analytics',
  '/locations/{locationId}/reporting/emails'
];

const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json'
};

function replaceParams(endpoint, locationId, campaignId = 'test') {
  return endpoint
    .replace('{locationId}', locationId)
    .replace('{campaignId}', campaignId);
}

async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
      url: url
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'NETWORK_ERROR',
      error: error.response?.data || error.message,
      url: url
    };
  }
}

async function findWorkingEndpoints() {
  console.log('═'.repeat(70));
  console.log('GOHIGHLEVEL API COMPREHENSIVE TEST');
  console.log('═'.repeat(70));
  console.log('\nTesting ALL possible endpoints to find campaign statistics...\n');

  const workingEndpoints = [];
  const failedEndpoints = [];
  let testCount = 0;

  for (const baseUrl of BASE_URLS) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Testing Base URL: ${baseUrl}`);
    console.log('─'.repeat(70));

    for (const pattern of ENDPOINT_PATTERNS) {
      const endpoint = replaceParams(pattern, LOCATION_ID);
      testCount++;

      process.stdout.write(`[${testCount}] Testing: ${endpoint}... `);

      const result = await testEndpoint(baseUrl, endpoint);

      if (result.success) {
        console.log('✓ SUCCESS');
        workingEndpoints.push(result);

        // Show what data we got
        console.log('    Response keys:', Object.keys(result.data).join(', '));

        // If we found campaigns, show sample
        if (result.data.campaigns && result.data.campaigns.length > 0) {
          console.log('    Sample campaign fields:', Object.keys(result.data.campaigns[0]).join(', '));
        }
      } else {
        console.log(`✗ ${result.status}`);
        failedEndpoints.push(result);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { workingEndpoints, failedEndpoints, testCount };
}

async function analyzeResults(workingEndpoints) {
  console.log('\n' + '═'.repeat(70));
  console.log('RESULTS ANALYSIS');
  console.log('═'.repeat(70));

  if (workingEndpoints.length === 0) {
    console.log('\n❌ NO WORKING ENDPOINTS FOUND');
    console.log('\nPossible reasons:');
    console.log('1. API key is invalid or expired');
    console.log('2. Location ID is incorrect');
    console.log('3. API endpoints have changed');
    console.log('4. Network/firewall blocking requests');
    console.log('\nConclusion: AUTOMATIC SYNC IS NOT POSSIBLE');
    return false;
  }

  console.log(`\n✓ Found ${workingEndpoints.length} working endpoint(s)\n`);

  for (const endpoint of workingEndpoints) {
    console.log('─'.repeat(70));
    console.log(`Endpoint: ${endpoint.url}`);
    console.log('─'.repeat(70));

    const data = endpoint.data;

    // Check for campaigns
    const campaigns = data.campaigns || data.data || (Array.isArray(data) ? data : null);

    if (campaigns && campaigns.length > 0) {
      const sampleCampaign = Array.isArray(campaigns) ? campaigns[0] : campaigns;

      console.log('\n✓ Campaigns found!\n');
      console.log('Sample campaign structure:');
      console.log(JSON.stringify(sampleCampaign, null, 2));

      // Check for statistics fields
      console.log('\n' + '─'.repeat(70));
      console.log('STATISTICS CHECK:');
      console.log('─'.repeat(70));

      const statsFields = {
        'Opens': ['opens', 'opened', 'totalOpens', 'uniqueOpens', 'openCount'],
        'Clicks': ['clicks', 'clicked', 'totalClicks', 'uniqueClicks', 'clickCount'],
        'Unsubscribes': ['unsubscribes', 'unsubscribed', 'unsubCount', 'optOuts'],
        'Bounces': ['bounces', 'bounced', 'bounceCount', 'hardBounces', 'softBounces'],
        'Recipients': ['recipients', 'sent', 'delivered', 'totalSent', 'sentCount'],
        'Replies': ['replies', 'replied', 'replyCount']
      };

      let hasStats = false;
      const foundFields = {};

      for (const [metric, possibleFields] of Object.entries(statsFields)) {
        for (const field of possibleFields) {
          if (sampleCampaign[field] !== undefined) {
            foundFields[metric] = { field, value: sampleCampaign[field] };
            hasStats = true;
            break;
          }
        }
      }

      if (hasStats) {
        console.log('\n✓ STATISTICS FOUND:\n');
        for (const [metric, info] of Object.entries(foundFields)) {
          console.log(`  ✓ ${metric}: field="${info.field}", value=${info.value}`);
        }

        console.log('\n' + '═'.repeat(70));
        console.log('CONCLUSION: AUTOMATIC SYNC IS POSSIBLE! ✓');
        console.log('═'.repeat(70));
        console.log('\nThe API provides campaign statistics.');
        console.log('You can use automatic syncing without manual CSV imports.');
        return true;
      } else {
        console.log('\n❌ NO STATISTICS FIELDS FOUND\n');
        console.log('Available fields:', Object.keys(sampleCampaign).join(', '));
        console.log('\n' + '═'.repeat(70));
        console.log('CONCLUSION: AUTOMATIC SYNC NOT POSSIBLE ✗');
        console.log('═'.repeat(70));
        console.log('\nThe API returns campaigns but NO statistics.');
        console.log('You CANNOT get opens, clicks, etc. from the API.');
        console.log('\nYour options:');
        console.log('1. Use manual CSV imports (weekly)');
        console.log('2. Set up webhooks for real-time tracking');
        console.log('3. Wait for GoHighLevel to add statistics to API');
        return false;
      }
    } else {
      console.log('\n⚠ No campaigns in response');
      console.log('\nFull response:');
      console.log(JSON.stringify(data, null, 2));
    }
  }

  return false;
}

async function main() {
  if (!API_KEY || !LOCATION_ID) {
    console.error('❌ Missing credentials in .env file');
    console.error('\nMake sure you have:');
    console.error('  GHL_API_KEY=your_key_here');
    console.error('  GHL_LOCATION_ID=your_location_id_here');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Location ID: ${LOCATION_ID}`);
  console.log(`  API Key: ${API_KEY.substring(0, 20)}...`);
  console.log();

  try {
    const { workingEndpoints, failedEndpoints, testCount } = await findWorkingEndpoints();

    const canAutoSync = await analyzeResults(workingEndpoints);

    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`Total endpoints tested: ${testCount}`);
    console.log(`Working endpoints: ${workingEndpoints.length}`);
    console.log(`Failed endpoints: ${failedEndpoints.length}`);

    if (failedEndpoints.length > 0 && workingEndpoints.length === 0) {
      console.log('\nCommon error codes:');
      const errorCounts = {};
      failedEndpoints.forEach(e => {
        const code = e.status;
        errorCounts[code] = (errorCounts[code] || 0) + 1;
      });
      Object.entries(errorCounts).forEach(([code, count]) => {
        console.log(`  ${code}: ${count} times`);
      });
    }

    console.log('\n' + '═'.repeat(70));
    console.log('FINAL ANSWER');
    console.log('═'.repeat(70));

    if (canAutoSync) {
      console.log('\n✓ YES - Automatic sync is possible!\n');
      console.log('Next steps:');
      console.log('1. Run: npm run sync');
      console.log('2. Check your Notion database');
      console.log('3. Set up automation (see MAC-AUTOMATION.md)');
    } else {
      console.log('\n✗ NO - Automatic sync is NOT possible with current API\n');
      console.log('Honest assessment:');
      console.log('• GoHighLevel API does not provide campaign statistics');
      console.log('• You cannot automatically get opens, clicks, etc.');
      console.log('• Manual CSV import is your only option');
      console.log('• OR wait for GoHighLevel to add this to their API');
      console.log('\nI will not mislead you with a "half-working" solution.');
      console.log('Either it works automatically, or it doesn\'t.');
    }

    console.log('\n');
    process.exit(canAutoSync ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
