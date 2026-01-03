require('dotenv').config();
const axios = require('axios');
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function testGoHighLevelAPI() {
  console.log('\n=== Testing GoHighLevel API ===\n');

  // Try different endpoints to find what works
  const endpoints = [
    `/locations/${process.env.GHL_LOCATION_ID}/campaigns`,
    '/campaigns',
    `/locations/${process.env.GHL_LOCATION_ID}/emails/campaigns`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${process.env.GHL_API_BASE_URL}${endpoint}`);

      const response = await axios.get(
        `${process.env.GHL_API_BASE_URL}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ GoHighLevel API connection successful!');
      console.log(`Endpoint: ${endpoint}`);
      console.log(`Response keys: ${Object.keys(response.data).join(', ')}`);

      if (response.data.campaigns) {
        console.log(`Found ${response.data.campaigns.length} campaigns`);
        if (response.data.campaigns.length > 0) {
          console.log('\nSample campaign data:');
          console.log(JSON.stringify(response.data.campaigns[0], null, 2));
        }
      } else {
        console.log('\nFull response structure:');
        console.log(JSON.stringify(response.data, null, 2));
      }

      return { data: response.data, endpoint };
    } catch (error) {
      if (error.response) {
        console.log(`✗ Status ${error.response.status}: ${error.response.data}`);
      } else {
        console.log(`✗ Error: ${error.message}`);
      }
      continue; // Try next endpoint
    }
  }

  console.error('\n✗ All GoHighLevel endpoints failed');
  return null;
}

async function testNotionAPI() {
  console.log('\n=== Testing Notion API ===\n');

  try {
    // Search for the database by name
    const response = await notion.search({
      query: process.env.NOTION_DATABASE_NAME,
      filter: {
        property: 'object',
        value: 'database'
      }
    });

    if (response.results.length === 0) {
      console.error('✗ Database not found. Make sure "Gladden Email Broadcasts" exists and the integration has access.');
      return null;
    }

    const database = response.results[0];
    console.log('✓ Notion API connection successful!');
    console.log(`Database ID: ${database.id}`);
    console.log(`Database Name: ${database.title[0]?.plain_text || 'Untitled'}`);

    console.log('\nDatabase Properties:');
    for (const [key, value] of Object.entries(database.properties)) {
      console.log(`  - ${key}: ${value.type}`);
    }

    // Get existing pages
    const pages = await notion.databases.query({
      database_id: database.id
    });

    console.log(`\nExisting entries: ${pages.results.length}`);

    return database;
  } catch (error) {
    console.error('✗ Notion API Error:');
    if (error.code === 'object_not_found') {
      console.error('Database not found or integration doesn\'t have access.');
      console.error('Make sure to:');
      console.error('1. Share the database with your integration');
      console.error('2. Check that the database name matches exactly');
    } else {
      console.error(error.message);
    }
    return null;
  }
}

async function main() {
  console.log('Starting API Tests...');
  console.log('====================');

  const ghlData = await testGoHighLevelAPI();
  const notionData = await testNotionAPI();

  console.log('\n=== Test Summary ===');
  console.log(`GoHighLevel API: ${ghlData ? '✓ Working' : '✗ Failed'}`);
  console.log(`Notion API: ${notionData ? '✓ Working' : '✗ Failed'}`);

  if (notionData && !process.env.NOTION_DATABASE_ID) {
    console.log('\n💡 Tip: Add this to your .env file:');
    console.log(`NOTION_DATABASE_ID=${notionData.id}`);
  }
}

main();
