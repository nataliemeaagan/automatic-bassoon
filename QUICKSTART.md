# Quick Start Guide

Get your GoHighLevel newsletter stats syncing to Notion in 5 minutes!

## Step 1: Set Up Your Notion Database

1. **Open Notion** and create a new page
2. **Add a Database** → Select "Table - Full page"
3. **Name it**: "Gladden Email Broadcasts" (exactly as shown)
4. **Add these properties** (click the "+" in the table header):

   | Property Name | Type | How to Add |
   |--------------|------|------------|
   | Name | Title | (Already exists as default) |
   | Campaign ID | Text | Click "+", select "Text" |
   | Status | Select | Click "+", select "Select" |
   | Sent Date | Date | Click "+", select "Date" |
   | Recipients | Number | Click "+", select "Number" |
   | Opens | Number | Click "+", select "Number" |
   | Clicks | Number | Click "+", select "Number" |
   | Unsubscribes | Number | Click "+", select "Number" |
   | Bounces | Number | Click "+", select "Number" |
   | Replies | Number | Click "+", select "Number" |
   | Open Rate | Number | Click "+", select "Number" |
   | Click Rate | Number | Click "+", select "Number" |

## Step 2: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Name: "GoHighLevel Sync"
4. Select your workspace
5. Click **"Submit"**
6. **Copy the "Internal Integration Token"** (starts with `ntn_`)
7. Go back to your "Gladden Email Broadcasts" database
8. Click **"..."** (top right) → **"Add connections"**
9. Select **"GoHighLevel Sync"** (your integration)

## Step 3: Get Your GoHighLevel API Key

You already have this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6Imc4aGFMOThnYkZLZmJOM1FPRWd5IiwiY29tcGFueV9pZCI6IlZreUVKNTFHY01vbWVJN0tuSjQ4IiwidmVyc2lvbiI6MSwiaWF0IjoxNjk4Njg3Mjg0NjAzLCJzdWIiOiJ1c2VyX2lkIn0.Ka5i9haoUNAO1ef2tOS7fYnVkjYHFL8y3l83H_sjppU
```

## Step 4: Update Your .env File

The `.env` file is already created. Just update the `NOTION_API_KEY`:

```env
# GoHighLevel API Configuration
GHL_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6Imc4aGFMOThnYkZLZmJOM1FPRWd5IiwiY29tcGFueV9pZCI6IlZreUVKNTFHY01vbWVJN0tuSjQ4IiwidmVyc2lvbiI6MSwiaWF0IjoxNjk4Njg3Mjg0NjAzLCJzdWIiOiJ1c2VyX2lkIn0.Ka5i9haoUNAO1ef2tOS7fYnVkjYHFL8y3l83H_sjppU
GHL_API_BASE_URL=https://rest.gohighlevel.com/v1
GHL_LOCATION_ID=g8haL98gbFKfbN3QOEgy

# Notion API Configuration
NOTION_API_KEY=YOUR_NOTION_TOKEN_FROM_STEP_2_HERE
NOTION_DATABASE_NAME=Gladden Email Broadcasts
```

Replace `YOUR_NOTION_TOKEN_FROM_STEP_2_HERE` with the token you copied in Step 2.

## Step 5: Install & Test

Open your terminal in this project folder and run:

```bash
# Install dependencies
npm install

# Verify your Notion database is set up correctly
npm run setup

# Test your API connections
npm test

# Run your first sync!
npm run sync
```

## Step 6: Check Notion

Go back to your "Gladden Email Broadcasts" database in Notion. You should see your campaigns with all their stats!

## Troubleshooting

### "Database not found"
- Make sure you named it exactly: "Gladden Email Broadcasts"
- Make sure you connected your integration (Step 2, item 7-9)

### "GoHighLevel API Error"
- Your API key might be expired - generate a new one in GoHighLevel
- Check that you're using the API v2 endpoint

### "Module not found"
- Run `npm install` first

### Campaigns appear but no stats
This is expected! The GoHighLevel API currently has limited support for campaign statistics. You have two options:

**Option A: Manual CSV Import** (Recommended for now)
1. Go to GoHighLevel → Marketing → Email Campaigns
2. Click on a campaign → Export stats as CSV
3. We can create a CSV import script if you'd like

**Option B: Wait for API Updates**
- GoHighLevel is actively developing their API
- Check their documentation for updates: https://marketplace.gohighlevel.com/docs/

## Next Steps

Want to automate this? Set up a scheduled sync:

### On Mac/Linux:
```bash
# Edit crontab
crontab -e

# Add this line (syncs every hour):
0 * * * * cd /path/to/automatic-bassoon && npm run sync >> sync.log 2>&1
```

### On Windows:
Use Task Scheduler to run `npm run sync` on a schedule.

### On Cloud:
Deploy to Heroku, AWS Lambda, or use GitHub Actions for automated syncing.

## Need Help?

Check the full README.md for detailed documentation and advanced options.
