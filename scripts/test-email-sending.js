#!/usr/bin/env node

/**
 * Test Email Sending Script
 * 
 * This script tests the email sending functionality without running the full digest.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const https = require('https');
const http = require('http');

// Configuration
const TEAM_EMAIL = process.env.TEAM_EMAIL || 'team@yourcompany.com';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

console.log('🧪 Testing Email Sending Functionality');
console.log('📬 Team Email:', TEAM_EMAIL);
console.log('🔑 HubSpot API Key:', HUBSPOT_API_KEY ? '***SET***' : '❌ NOT SET');

if (!HUBSPOT_API_KEY) {
  console.error('❌ HUBSPOT_API_KEY environment variable is required');
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
 * Test email sending
 */
async function testEmailSending() {
  try {
    console.log('📧 Testing email sending...');
    
    // First, test the digest generation
    const previewResponse = await makeRequest(`${API_BASE_URL}/api/email-digest/weekly`, {
      method: 'GET',
    });

    if (previewResponse.statusCode !== 200) {
      console.error('❌ Failed to generate digest preview');
      console.error('Response:', previewResponse.data);
      process.exit(1);
    }

    console.log('✅ Digest generation test passed');
    
    // Now test email sending
    const emailResponse = await makeRequest(`${API_BASE_URL}/api/email-digest/weekly`, {
      method: 'POST',
      body: JSON.stringify({
        teamEmail: TEAM_EMAIL,
        sendEmail: true,
      }),
    });

    if (emailResponse.statusCode === 200) {
      const result = emailResponse.data;
      
      if (result.success) {
        console.log('✅ Email sending test successful!');
        console.log('📊 Results:');
        console.log(`   - Email Sent: ${result.emailSent ? 'Yes' : 'No'}`);
        console.log(`   - Team Email: ${result.teamEmail}`);
        console.log(`   - Generated At: ${result.generatedAt}`);
        
        if (result.emailSent) {
          console.log('🎉 Email was sent successfully via HubSpot!');
          console.log('📧 Check your inbox for the weekly digest email.');
        } else {
          console.log('⚠️  Email generation succeeded but sending failed');
          console.log('🔍 Check HubSpot API configuration and permissions');
        }
      } else {
        console.error('❌ Email sending test failed:', result.error);
        process.exit(1);
      }
    } else {
      console.error('❌ API request failed with status:', emailResponse.statusCode);
      console.error('Response:', emailResponse.data);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error testing email sending:', error.message);
    process.exit(1);
  }
}

// Run the test
testEmailSending().then(() => {
  console.log('🎉 Email sending test completed!');
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 