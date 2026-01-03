# Mac Automation Guide

Complete guide for setting up automatic syncing on macOS.

## Option 1: Cron Jobs (Simple & Free)

### Step 1: Create a Sync Script

Create a shell script to run the sync:

```bash
cd ~/path/to/automatic-bassoon
nano sync-runner.sh
```

Add this content:

```bash
#!/bin/bash
# GoHighLevel to Notion Sync Runner

# Set the project directory
PROJECT_DIR="$HOME/path/to/automatic-bassoon"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Run the sync
/usr/local/bin/node sync.js >> "$PROJECT_DIR/sync.log" 2>&1

# Add timestamp to log
echo "Sync completed at $(date)" >> "$PROJECT_DIR/sync.log"
```

Make it executable:

```bash
chmod +x sync-runner.sh
```

### Step 2: Set Up Cron

Open crontab editor:

```bash
crontab -e
```

Add one of these schedules:

```bash
# Sync every hour at minute 0
0 * * * * ~/path/to/automatic-bassoon/sync-runner.sh

# Sync every day at 9 AM
0 9 * * * ~/path/to/automatic-bassoon/sync-runner.sh

# Sync every 6 hours (9 AM, 3 PM, 9 PM, 3 AM)
0 9,15,21,3 * * * ~/path/to/automatic-bassoon/sync-runner.sh

# Sync Monday-Friday at 9 AM
0 9 * * 1-5 ~/path/to/automatic-bassoon/sync-runner.sh

# Sync every 30 minutes
*/30 * * * * ~/path/to/automatic-bassoon/sync-runner.sh
```

**Important:** Replace `~/path/to/automatic-bassoon` with your actual path!

### Step 3: Test Your Cron Job

```bash
# Run the script manually to test
~/path/to/automatic-bassoon/sync-runner.sh

# Check the log file
tail -f ~/path/to/automatic-bassoon/sync.log

# List your cron jobs
crontab -l
```

### Troubleshooting Cron

If cron doesn't work:

1. **Check Full Disk Access:**
   - System Preferences → Security & Privacy → Privacy
   - Select "Full Disk Access"
   - Add `/usr/sbin/cron`

2. **Use absolute paths:**
   - Node: `/usr/local/bin/node` (or use `which node` to find)
   - Project: Full path like `/Users/yourname/projects/automatic-bassoon`

3. **Check logs:**
   ```bash
   tail -f ~/path/to/automatic-bassoon/sync.log
   ```

## Option 2: Launchd (Native macOS)

More reliable than cron on modern macOS.

### Step 1: Create a Plist File

```bash
nano ~/Library/LaunchAgents/com.gladden.ghl-notion-sync.plist
```

Add this content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gladden.ghl-notion-sync</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/path/to/automatic-bassoon/sync.js</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/path/to/automatic-bassoon</string>

    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/path/to/automatic-bassoon/sync.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/path/to/automatic-bassoon/sync-error.log</string>

    <key>StartInterval</key>
    <integer>3600</integer>

    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

**Replace:**
- `YOUR_USERNAME` with your Mac username
- `/Users/YOUR_USERNAME/path/to/automatic-bassoon` with actual path
- `3600` = sync every hour (in seconds)
  - 1800 = 30 minutes
  - 7200 = 2 hours
  - 86400 = 24 hours

### Step 2: Load the Service

```bash
# Load the service
launchctl load ~/Library/LaunchAgents/com.gladden.ghl-notion-sync.plist

# Start it immediately
launchctl start com.gladden.ghl-notion-sync

# Check if it's running
launchctl list | grep gladden
```

### Step 3: Manage the Service

```bash
# Stop the service
launchctl stop com.gladden.ghl-notion-sync

# Unload (disable)
launchctl unload ~/Library/LaunchAgents/com.gladden.ghl-notion-sync.plist

# Reload after changes
launchctl unload ~/Library/LaunchAgents/com.gladden.ghl-notion-sync.plist
launchctl load ~/Library/LaunchAgents/com.gladden.ghl-notion-sync.plist

# Check logs
tail -f ~/path/to/automatic-bassoon/sync.log
```

## Option 3: Keyboard Maestro (If You Have It)

If you use Keyboard Maestro:

1. Create a new macro
2. Trigger: Time of Day (e.g., every hour)
3. Action: Execute Shell Script
4. Script:
   ```bash
   cd ~/path/to/automatic-bassoon && /usr/local/bin/node sync.js
   ```

## Option 4: Alfred Workflows (If You Have Powerpack)

Create an Alfred workflow to run sync on demand or on schedule.

## For CSV Import Automation

If using CSV import instead of API sync:

### Step 1: Set Up Export Folder Watcher

Install fswatch:

```bash
brew install fswatch
```

### Step 2: Create Watch Script

```bash
nano watch-exports.sh
```

Add:

```bash
#!/bin/bash
PROJECT_DIR="$HOME/path/to/automatic-bassoon"
WATCH_DIR="$PROJECT_DIR/exports"

cd "$PROJECT_DIR" || exit 1

fswatch -0 "$WATCH_DIR"/*.csv | while read -d "" event
do
    echo "New CSV detected: $event"
    /usr/local/bin/node import-csv.js "$event" >> import.log 2>&1
done
```

Make executable:

```bash
chmod +x watch-exports.sh
```

### Step 3: Run in Background

```bash
# Run the watcher in background
nohup ~/path/to/automatic-bassoon/watch-exports.sh &

# Or add to launchd to run at startup
```

## Recommended Setup for You

Based on your needs, here's what I recommend:

### For API Sync (if API works):

**Use Launchd** - runs every 2 hours:
1. Create the plist file (Option 2 above)
2. Set `StartInterval` to `7200` (2 hours)
3. Load with `launchctl load`

### For CSV Import (API workaround):

**Manual workflow:**
1. Export from GoHighLevel weekly
2. Save CSV to `exports/` folder
3. Run: `npm run import exports/your-export.csv`

**OR Semi-automated:**
1. Set up folder watcher (Option 4 above)
2. Just drop CSV files in exports/ folder
3. Auto-imports when detected

## Quick Reference

```bash
# Test your setup
npm run setup          # Verify Notion database
npm test              # Test API connections
npm run sync          # Run API sync once
npm run import file.csv  # Import from CSV

# View logs
tail -f sync.log
tail -f import.log

# Check cron jobs
crontab -l

# Check launchd services
launchctl list | grep gladden
```

## Finding Your Node Path

If you're not sure where Node is installed:

```bash
which node
# Usually: /usr/local/bin/node
# Or: /opt/homebrew/bin/node (Apple Silicon)

# Use this path in your scripts and plist files
```

## Getting Your Project Path

```bash
cd ~/path/to/automatic-bassoon
pwd
# Copy this full path for use in scripts
```

## Need Help?

Common issues:

1. **"node: command not found"**
   - Use full path: `/usr/local/bin/node`

2. **"Permission denied"**
   - Make scripts executable: `chmod +x script.sh`

3. **Cron job not running**
   - Give cron Full Disk Access (see Troubleshooting Cron above)

4. **Launchd not working**
   - Check logs in the paths specified in plist
   - Run `launchctl list | grep gladden` to see status
