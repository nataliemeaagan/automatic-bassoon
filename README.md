# GoHighLevel → Notion Campaign Sync

Automatically sync your GoHighLevel newsletter campaign statistics to Notion.

## Features

✅ Syncs campaign performance metrics:
- Opens
- Clicks
- Unsubscribes
- Bounces
- Replies
- Open Rate
- Click Rate

✅ Automatic duplicate detection (updates existing campaigns)
✅ Easy to schedule with cron jobs
✅ Secure credential management with `.env`

## Setup Instructions

### 1. Notion Database Setup

Create a Notion database named **"Gladden Email Broadcasts"** with the following properties:

| Property Name | Type | Description |
|--------------|------|-------------|
| Name | Title | Campaign name |
| Campaign ID | Text | Unique campaign identifier |
| Status | Select | Campaign status (Draft, Scheduled, Sent, etc.) |
| Sent Date | Date | When the campaign was sent |
| Recipients | Number | Total number of recipients |
| Opens | Number | Number of opens |
| Clicks | Number | Number of clicks |
| Unsubscribes | Number | Number of unsubscribes |
| Bounces | Number | Number of bounces |
| Replies | Number | Number of replies |
| Open Rate | Number | Open rate percentage |
| Click Rate | Number | Click rate percentage |

### 2. Notion Integration Setup

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name (e.g., "GoHighLevel Sync")
4. Copy the **Internal Integration Token** (starts with `ntn_`)
5. Go to your "Gladden Email Broadcasts" database
6. Click the "..." menu → Add connections → Select your integration

### 3. GoHighLevel API Setup

1. Log into your GoHighLevel account
2. Go to Settings → API Key
3. Create or copy your API key (JWT token)

### 4. Environment Configuration

Create a `.env` file in the project root:

```env
# GoHighLevel API Configuration
GHL_API_KEY=your_gohighlevel_jwt_token_here
GHL_API_BASE_URL=https://rest.gohighlevel.com/v1
GHL_LOCATION_ID=your_location_id_here

# Notion API Configuration
NOTION_API_KEY=your_notion_integration_token_here
NOTION_DATABASE_NAME=Gladden Email Broadcasts
```

**Note:** Your location ID is embedded in the JWT token. You can find it by decoding the JWT at https://jwt.io

### 5. Install Dependencies

```bash
npm install
```

## Usage

### Manual Sync

Run the sync once:

```bash
npm run sync
```

### Test API Connections

Verify your API credentials are working:

```bash
npm test
```

### Automated Sync with Cron

Schedule automatic syncs using cron:

```bash
# Edit crontab
crontab -e

# Add one of these lines:

# Sync every hour
0 * * * * cd /path/to/automatic-bassoon && npm run sync >> sync.log 2>&1

# Sync every day at 9 AM
0 9 * * * cd /path/to/automatic-bassoon && npm run sync >> sync.log 2>&1

# Sync every 30 minutes
*/30 * * * * cd /path/to/automatic-bassoon && npm run sync >> sync.log 2>&1
```

### Deploy to Cloud (Optional)

You can deploy this to run automatically:

**Option 1: GitHub Actions**
- Push to GitHub
- Set up GitHub Actions workflow to run on schedule
- Add API keys as GitHub Secrets

**Option 2: Heroku**
- Deploy to Heroku
- Add Heroku Scheduler add-on
- Set environment variables in Heroku dashboard

**Option 3: AWS Lambda**
- Package as Lambda function
- Trigger with EventBridge (CloudWatch Events)
- Store credentials in AWS Secrets Manager

## Troubleshooting

### "Database not found"
- Make sure you've shared the database with your Notion integration
- Verify the database name matches exactly: "Gladden Email Broadcasts"

### "GoHighLevel API Error 403"
- Verify your API key is valid and not expired
- Check that the location ID is correct
- Ensure your API key has permission to access campaign data

### "API rate limits"
- GoHighLevel and Notion both have rate limits
- The script includes basic error handling
- For large numbers of campaigns, add delays between requests

### Campaigns not updating
- Check that the "Campaign ID" property exists in Notion
- Verify the property type is "Text" not "Title"
- Review the sync logs for specific errors

## API Limitations

**Important:** As of January 2026, GoHighLevel's API may have limited support for detailed campaign statistics. The sync script will:

1. First attempt to fetch detailed stats via API
2. Fall back to basic campaign data if stats aren't available
3. You may need to manually export detailed stats from GoHighLevel UI

If you find that certain metrics aren't syncing, this is likely due to API endpoint limitations. Check the GoHighLevel API documentation for updates.

## File Structure

```
automatic-bassoon/
├── .env                  # Your API credentials (not committed)
├── .gitignore           # Excludes sensitive files
├── package.json         # Node.js dependencies
├── sync.js              # Main sync script
├── test-apis.js         # API connection tester
└── README.md            # This file
```

## Security Notes

⚠️ **Never commit your `.env` file to version control**
⚠️ **Keep your API keys secure**
⚠️ **Rotate keys if accidentally exposed**

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GoHighLevel API docs: https://marketplace.gohighlevel.com/docs/
3. Review Notion API docs: https://developers.notion.com/

## License

ISC
