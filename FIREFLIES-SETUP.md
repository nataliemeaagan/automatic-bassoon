# Fireflies → Notion Integration Setup Guide

Automatically sync your Fireflies meeting transcripts to Notion.

## What This Does

When you run the sync, it will:
- ✅ Fetch all your Fireflies meeting transcripts
- ✅ Create a Notion page for each meeting in your "meeting notes" database
- ✅ Include meeting date, attendees, guest emails, and full transcripts
- ✅ Add links back to Fireflies for easy access
- ✅ Avoid duplicates (updates existing meetings if already synced)

## Quick Start

### 1. Get Your Fireflies API Key

1. Log in to [Fireflies.ai](https://fireflies.ai)
2. Go to **Integrations** section
3. Click on **Fireflies API**
4. Copy your API key (it looks like: `8296a4ca-ad0d-4fc6-a3e0-6283d89cd741`)

### 2. Get Your Notion API Key

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Give it a name (e.g., "Fireflies Sync")
4. Copy the **Internal Integration Token** (starts with `ntn_`)

### 3. Create the Notion Database

Create a new database in Notion with these exact properties:

#### Database Name: `meeting notes`

#### Required Properties:

| Property Name | Type | Description |
|--------------|------|-------------|
| Name | Title | Meeting title (automatically set) |
| Meeting ID | Text | Unique ID from Fireflies |
| Date | Date | When the meeting occurred |
| Created By | Text | Organizer's email |
| Attendees | Text | Comma-separated list of attendees |
| Guest Email | Email | Email of the guest/external participant |
| Fireflies Link | URL | Direct link to Fireflies transcript |

**Page Content:** The meeting transcript will be added to the page body with speaker names and text.

### 4. Share Database with Integration

Important! You must give your integration access to the database:

1. Open your "meeting notes" database in Notion
2. Click the **"..."** menu (top right)
3. Select **"Add connections"**
4. Find and select your integration (e.g., "Fireflies Sync")

### 5. Configure Environment Variables

Create or update your `.env` file with your API keys:

```env
FIREFLIES_API_KEY=your_fireflies_api_key_here
NOTION_API_KEY=your_notion_integration_token_here
FIREFLIES_NOTION_DATABASE_NAME=meeting notes
```

Replace `your_fireflies_api_key_here` and `your_notion_integration_token_here` with your actual keys from steps 1 and 2.

### 6. Install Dependencies

```bash
npm install
```

### 7. Verify Setup

Run the setup verification script:

```bash
npm run setup:fireflies
```

This will:
- Check if your Notion database exists
- Verify all required properties are present
- Confirm the integration has access

## Usage

### Manual Sync

Sync all recent Fireflies meetings to Notion:

```bash
npm run sync:fireflies
```

This will:
1. Fetch the last 50 meetings from Fireflies
2. Create or update entries in your Notion database
3. Include full transcripts in the page body

### Automated Sync (Recommended)

Schedule automatic syncs to keep your meetings up-to-date.

#### Option 1: Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Sync every hour
0 * * * * cd /path/to/automatic-bassoon && npm run sync:fireflies >> fireflies-sync.log 2>&1

# Sync every 4 hours
0 */4 * * * cd /path/to/automatic-bassoon && npm run sync:fireflies >> fireflies-sync.log 2>&1

# Sync daily at 9 AM
0 9 * * * cd /path/to/automatic-bassoon && npm run sync:fireflies >> fireflies-sync.log 2>&1
```

#### Option 2: Launchd (Mac)

See [MAC-AUTOMATION.md](MAC-AUTOMATION.md) for detailed launchd setup.

#### Option 3: Task Scheduler (Windows)

1. Open Task Scheduler
2. Create a new task
3. Set trigger (e.g., daily, hourly)
4. Action: Run `npm run sync:fireflies` in your project directory

## What Gets Synced

For each Fireflies meeting, the following information is synced to Notion:

### Page Properties:
- **Name**: Meeting title from Fireflies
- **Meeting ID**: Unique identifier (used to prevent duplicates)
- **Date**: When the meeting took place
- **Created By**: Email of the meeting organizer
- **Attendees**: Names of all meeting participants
- **Guest Email**: Email address of guest/external participant
- **Fireflies Link**: Direct URL to view the meeting in Fireflies

### Page Content:
The full meeting transcript formatted with speaker names:

```
**John Doe:**
Let's discuss the project timeline...

**Jane Smith:**
I think we should start with the API integration...
```

## Webhooks (Advanced)

For real-time syncing when meetings end, you can set up a webhook:

1. **Set up a webhook endpoint** (requires a server)
2. **Configure Fireflies** to send webhook notifications
3. **Modify the script** to handle individual meeting IDs

Example webhook handler (requires Express.js):

```javascript
const express = require('express');
const { getTranscriptById, syncMeetingToNotion } = require('./fireflies-sync');

const app = express();
app.use(express.json());

app.post('/fireflies-webhook', async (req, res) => {
  const transcriptId = req.body.transcript_id;

  if (!transcriptId) {
    return res.status(400).send('Missing transcript_id');
  }

  try {
    // Get the transcript details
    const transcript = await getTranscriptById(transcriptId);

    // Sync to Notion
    const database = await getNotionDatabase();
    await syncMeetingToNotion(database.id, transcript);

    res.status(200).send('Synced successfully');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Sync failed');
  }
});

app.listen(3000);
```

## Troubleshooting

### "Database not found"

**Problem**: The script can't find your "meeting notes" database.

**Solutions**:
1. Make sure the database is named exactly `meeting notes`
2. Verify you've shared the database with your Notion integration
3. Check that `FIREFLIES_NOTION_DATABASE_NAME` in `.env` matches your database name

### "Unauthorized" or "Invalid API Key"

**Problem**: API authentication is failing.

**Solutions**:
1. **Fireflies**: Verify your API key at [Fireflies Integrations](https://fireflies.ai)
2. **Notion**: Check your integration token at [My Integrations](https://www.notion.so/my-integrations)
3. Make sure there are no extra spaces in your `.env` file

### "Property does not exist"

**Problem**: Your Notion database is missing required properties.

**Solutions**:
1. Run `npm run setup:fireflies` to see which properties are missing
2. Add the missing properties to your database in Notion
3. Make sure property names match exactly (case-sensitive)

### No Meetings Found

**Problem**: The script runs but doesn't find any meetings.

**Solutions**:
1. Check that you have meetings in Fireflies
2. Verify your Fireflies API key has the correct permissions
3. Try logging into Fireflies.ai to confirm meetings are visible there

### Rate Limiting

**Problem**: Getting rate limit errors from Fireflies or Notion.

**Solutions**:
1. Reduce sync frequency in your cron job
2. The script syncs 50 meetings at a time by default
3. Both APIs have rate limits - space out your syncs appropriately

## API Documentation

### Fireflies API
- **Endpoint**: `https://api.fireflies.ai/graphql`
- **Type**: GraphQL
- **Docs**: [docs.fireflies.ai](https://docs.fireflies.ai/)
- **Rate Limits**: Check current limits in API documentation

### Notion API
- **Type**: REST API
- **Docs**: [developers.notion.com](https://developers.notion.com/)
- **Rate Limits**: 3 requests per second

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit `.env` file** to version control
2. **Keep API keys secure** and don't share them
3. **Rotate keys** if accidentally exposed
4. **Use environment-specific keys** for production vs. development
5. **Restrict API key permissions** to only what's needed

## Support & Resources

- **Fireflies API Docs**: https://docs.fireflies.ai/
- **Notion API Docs**: https://developers.notion.com/
- **GraphQL Query Reference**: https://docs.fireflies.ai/graphql-api/query/transcripts
- **Notion Integration Guide**: https://developers.notion.com/docs/getting-started

## File Structure

```
automatic-bassoon/
├── .env                          # Your API credentials (not committed)
├── .gitignore                    # Excludes sensitive files
├── package.json                  # Dependencies & scripts
├── fireflies-sync.js             # Main Fireflies sync script
├── setup-fireflies-database.js   # Database verification tool
├── FIREFLIES-SETUP.md            # This file
└── README.md                     # General project README
```

## Next Steps

Once you have the integration running:

1. **Test the sync** with `npm run sync:fireflies`
2. **Check your Notion database** to see the imported meetings
3. **Set up automation** with cron or Task Scheduler
4. **Monitor the logs** to ensure syncs are working
5. **Customize** the script if you need additional fields

## License

ISC
