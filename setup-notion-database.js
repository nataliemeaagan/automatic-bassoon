require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const REQUIRED_PROPERTIES = {
  'Name': 'title',
  'Campaign ID': 'rich_text',
  'Status': 'select',
  'Sent Date': 'date',
  'Recipients': 'number',
  'Opens': 'number',
  'Clicks': 'number',
  'Unsubscribes': 'number',
  'Bounces': 'number',
  'Replies': 'number',
  'Open Rate': 'number',
  'Click Rate': 'number'
};

async function checkDatabaseSchema() {
  console.log('Checking Notion database schema...\n');

  try {
    // Search for the database
    const response = await notion.search({
      query: process.env.NOTION_DATABASE_NAME,
      filter: {
        property: 'object',
        value: 'database'
      }
    });

    if (response.results.length === 0) {
      console.log('❌ Database not found!');
      console.log('\nPlease create a database in Notion with the following steps:');
      console.log('1. Open Notion');
      console.log('2. Create a new page');
      console.log('3. Add a Database (Full page)');
      console.log(`4. Name it: "${process.env.NOTION_DATABASE_NAME}"`);
      console.log('5. Share it with your integration');
      console.log('\nThen run this script again.');
      return false;
    }

    const database = response.results[0];
    console.log(`✓ Found database: ${database.title[0]?.plain_text || 'Untitled'}`);
    console.log(`  ID: ${database.id}\n`);

    // Check properties
    console.log('Checking database properties:\n');

    const existingProps = database.properties;
    const missing = [];
    const incorrect = [];

    for (const [propName, expectedType] of Object.entries(REQUIRED_PROPERTIES)) {
      if (!existingProps[propName]) {
        missing.push(propName);
        console.log(`❌ Missing: "${propName}" (${expectedType})`);
      } else if (existingProps[propName].type !== expectedType) {
        incorrect.push({ name: propName, expected: expectedType, actual: existingProps[propName].type });
        console.log(`⚠️  Wrong type: "${propName}" is ${existingProps[propName].type}, should be ${expectedType}`);
      } else {
        console.log(`✓ "${propName}" (${expectedType})`);
      }
    }

    console.log('\n' + '='.repeat(60));

    if (missing.length === 0 && incorrect.length === 0) {
      console.log('✓ Database schema is correct!');
      console.log('\nYou can now run: npm run sync');
      return true;
    } else {
      console.log('❌ Database schema needs updates');

      if (missing.length > 0) {
        console.log('\nMissing properties:');
        missing.forEach(prop => {
          console.log(`  - ${prop} (${REQUIRED_PROPERTIES[prop]})`);
        });
      }

      if (incorrect.length > 0) {
        console.log('\nIncorrect property types:');
        incorrect.forEach(prop => {
          console.log(`  - ${prop.name}: ${prop.actual} → ${prop.expected}`);
        });
      }

      console.log('\nPlease add/update these properties in your Notion database:');
      console.log('1. Open the database in Notion');
      console.log('2. Click the "+" button to add properties');
      console.log('3. Match the names and types exactly as shown above');

      return false;
    }
  } catch (error) {
    console.error('Error checking database:');
    console.error(error.message);
    return false;
  }
}

async function displayInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('Notion Database Setup Instructions');
  console.log('='.repeat(60) + '\n');

  console.log('Required database properties:\n');

  Object.entries(REQUIRED_PROPERTIES).forEach(([name, type]) => {
    console.log(`  ${name.padEnd(20)} → ${type}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  displayInstructions();

  const isValid = await checkDatabaseSchema();

  if (!isValid) {
    process.exit(1);
  }
}

main();
