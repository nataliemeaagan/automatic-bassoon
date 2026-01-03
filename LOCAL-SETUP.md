# Local Setup Guide - Run This First!

Quick setup guide to get everything running on your Mac.

## Prerequisites

You need:
- ✅ Mac computer (you have this!)
- ✅ Node.js installed
- ✅ GoHighLevel API key (you have this!)
- ✅ Notion integration token (you have this!)
- ✅ Notion database created (you have this!)

## Step-by-Step Setup

### 1. Open Terminal

**On Mac:**
- Press `Cmd + Space`
- Type "Terminal"
- Press Enter

### 2. Navigate to Project

```bash
cd ~/path/to/automatic-bassoon
```

**Replace** `~/path/to/automatic-bassoon` with wherever you cloned this repository.

Not sure where it is?
```bash
# If you're already in the folder
pwd
```

### 3. Check Node.js

```bash
node --version
```

If you see a version number (like `v20.11.0`), you're good!

If not, install Node.js:
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### 4. Install Dependencies

```bash
npm install
```

You should see:
```
added 33 packages...
```

### 5. Verify Your .env File

Check that your credentials are in place:

```bash
cat .env
```

You should see:
```env
GHL_API_KEY=eyJhbGci... (your full JWT token)
GHL_API_BASE_URL=https://rest.gohighlevel.com/v1
GHL_LOCATION_ID=g8haL98g... (your location ID)

NOTION_API_KEY=ntn_... (your Notion integration token)
NOTION_DATABASE_NAME=Gladden Email Broadcasts
```

**Already configured!** But verify your Notion API key is correct from Step 2.

### 6. Share Notion Database with Integration

**IMPORTANT:** This is the step most people miss!

1. Open your "Gladden Email Broadcasts" database in Notion
2. Click the **"..."** menu (top right)
3. Scroll down and click **"Add connections"**
4. Select your integration (the one you created when you got the API token)
5. Click **"Confirm"**

You'll see the integration name appear at the top of the database.

### 7. Verify Database Schema

Run the setup checker:

```bash
npm run setup
```

You should see:
```
✓ Found database: Gladden Email Broadcasts

Checking database properties:

✓ "Name" (title)
✓ "Campaign ID" (rich_text)
✓ "Status" (select)
✓ "Sent Date" (date)
✓ "Recipients" (number)
✓ "Opens" (number)
✓ "Clicks" (number)
✓ "Unsubscribes" (number)
✓ "Bounces" (number)
✓ "Replies" (number)
✓ "Open Rate" (number)
✓ "Click Rate" (number)

✓ Database schema is correct!
```

**If you see errors:**
- Missing properties → Add them in Notion
- Wrong types → Change the property type in Notion
- Database not found → Make sure you shared it (Step 6)

### 8. Test API Connections

```bash
npm test
```

This will test both GoHighLevel and Notion APIs.

**Expected results:**

**Notion API:**
```
✓ Notion API connection successful!
Database ID: ...
Database Name: Gladden Email Broadcasts

Existing entries: 0
```

**GoHighLevel API:**

May show limited data or errors - this is expected due to API limitations.

## Choose Your Sync Method

### Option A: API Sync (Try This First)

If the API test showed campaign data:

```bash
npm run sync
```

This will:
1. Fetch campaigns from GoHighLevel
2. Sync to Notion automatically
3. Show progress in terminal

**Pros:**
- Automatic
- Can be scheduled
- No manual work

**Cons:**
- Limited by GoHighLevel API
- May not get all statistics

### Option B: CSV Import (Recommended Workaround)

If API sync doesn't work or is missing data:

1. **Export from GoHighLevel:**
   - Marketing → Email → Campaigns
   - Click a campaign → Export stats
   - Save to `automatic-bassoon/exports/` folder

2. **Import to Notion:**
   ```bash
   npm run import exports/your-file.csv
   ```

**Pros:**
- Complete data
- All statistics available
- Works 100%

**Cons:**
- Manual export needed
- Not automatic (but can be scripted)

**Test with sample data:**
```bash
npm run import exports/sample-campaigns.csv
```

### Option C: Hybrid Approach (Best)

1. Run API sync daily for basic updates
2. Do CSV import weekly for detailed stats
3. Get best of both worlds

## What's Next?

Once everything is working:

### For Daily/Automatic Sync

Set up automation (see **MAC-AUTOMATION.md**):

```bash
# Quick setup with cron
crontab -e

# Add this line (sync every 2 hours):
0 */2 * * * cd /Users/YOUR_USERNAME/path/to/automatic-bassoon && /usr/local/bin/node sync.js >> sync.log 2>&1
```

Replace `YOUR_USERNAME` and path!

### For Weekly CSV Import

1. Export from GoHighLevel every Monday
2. Save to exports/ folder
3. Run: `npm run import exports/latest.csv`
4. Takes 30 seconds!

## Troubleshooting

### "Module not found"
```bash
# Make sure you ran npm install
npm install
```

### "Database not found"
```bash
# Did you share the database with your integration?
# Go to Notion → Database → "..." → Add connections
```

### "GoHighLevel API Error"

This is expected! The API has limitations. Use CSV import instead.

### "command not found: npm"

Install Node.js:
```bash
brew install node
```

### Need to find your project path?

```bash
cd automatic-bassoon
pwd
# Copy this path for cron jobs and automation
```

## Quick Reference

```bash
# Setup and testing
npm install               # Install dependencies
npm run setup            # Verify Notion database
npm test                 # Test API connections

# Syncing
npm run sync             # API sync (if available)
npm run import file.csv  # Import from CSV

# View logs
tail -f sync.log         # Watch sync logs
tail -f import.log       # Watch import logs

# Automation
crontab -e              # Edit cron jobs
crontab -l              # List cron jobs
```

## Getting Help

Stuck? Check these files:

- **CSV-IMPORT-GUIDE.md** - Complete CSV import instructions
- **MAC-AUTOMATION.md** - Automation setup for Mac
- **README.md** - Full documentation
- **QUICKSTART.md** - Original quick start

## Your System Info

Run this to see your setup:

```bash
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Project location: $(pwd)"
echo "Node location: $(which node)"
```

Copy this info if you need help debugging.

## Next Steps Checklist

- [ ] npm install completed
- [ ] .env file has correct keys
- [ ] Notion database shared with integration
- [ ] npm run setup shows all green checkmarks
- [ ] npm test shows Notion connection working
- [ ] Tried API sync OR CSV import
- [ ] Data appears in Notion database
- [ ] Set up automation (optional)

Once all checkboxes are complete, you're done! 🎉

## Support

If something isn't working:

1. Run `npm test` and share the output
2. Run `npm run setup` and share the results
3. Check that all files were created:
   ```bash
   ls -la
   ```

You should see:
- sync.js
- import-csv.js
- test-apis.js
- setup-notion-database.js
- .env
- package.json
- node_modules/
