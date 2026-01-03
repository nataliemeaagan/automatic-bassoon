# CSV Import Guide

Since GoHighLevel's API has limited support for campaign statistics, this guide shows you how to export data from GoHighLevel and import it into Notion.

## Why Use CSV Import?

**API Limitations:**
- GoHighLevel's current API doesn't provide full access to campaign statistics
- Opens, clicks, unsubscribes data may not be available via API

**CSV Export Benefits:**
- ✅ Access to ALL campaign metrics
- ✅ Complete historical data
- ✅ Exact numbers from GoHighLevel
- ✅ Works immediately without waiting for API updates

## Quick Start (3 Steps)

### 1. Export from GoHighLevel

**Option A: Campaign Statistics**

1. Log into GoHighLevel
2. Go to **Marketing** → **Email**
3. Click on the **Campaigns** tab
4. Click on a campaign to view details
5. Look for an **Export** or **Download** button
6. Save the CSV file to your computer

**Option B: Bulk Email Report**

1. Go to **Marketing** → **Email**
2. Look for **Reports** or **Analytics**
3. Select date range for your campaigns
4. Export as CSV

### 2. Save to Exports Folder

Save your CSV file to:
```
automatic-bassoon/exports/your-campaigns.csv
```

### 3. Run Import

```bash
cd ~/path/to/automatic-bassoon
npm run import exports/your-campaigns.csv
```

That's it! Your data is now in Notion.

## Supported CSV Formats

The import script automatically detects these column variations:

| Data Field | Possible Column Names |
|-----------|----------------------|
| **Campaign Name** | Campaign Name, Name, Campaign, Subject, Email Subject |
| **Date Sent** | Date Sent, Sent Date, Send Date, Date, Sent At |
| **Recipients** | Recipients, Total Recipients, Sent, Delivered, Total Sent |
| **Opens** | Opens, Opened, Total Opens, Unique Opens |
| **Clicks** | Clicks, Clicked, Total Clicks, Unique Clicks, Link Clicks |
| **Unsubscribes** | Unsubscribes, Unsubscribed, Unsubs, Opt Outs |
| **Bounces** | Bounces, Bounced, Hard Bounces, Soft Bounces |
| **Replies** | Replies, Replied, Responses |
| **Open Rate** | Open Rate, Open %, Opens % |
| **Click Rate** | Click Rate, Click %, Clicks %, CTR |

The script is smart enough to handle:
- Different column orders
- Missing columns (will skip)
- Percentage signs (automatically removed)
- Commas in numbers (automatically removed)
- Different date formats

## Example CSV Format

Here's what your CSV might look like:

```csv
Campaign Name,Date Sent,Recipients,Opens,Clicks,Unsubscribes,Bounces,Open Rate,Click Rate
"January Newsletter",2024-01-15,1250,487,92,5,12,38.96%,7.36%
"Product Launch",2024-01-22,1340,623,145,8,15,46.49%,10.82%
```

## Testing with Sample Data

We've included sample data for testing:

```bash
npm run import exports/sample-campaigns.csv
```

This will import 5 sample campaigns to verify everything works.

## Advanced Usage

### Import Multiple Files

```bash
# Import all CSV files in exports folder
for file in exports/*.csv; do
  npm run import "$file"
done
```

### Scheduled Imports

Create a weekly reminder to:
1. Export from GoHighLevel
2. Save to exports/ folder
3. Run import command

Or automate with Mac's launchd (see MAC-AUTOMATION.md).

### Update Existing Campaigns

The script automatically:
- **Creates** new campaigns if they don't exist
- **Updates** existing campaigns if name matches
- This means you can re-import to update stats!

Example workflow:
```bash
# Week 1: Initial import
npm run import exports/jan-campaigns.csv

# Week 2: New campaigns + updates
npm run import exports/week2-campaigns.csv
# → Creates new campaigns
# → Updates existing ones from week 1
```

## Troubleshooting

### "Database not found"

Make sure:
1. Your Notion database is named exactly: "Gladden Email Broadcasts"
2. You've shared the database with your integration
3. Your `.env` file has the correct `NOTION_API_KEY`

### "File not found"

Check the file path:
```bash
# List files in exports folder
ls -la exports/

# Use absolute path if needed
npm run import /Users/yourname/Downloads/campaigns.csv
```

### "No data rows"

Your CSV might be empty or formatted incorrectly:
```bash
# View first few lines of CSV
head -5 exports/your-file.csv

# Check for proper CSV format
cat exports/your-file.csv
```

### Columns Not Matching

If your CSV has different column names:

1. Open `import-csv.js`
2. Find the `fieldMap` object (around line 83)
3. Add your column names to the appropriate arrays

Example:
```javascript
opens: ['Opens', 'Opened', 'Total Opens', 'Unique Opens', 'YOUR_COLUMN_NAME'],
```

### Special Characters in Campaign Names

The script handles:
- Commas in names (uses proper CSV parsing)
- Quotes in names
- Special characters

But if you see issues, try wrapping values in quotes in the CSV.

## GoHighLevel Export Tips

### Where to Find Email Stats

**Method 1: Individual Campaign**
1. Marketing → Email → Campaigns
2. Click campaign name
3. View detailed stats
4. Export button (if available)

**Method 2: Campaign Dashboard**
1. Marketing → Email
2. Look for "Statistics" or "Reports" tab
3. Select campaigns and export

**Method 3: Manual Creation**

If GoHighLevel doesn't have direct CSV export:

1. View campaign stats in GoHighLevel
2. Create CSV manually with this template:

```csv
Campaign Name,Date Sent,Recipients,Opens,Clicks,Unsubscribes,Bounces
"My Campaign",2024-01-15,1000,400,50,2,5
```

3. Copy-paste your stats
4. Save as `.csv` file
5. Import to Notion

### Export Checklist

Make sure your export includes:
- ✅ Campaign names
- ✅ Send dates
- ✅ Recipient counts
- ✅ Opens, Clicks
- ✅ Unsubscribes, Bounces
- ✅ Open rate, Click rate (optional, script calculates if missing)

## Workflow Recommendations

### Weekly Sync (Recommended)

**Every Monday:**
1. Export last week's campaigns from GoHighLevel
2. Save to exports/ folder with date: `exports/2024-01-15.csv`
3. Run: `npm run import exports/2024-01-15.csv`
4. Check Notion to verify

### Monthly Archive

**End of month:**
1. Export all campaigns for the month
2. Import to Notion
3. Archive CSV file for records
4. Notion becomes your campaign analytics hub

### Real-Time Alternative

If you need more frequent updates:

1. Set up GoHighLevel webhook (LCEmailStats)
2. Create webhook receiver (we can build this!)
3. Auto-sync in real-time
4. Ask if you want help setting this up

## Combining with API Sync

You can use both methods:

```bash
# Try API sync first (quick, automated)
npm run sync

# Import CSV for detailed stats (manual, complete)
npm run import exports/detailed-stats.csv
```

API sync gets basic info, CSV import fills in detailed metrics.

## Sample Workflow Script

Create a script to automate your weekly import:

```bash
#!/bin/bash
# weekly-import.sh

# Set project directory
cd ~/path/to/automatic-bassoon

# Find newest CSV in Downloads
NEWEST_CSV=$(ls -t ~/Downloads/ghl-*.csv | head -1)

# Copy to exports with date
DATE=$(date +%Y-%m-%d)
cp "$NEWEST_CSV" "exports/campaigns-$DATE.csv"

# Import
npm run import "exports/campaigns-$DATE.csv"

# Notify
echo "Import complete! Check Notion."
osascript -e 'display notification "GoHighLevel campaigns imported!" with title "Notion Sync"'
```

Make executable and run weekly:
```bash
chmod +x weekly-import.sh
./weekly-import.sh
```

## Getting Help

If you're stuck:

1. **Check sample data:**
   ```bash
   cat exports/sample-campaigns.csv
   ```
   Does your CSV look similar?

2. **Test with sample:**
   ```bash
   npm run import exports/sample-campaigns.csv
   ```
   Does this work? If yes, issue is with your CSV format.

3. **View detailed errors:**
   ```bash
   npm run import your-file.csv 2>&1 | tee import-debug.log
   ```

## Next Steps

Once you have CSV import working:

1. **Set up regular exports** from GoHighLevel
2. **Create a weekly reminder** to run imports
3. **Consider automation** (see MAC-AUTOMATION.md)
4. **Build dashboards** in Notion using this data

Need to automate the export from GoHighLevel? Let me know and we can explore webhook or API solutions!
