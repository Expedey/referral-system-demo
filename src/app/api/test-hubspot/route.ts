import { NextResponse } from 'next/server';
import { HubSpotService } from '@/services/hubspotService';

export async function GET() {
  try {
    // Test 1: Check if environment variable is set
    const hasApiKey = !!process.env.HUBSPOT_API_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json({
        error: 'HUBSPOT_API_KEY environment variable is not set',
        hasApiKey: false,
        message: 'Please add HUBSPOT_API_KEY to your environment variables'
      }, { status: 500 });
    }

    // Test 2: Try to create a test contact
    const testContact = await HubSpotService.createOrUpdateContact({
      email: `test-${Date.now()}@example.com`,
      username: 'testuser',
      referralCode: 'TEST123',
    });

    if (testContact) {
      return NextResponse.json({
        success: true,
        hasApiKey: true,
        message: 'HubSpot integration is working!',
        testContactId: testContact.id,
        testContactEmail: testContact.properties.email
      });
    } else {
      return NextResponse.json({
        error: 'Failed to create test contact',
        hasApiKey: true,
        message: 'API key is set but contact creation failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('HubSpot test error:', error);
    return NextResponse.json({
      error: 'HubSpot test failed',
      hasApiKey: !!process.env.HUBSPOT_API_KEY,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 