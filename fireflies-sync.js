require('dotenv').config();
const axios = require('axios');
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Fireflies GraphQL endpoint
const FIREFLIES_API_ENDPOINT = 'https://api.fireflies.ai/graphql';

/**
 * Fetches transcripts from Fireflies using GraphQL
 * @param {number} limit - Number of transcripts to fetch (default: 50)
 * @returns {Array} Array of transcript objects
 */
async function getFirefliesTranscripts(limit = 50) {
  console.log('Fetching transcripts from Fireflies...');

  const query = `
    query Transcripts($limit: Int) {
      transcripts(limit: $limit) {
        id
        title
        date
        duration
        transcript_url
        meeting_link
        meeting_url
        organizer_email
        fireflies_users {
          name
          email
        }
        participants {
          name
          email
          displayName
        }
        meeting_attendees {
          displayName
          email
          phoneNumber
        }
        sentences {
          text
          speaker_name
          start_time
          end_time
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      FIREFLIES_API_ENDPOINT,
      {
        query,
        variables: { limit }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIREFLIES_API_KEY}`
        }
      }
    );

    if (response.data.errors) {
      console.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      throw new Error('Failed to fetch transcripts from Fireflies');
    }

    const transcripts = response.data.data.transcripts || [];
    console.log(`✓ Found ${transcripts.length} transcripts`);
    return transcripts;
  } catch (error) {
    console.error('Error fetching Fireflies transcripts:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message:`, error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * Fetches a single transcript with full details
 * @param {string} transcriptId - The ID of the transcript
 * @returns {Object} Transcript object with full details
 */
async function getTranscriptById(transcriptId) {
  const query = `
    query Transcript($id: String!) {
      transcript(id: $id) {
        id
        title
        date
        duration
        transcript_url
        meeting_link
        meeting_url
        organizer_email
        fireflies_users {
          name
          email
        }
        participants {
          name
          email
          displayName
        }
        meeting_attendees {
          displayName
          email
          phoneNumber
        }
        sentences {
          text
          speaker_name
          start_time
          end_time
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      FIREFLIES_API_ENDPOINT,
      {
        query,
        variables: { id: transcriptId }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIREFLIES_API_KEY}`
        }
      }
    );

    if (response.data.errors) {
      console.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      return null;
    }

    return response.data.data.transcript;
  } catch (error) {
    console.warn(`Could not fetch detailed transcript for ${transcriptId}:`, error.message);
    return null;
  }
}

/**
 * Finds the Notion database by name
 * @returns {Object} Database object
 */
async function getNotionDatabase() {
  console.log('Searching for Notion database...');

  const databaseName = process.env.FIREFLIES_NOTION_DATABASE_NAME || 'meeting notes';

  const response = await notion.search({
    query: databaseName,
    filter: {
      property: 'object',
      value: 'database'
    }
  });

  if (response.results.length === 0) {
    throw new Error(`Database "${databaseName}" not found. Make sure the integration has access to it.`);
  }

  const database = response.results[0];
  console.log(`✓ Found database: ${database.id}`);

  return database;
}

/**
 * Checks if a meeting already exists in Notion
 * @param {string} databaseId - Notion database ID
 * @param {string} meetingId - Fireflies meeting ID
 * @returns {Object|null} Existing page or null
 */
async function findExistingMeeting(databaseId, meetingId) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Meeting ID',
        rich_text: {
          equals: meetingId
        }
      }
    });

    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    // If the property doesn't exist, return null
    console.warn(`Could not query for existing meeting: ${error.message}`);
    return null;
  }
}

/**
 * Extracts attendee information from transcript
 * @param {Object} transcript - Fireflies transcript object
 * @returns {Object} Attendee information
 */
function extractAttendeeInfo(transcript) {
  const attendees = [];
  const emails = [];

  // Get participants from various sources
  const sources = [
    transcript.participants || [],
    transcript.meeting_attendees || [],
    transcript.fireflies_users || []
  ];

  sources.forEach(source => {
    source.forEach(person => {
      const name = person.displayName || person.name || '';
      const email = person.email || '';

      if (name && !attendees.some(a => a.name === name)) {
        attendees.push({ name, email });
        if (email) emails.push(email);
      }
    });
  });

  // Get guest email (first non-organizer email)
  const guestEmail = emails.find(email => email !== transcript.organizer_email) || '';

  return {
    attendees: attendees.map(a => a.name).filter(Boolean),
    emails: emails.filter(Boolean),
    guestEmail,
    organizerEmail: transcript.organizer_email || ''
  };
}

/**
 * Converts Fireflies transcript sentences to formatted text
 * @param {Array} sentences - Array of sentence objects
 * @returns {string} Formatted transcript text
 */
function formatTranscript(sentences) {
  if (!sentences || sentences.length === 0) {
    return 'No transcript available';
  }

  // Group sentences by speaker for better readability
  let formattedText = '';
  let lastSpeaker = '';

  sentences.forEach(sentence => {
    const speaker = sentence.speaker_name || 'Unknown';
    const text = sentence.text || '';

    if (speaker !== lastSpeaker) {
      formattedText += `\n\n**${speaker}:**\n`;
      lastSpeaker = speaker;
    }
    formattedText += `${text} `;
  });

  return formattedText.trim();
}

/**
 * Creates or updates a meeting entry in Notion
 * @param {string} databaseId - Notion database ID
 * @param {Object} transcript - Fireflies transcript object
 */
async function syncMeetingToNotion(databaseId, transcript) {
  const attendeeInfo = extractAttendeeInfo(transcript);
  const transcriptText = formatTranscript(transcript.sentences);
  const meetingUrl = transcript.meeting_link || transcript.meeting_url || transcript.transcript_url || '';

  // Build properties object
  const properties = {
    'Name': {
      title: [
        {
          text: {
            content: transcript.title || 'Untitled Meeting'
          }
        }
      ]
    }
  };

  // Add Meeting ID if available (for duplicate detection)
  if (transcript.id) {
    properties['Meeting ID'] = {
      rich_text: [
        {
          text: {
            content: transcript.id
          }
        }
      ]
    };
  }

  // Add Date
  if (transcript.date) {
    properties['Date'] = {
      date: {
        start: new Date(transcript.date).toISOString().split('T')[0]
      }
    };
  }

  // Add Created By (organizer email)
  if (attendeeInfo.organizerEmail) {
    properties['Created By'] = {
      rich_text: [
        {
          text: {
            content: attendeeInfo.organizerEmail
          }
        }
      ]
    };
  }

  // Add Attendees (as multi-select or rich text)
  if (attendeeInfo.attendees.length > 0) {
    // Try multi-select first, fall back to rich text
    properties['Attendees'] = {
      rich_text: [
        {
          text: {
            content: attendeeInfo.attendees.join(', ')
          }
        }
      ]
    };
  }

  // Add Guest Email
  if (attendeeInfo.guestEmail) {
    properties['Guest Email'] = {
      email: attendeeInfo.guestEmail
    };
  }

  // Add Fireflies Link
  if (meetingUrl) {
    properties['Fireflies Link'] = {
      url: meetingUrl
    };
  }

  // Remove null/undefined properties
  Object.keys(properties).forEach(key => {
    if (properties[key] === null || properties[key] === undefined) {
      delete properties[key];
    }
  });

  // Check if meeting already exists
  const existing = transcript.id ? await findExistingMeeting(databaseId, transcript.id) : null;

  // Prepare page content with transcript
  const children = [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Meeting Transcript'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: transcriptText.substring(0, 2000) // Notion has limits, truncate if needed
            }
          }
        ]
      }
    }
  ];

  if (existing) {
    console.log(`  Updating: ${transcript.title}`);
    await notion.pages.update({
      page_id: existing.id,
      properties
    });

    // Append transcript to existing page
    try {
      await notion.blocks.children.append({
        block_id: existing.id,
        children
      });
    } catch (error) {
      console.warn(`  Could not update page content: ${error.message}`);
    }
  } else {
    console.log(`  Creating: ${transcript.title}`);
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      children
    });
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Fireflies → Notion Meeting Sync');
  console.log('='.repeat(60));
  console.log();

  try {
    // Get Notion database
    const database = await getNotionDatabase();

    // Get transcripts from Fireflies
    const transcripts = await getFirefliesTranscripts(50);

    if (transcripts.length === 0) {
      console.log('No transcripts found to sync.');
      return;
    }

    console.log(`\nSyncing ${transcripts.length} meetings to Notion...\n`);

    // Sync each transcript
    for (const transcript of transcripts) {
      try {
        await syncMeetingToNotion(database.id, transcript);
      } catch (error) {
        console.error(`  ✗ Failed to sync ${transcript.title}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Sync completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n✗ Sync failed:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the sync
if (require.main === module) {
  main();
}

module.exports = {
  main,
  getFirefliesTranscripts,
  syncMeetingToNotion,
  getTranscriptById
};
