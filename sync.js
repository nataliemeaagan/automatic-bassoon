require('dotenv').config();
const axios = require('axios');
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Fetches all email campaigns from GoHighLevel
 */
async function getGoHighLevelCampaigns() {
  console.log('Fetching campaigns from GoHighLevel...');

  try {
    const response = await axios.get(
      `${process.env.GHL_API_BASE_URL}/locations/${process.env.GHL_LOCATION_ID}/campaigns`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✓ Found ${response.data.campaigns?.length || 0} campaigns`);
    return response.data.campaigns || [];
  } catch (error) {
    console.error('Error fetching GoHighLevel campaigns:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data}`);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * Gets campaign statistics from GoHighLevel
 * Note: This may need to be adjusted based on the actual API endpoint available
 */
async function getCampaignStats(campaignId) {
  try {
    // Try to get detailed stats - this endpoint may vary
    const response = await axios.get(
      `${process.env.GHL_API_BASE_URL}/locations/${process.env.GHL_LOCATION_ID}/campaigns/${campaignId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.warn(`Could not fetch detailed stats for campaign ${campaignId}`);
    return null;
  }
}

/**
 * Finds the Notion database by name
 */
async function getNotionDatabase() {
  console.log('Searching for Notion database...');

  const response = await notion.search({
    query: process.env.NOTION_DATABASE_NAME,
    filter: {
      property: 'object',
      value: 'database'
    }
  });

  if (response.results.length === 0) {
    throw new Error(`Database "${process.env.NOTION_DATABASE_NAME}" not found. Make sure the integration has access.`);
  }

  const database = response.results[0];
  console.log(`✓ Found database: ${database.id}`);

  return database;
}

/**
 * Checks if a campaign already exists in Notion
 */
async function findExistingCampaign(databaseId, campaignId) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Campaign ID',
      rich_text: {
        equals: campaignId
      }
    }
  });

  return response.results.length > 0 ? response.results[0] : null;
}

/**
 * Creates or updates a campaign entry in Notion
 */
async function syncCampaignToNotion(databaseId, campaign, stats) {
  const properties = {
    'Name': {
      title: [
        {
          text: {
            content: campaign.name || 'Untitled Campaign'
          }
        }
      ]
    },
    'Campaign ID': {
      rich_text: [
        {
          text: {
            content: campaign.id || ''
          }
        }
      ]
    },
    'Status': {
      select: {
        name: campaign.status || 'Unknown'
      }
    },
    'Sent Date': campaign.scheduledAt ? {
      date: {
        start: new Date(campaign.scheduledAt).toISOString()
      }
    } : null,
    'Recipients': {
      number: stats?.totalRecipients || campaign.totalRecipients || 0
    },
    'Opens': {
      number: stats?.opens || campaign.opens || 0
    },
    'Clicks': {
      number: stats?.clicks || campaign.clicks || 0
    },
    'Unsubscribes': {
      number: stats?.unsubscribes || campaign.unsubscribes || 0
    },
    'Bounces': {
      number: stats?.bounces || campaign.bounces || 0
    },
    'Replies': {
      number: stats?.replies || campaign.replies || 0
    },
    'Open Rate': stats?.openRate ? {
      number: parseFloat(stats.openRate)
    } : null,
    'Click Rate': stats?.clickRate ? {
      number: parseFloat(stats.clickRate)
    } : null
  };

  // Remove null properties
  Object.keys(properties).forEach(key => {
    if (properties[key] === null) {
      delete properties[key];
    }
  });

  // Check if campaign already exists
  const existing = await findExistingCampaign(databaseId, campaign.id);

  if (existing) {
    console.log(`  Updating: ${campaign.name}`);
    await notion.pages.update({
      page_id: existing.id,
      properties
    });
  } else {
    console.log(`  Creating: ${campaign.name}`);
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties
    });
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('GoHighLevel → Notion Campaign Sync');
  console.log('='.repeat(60));
  console.log();

  try {
    // Get Notion database
    const database = await getNotionDatabase();

    // Get campaigns from GoHighLevel
    const campaigns = await getGoHighLevelCampaigns();

    if (campaigns.length === 0) {
      console.log('No campaigns found to sync.');
      return;
    }

    console.log(`\nSyncing ${campaigns.length} campaigns to Notion...\n`);

    // Sync each campaign
    for (const campaign of campaigns) {
      try {
        // Try to get detailed stats if available
        const stats = await getCampaignStats(campaign.id);

        await syncCampaignToNotion(database.id, campaign, stats);
      } catch (error) {
        console.error(`  ✗ Failed to sync ${campaign.name}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Sync completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n✗ Sync failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the sync
if (require.main === module) {
  main();
}

module.exports = { main, getGoHighLevelCampaigns, syncCampaignToNotion };
