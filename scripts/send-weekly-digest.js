#!/usr/bin/env node

/**
 * Weekly Email Digest Cron Job
 * 
 * This script can be run as a cron job to automatically send weekly email digests.
 * 
 * Usage:
 * 1. Set up a cron job to run this script every week
 * 2. Configure the team email in environment variables
 * 3. Ensure HubSpot API key is configured
 * 
 * Cron example (runs every Monday at 9 AM):
 * 0 9 * * 1 /usr/bin/node /path/to/scripts/send-weekly-digest.js
 */

// Load environment variables from multiple possible locations
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const https = require('https');
const http = require('http');

// Configuration
const TEAM_EMAIL = process.env.TEAM_EMAIL || 'team@yourcompany.com';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

console.log('🔧 Environment Check:');
console.log('   TEAM_EMAIL:', TEAM_EMAIL);
console.log('   API_BASE_URL:', API_BASE_URL);
console.log('   HUBSPOT_API_KEY:', HUBSPOT_API_KEY ? '***SET***' : '❌ NOT SET');

if (!HUBSPOT_API_KEY) {
  console.error('❌ HUBSPOT_API_KEY environment variable is required');
  console.error('');
  console.error('📝 To fix this:');
  console.error('1. Create a .env.local file in your project root');
  console.error('2. Add your HubSpot API key:');
  console.error('   HUBSPOT_API_KEY=your_hubspot_api_token_here');
  console.error('   TEAM_EMAIL=team@yourcompany.com');
  console.error('');
  console.error('📁 File structure should be:');
  console.error('   /your-project-root/');
  console.error('   ├── .env.local  ← Create this file');
  console.error('   ├── scripts/');
  console.error('   └── src/');
  process.exit(1);
}

if (!TEAM_EMAIL || TEAM_EMAIL === 'team@yourcompany.com') {
  console.error('❌ TEAM_EMAIL environment variable is required');
  console.error('');
  console.error('📝 To fix this:');
  console.error('1. Create a .env.local file in your project root');
  console.error('2. Add your team email:');
  console.error('   TEAM_EMAIL=your-team@company.com');
  console.error('');
  process.exit(1);
}

/**
 * Makes an HTTP request to the API
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Sends the weekly digest
 */
async function sendWeeklyDigest() {
  try {
    console.log('📧 Starting weekly email digest...');
    console.log('📅 Date:', new Date().toISOString());
    console.log('📬 Team Email:', TEAM_EMAIL);
    
    // Call the API to generate and send the digest
    const response = await makeRequest(`${API_BASE_URL}/api/email-digest/weekly`, {
      method: 'POST',
      body: JSON.stringify({
        teamEmail: TEAM_EMAIL,
        sendEmail: true,
      }),
    });

    if (response.statusCode === 200) {
      const result = response.data;
      
      if (result.success) {
        console.log('✅ Weekly digest sent successfully!');
        console.log('📊 Digest Summary:');
        console.log(`   - Top Referrers: ${result.data.topReferrers.length}`);
        console.log(`   - Total Users: ${result.data.totalGrowth.totalUsers}`);
        console.log(`   - Total Referrals: ${result.data.totalGrowth.totalReferrals}`);
        console.log(`   - Flagged Accounts: ${result.data.flaggedAccounts.totalFlagged}`);
        console.log(`   - Tier Breakdown: ${result.data.tierBreakdown.length} tiers`);
        console.log(`   - Email Sent: ${result.emailSent ? 'Yes' : 'No'}`);
        console.log(`   - Generated At: ${result.generatedAt}`);
      } else {
        console.error('❌ Failed to send weekly digest:', result.error);
        process.exit(1);
      }
    } else {
      console.error('❌ API request failed with status:', response.statusCode);
      console.error('Response:', response.data);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error sending weekly digest:', error.message);
    process.exit(1);
  }
}

/**
 * Test the digest generation (without sending email)
 */
async function testDigestGeneration() {
  try {
    console.log('🧪 Testing digest generation...');
    
    const response = await makeRequest(`${API_BASE_URL}/api/email-digest/weekly`, {
      method: 'GET',
    });

    if (response.statusCode === 200) {
      const result = response.data;
      
      if (result.success) {
        console.log('✅ Digest generation test successful!');
        console.log('📊 Test Summary:');
        console.log(`   - Top Referrers: ${result.data.topReferrers.length}`);
        console.log(`   - Total Users: ${result.data.totalGrowth.totalUsers}`);
        console.log(`   - Total Referrals: ${result.data.totalGrowth.totalReferrals}`);
        console.log(`   - Flagged Accounts: ${result.data.flaggedAccounts.totalFlagged}`);
        console.log(`   - Tier Breakdown: ${result.data.tierBreakdown.length} tiers`);
      } else {
        console.error('❌ Digest generation test failed:', result.error);
        process.exit(1);
      }
    } else {
      console.error('❌ API request failed with status:', response.statusCode);
      console.error('Response:', response.data);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error testing digest generation:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testDigestGeneration();
  } else {
    await sendWeeklyDigest();
  }
  
  console.log('🎉 Weekly digest process completed!');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  sendWeeklyDigest,
  testDigestGeneration,
}; 