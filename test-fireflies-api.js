require('dotenv').config();
const axios = require('axios');
const { Client } = require('@notionhq/client');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test Fireflies API connection
 */
async function testFirefliesAPI() {
  log('\n=== Testing Fireflies API ===', 'cyan');

  const apiKey = process.env.FIREFLIES_API_KEY;

  if (!apiKey) {
    log('✗ FIREFLIES_API_KEY not found in .env', 'red');
    return false;
  }

  log(`✓ API Key found: ${apiKey.substring(0, 8)}...`, 'green');

  // Test GraphQL query
  const query = `
    query {
      transcripts(limit: 1) {
        id
        title
        date
      }
    }
  `;

  try {
    log('\nSending test query to Fireflies...', 'blue');

    const response = await axios.post(
      'https://api.fireflies.ai/graphql',
      {
        query
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (response.data.errors) {
      log('✗ GraphQL query returned errors:', 'red');
      console.log(JSON.stringify(response.data.errors, null, 2));
      return false;
    }

    const transcripts = response.data.data.transcripts || [];
    log(`✓ Successfully connected to Fireflies API`, 'green');
    log(`  Found ${transcripts.length} transcripts in test query`, 'green');

    if (transcripts.length > 0) {
      log(`\n  Sample transcript:`, 'blue');
      log(`    ID: ${transcripts[0].id}`, 'blue');
      log(`    Title: ${transcripts[0].title}`, 'blue');
      log(`    Date: ${transcripts[0].date}`, 'blue');
    }

    return true;
  } catch (error) {
    log('✗ Failed to connect to Fireflies API', 'red');

    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Message: ${JSON.stringify(error.response.data)}`, 'red');

      if (error.response.status === 401) {
        log('\n  → Check your FIREFLIES_API_KEY in .env', 'yellow');
        log('  → Get your API key from: https://fireflies.ai (Integrations → Fireflies API)', 'yellow');
      }
    } else {
      log(`  Error: ${error.message}`, 'red');
    }

    return false;
  }
}

/**
 * Test Notion API connection
 */
async function testNotionAPI() {
  log('\n=== Testing Notion API ===', 'cyan');

  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    log('✗ NOTION_API_KEY not found in .env', 'red');
    return false;
  }

  log(`✓ API Key found: ${apiKey.substring(0, 10)}...`, 'green');

  const notion = new Client({ auth: apiKey });

  try {
    log('\nSearching for "meeting notes" database...', 'blue');

    const response = await notion.search({
      query: 'meeting notes',
      filter: {
        property: 'object',
        value: 'database'
      }
    });

    log(`✓ Successfully connected to Notion API`, 'green');

    if (response.results.length === 0) {
      log(`⚠ Database "meeting notes" not found`, 'yellow');
      log(`\n  Next steps:`, 'yellow');
      log(`  1. Create a database in Notion named "meeting notes"`, 'yellow');
      log(`  2. Share it with your integration`, 'yellow');
      log(`  3. Run: npm run setup:fireflies`, 'yellow');
      return false;
    }

    const database = response.results[0];
    log(`  Found database: ${database.id}`, 'green');
    log(`  Title: ${database.title[0]?.plain_text || 'Untitled'}`, 'green');

    // Check properties
    const properties = database.properties;
    const requiredProps = ['Name', 'Meeting ID', 'Date', 'Created By', 'Attendees', 'Guest Email', 'Fireflies Link'];
    const foundProps = Object.keys(properties);

    log(`\n  Database properties found: ${foundProps.length}`, 'blue');

    const missing = requiredProps.filter(prop => !foundProps.includes(prop));
    if (missing.length > 0) {
      log(`  ⚠ Missing properties: ${missing.join(', ')}`, 'yellow');
      log(`\n  → Run: npm run setup:fireflies (for details)`, 'yellow');
    } else {
      log(`  ✓ All required properties present!`, 'green');
    }

    return true;
  } catch (error) {
    log('✗ Failed to connect to Notion API', 'red');

    if (error.code === 'unauthorized') {
      log(`  Error: Unauthorized`, 'red');
      log(`\n  → Check your NOTION_API_KEY in .env`, 'yellow');
      log(`  → Get your key from: https://www.notion.so/my-integrations`, 'yellow');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }

    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  Fireflies → Notion Integration Test', 'cyan');
  log('='.repeat(60), 'cyan');

  let allPassed = true;

  // Test Fireflies
  const firefliesPassed = await testFirefliesAPI();
  if (!firefliesPassed) allPassed = false;

  // Test Notion
  const notionPassed = await testNotionAPI();
  if (!notionPassed) allPassed = false;

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  if (allPassed) {
    log('✓ All tests passed! Ready to sync.', 'green');
    log('\nRun: npm run sync:fireflies', 'green');
  } else {
    log('✗ Some tests failed. Fix the issues above.', 'red');
  }
  log('='.repeat(60) + '\n', 'cyan');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
main();
