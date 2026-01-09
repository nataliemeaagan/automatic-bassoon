require('dotenv').config();
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Setup script to verify or create the Notion database for Fireflies meetings
 * This script will check if the database exists and verify its structure
 */
async function setupDatabase() {
  console.log('='.repeat(60));
  console.log('Fireflies → Notion Database Setup');
  console.log('='.repeat(60));
  console.log();

  const databaseName = process.env.FIREFLIES_NOTION_DATABASE_NAME || 'meeting notes';

  try {
    // Search for the database
    console.log(`Searching for database: "${databaseName}"...`);
    const response = await notion.search({
      query: databaseName,
      filter: {
        property: 'object',
        value: 'database'
      }
    });

    if (response.results.length === 0) {
      console.log('\n❌ Database not found!');
      console.log('\nPlease create a Notion database with the following setup:');
      console.log('\n1. Create a new database in Notion named "meeting notes"');
      console.log('2. Add the following properties:\n');

      console.log('   Required Properties:');
      console.log('   -------------------');
      console.log('   • Name (Title) - Meeting title');
      console.log('   • Meeting ID (Text) - Unique identifier from Fireflies');
      console.log('   • Date (Date) - Meeting date');
      console.log('   • Created By (Text) - Organizer email');
      console.log('   • Attendees (Text) - Meeting attendees');
      console.log('   • Guest Email (Email) - Guest email address');
      console.log('   • Fireflies Link (URL) - Link to Fireflies meeting');
      console.log();

      console.log('3. Share the database with your Notion integration:');
      console.log('   • Open the database');
      console.log('   • Click "..." menu → "Add connections"');
      console.log('   • Select your Notion integration');
      console.log();

      process.exit(1);
    }

    const database = response.results[0];
    console.log('✓ Database found!');
    console.log(`  Database ID: ${database.id}`);
    console.log(`  Title: ${database.title[0]?.plain_text || 'Untitled'}`);
    console.log();

    // Check database properties
    console.log('Checking database schema...');
    const properties = database.properties;

    const requiredProperties = {
      'Name': 'title',
      'Meeting ID': 'rich_text',
      'Date': 'date',
      'Created By': 'rich_text',
      'Attendees': 'rich_text',
      'Guest Email': 'email',
      'Fireflies Link': 'url'
    };

    const missingProperties = [];
    const existingProperties = [];

    Object.entries(requiredProperties).forEach(([propName, propType]) => {
      const prop = properties[propName];
      if (!prop) {
        missingProperties.push({ name: propName, type: propType });
      } else {
        existingProperties.push({
          name: propName,
          type: prop.type,
          expected: propType
        });
      }
    });

    console.log('\nExisting properties:');
    existingProperties.forEach(prop => {
      const match = prop.type === prop.expected ? '✓' : '⚠';
      console.log(`  ${match} ${prop.name} (${prop.type}${prop.type !== prop.expected ? `, expected: ${prop.expected}` : ''})`);
    });

    if (missingProperties.length > 0) {
      console.log('\n⚠ Missing properties:');
      missingProperties.forEach(prop => {
        console.log(`  • ${prop.name} (${prop.type})`);
      });
      console.log('\nPlease add these properties to your database in Notion.');
    } else {
      console.log('\n✓ All required properties are present!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Setup verification complete!');
    console.log('='.repeat(60));
    console.log('\nYou can now run: npm run sync:fireflies');
    console.log();

  } catch (error) {
    console.error('\n✗ Setup failed:');
    console.error(error.message);

    if (error.code === 'unauthorized') {
      console.log('\nMake sure your NOTION_API_KEY in .env is correct.');
      console.log('Get it from: https://www.notion.so/my-integrations');
    }

    process.exit(1);
  }
}

// Run setup
setupDatabase();
