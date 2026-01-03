require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Parse CSV file exported from GoHighLevel
 * Expected columns: Campaign Name, Date Sent, Recipients, Opens, Clicks, Unsubscribes, Bounces, Replies
 */
function parseCSV(filePath) {
  console.log(`Reading CSV file: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  console.log(`Found columns: ${headers.join(', ')}\n`);

  // Parse data rows
  const campaigns = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0 || values.every(v => !v)) {
      continue; // Skip empty lines
    }

    const campaign = {};
    headers.forEach((header, index) => {
      campaign[header] = values[index] || '';
    });

    campaigns.push(campaign);
  }

  console.log(`Parsed ${campaigns.length} campaigns from CSV\n`);
  return campaigns;
}

/**
 * Parse a CSV line handling quoted fields with commas
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Map CSV columns to expected field names
 * This handles different possible column naming from GoHighLevel
 */
function mapCampaignData(csvRow) {
  // Define possible column name variations
  const fieldMap = {
    name: ['Campaign Name', 'Name', 'Campaign', 'Subject', 'Email Subject'],
    sentDate: ['Date Sent', 'Sent Date', 'Send Date', 'Date', 'Sent At', 'Sent Time'],
    recipients: ['Recipients', 'Total Recipients', 'Sent', 'Delivered', 'Total Sent'],
    opens: ['Opens', 'Opened', 'Total Opens', 'Unique Opens'],
    clicks: ['Clicks', 'Clicked', 'Total Clicks', 'Unique Clicks', 'Link Clicks'],
    unsubscribes: ['Unsubscribes', 'Unsubscribed', 'Unsubs', 'Opt Outs'],
    bounces: ['Bounces', 'Bounced', 'Hard Bounces', 'Soft Bounces'],
    replies: ['Replies', 'Replied', 'Responses'],
    openRate: ['Open Rate', 'Open %', 'Opens %'],
    clickRate: ['Click Rate', 'Click %', 'Clicks %', 'CTR']
  };

  const mapped = {};

  // Find and map each field
  for (const [fieldName, possibleColumns] of Object.entries(fieldMap)) {
    for (const colName of possibleColumns) {
      if (csvRow[colName] !== undefined) {
        mapped[fieldName] = csvRow[colName];
        break;
      }
    }
  }

  return mapped;
}

/**
 * Convert string values to appropriate types
 */
function normalizeValue(value, type) {
  if (!value || value === '' || value === 'N/A' || value === '-') {
    return null;
  }

  if (type === 'number') {
    // Remove commas, %, and other formatting
    const cleaned = value.toString().replace(/[,%$]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  if (type === 'date') {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch {
      return null;
    }
  }

  return value.toString().trim();
}

/**
 * Finds the Notion database by name
 */
async function getNotionDatabase() {
  console.log('Finding Notion database...');

  const response = await notion.search({
    query: process.env.NOTION_DATABASE_NAME,
    filter: {
      property: 'object',
      value: 'database'
    }
  });

  if (response.results.length === 0) {
    throw new Error(`Database "${process.env.NOTION_DATABASE_NAME}" not found`);
  }

  const database = response.results[0];
  console.log(`✓ Found database: ${database.id}\n`);

  return database;
}

/**
 * Check if campaign already exists in Notion
 */
async function findExistingCampaign(databaseId, campaignName) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Name',
      title: {
        equals: campaignName
      }
    }
  });

  return response.results.length > 0 ? response.results[0] : null;
}

/**
 * Create or update campaign in Notion
 */
async function syncCampaignToNotion(databaseId, campaign) {
  const mapped = mapCampaignData(campaign);

  const properties = {
    'Name': {
      title: [
        {
          text: {
            content: mapped.name || 'Untitled Campaign'
          }
        }
      ]
    }
  };

  // Add optional text field (Campaign ID might not be in CSV)
  if (campaign['Campaign ID'] || campaign['ID']) {
    properties['Campaign ID'] = {
      rich_text: [
        {
          text: {
            content: campaign['Campaign ID'] || campaign['ID'] || mapped.name
          }
        }
      ]
    };
  } else {
    // Use campaign name as ID if no ID provided
    properties['Campaign ID'] = {
      rich_text: [
        {
          text: {
            content: mapped.name || 'unknown'
          }
        }
      ]
    };
  }

  // Add status
  if (campaign['Status']) {
    properties['Status'] = {
      select: {
        name: campaign['Status']
      }
    };
  }

  // Add date
  const sentDate = normalizeValue(mapped.sentDate, 'date');
  if (sentDate) {
    properties['Sent Date'] = {
      date: {
        start: sentDate
      }
    };
  }

  // Add numeric fields
  const numericFields = {
    'Recipients': mapped.recipients,
    'Opens': mapped.opens,
    'Clicks': mapped.clicks,
    'Unsubscribes': mapped.unsubscribes,
    'Bounces': mapped.bounces,
    'Replies': mapped.replies,
    'Open Rate': mapped.openRate,
    'Click Rate': mapped.clickRate
  };

  for (const [fieldName, value] of Object.entries(numericFields)) {
    const numValue = normalizeValue(value, 'number');
    if (numValue !== null) {
      properties[fieldName] = {
        number: numValue
      };
    }
  }

  // Check if exists
  const existing = await findExistingCampaign(databaseId, mapped.name);

  if (existing) {
    console.log(`  ↻ Updating: ${mapped.name}`);
    await notion.pages.update({
      page_id: existing.id,
      properties
    });
  } else {
    console.log(`  + Creating: ${mapped.name}`);
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties
    });
  }
}

/**
 * Main import function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run import <csv-file-path>');
    console.error('');
    console.error('Example: npm run import exports/campaigns.csv');
    console.error('');
    console.error('To export from GoHighLevel:');
    console.error('1. Go to Marketing → Email Campaigns');
    console.error('2. Click on a campaign');
    console.error('3. Export stats as CSV');
    console.error('4. Save to the exports/ folder');
    process.exit(1);
  }

  const csvPath = args[0];

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('CSV Import → Notion');
  console.log('='.repeat(60));
  console.log();

  try {
    // Parse CSV
    const campaigns = parseCSV(csvPath);

    // Get Notion database
    const database = await getNotionDatabase();

    // Import each campaign
    console.log('Importing campaigns to Notion...\n');

    for (const campaign of campaigns) {
      try {
        await syncCampaignToNotion(database.id, campaign);
      } catch (error) {
        const name = campaign['Campaign Name'] || campaign['Name'] || 'Unknown';
        console.error(`  ✗ Failed to import ${name}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✓ Import completed! Processed ${campaigns.length} campaigns`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n✗ Import failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run import
if (require.main === module) {
  main();
}

module.exports = { parseCSV, syncCampaignToNotion };
