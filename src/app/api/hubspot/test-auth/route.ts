import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[test-auth] Testing HubSpot API key');
    
    const apiKey = process.env.HUBSPOT_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HUBSPOT_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    console.log('[test-auth] API key exists:', apiKey ? 'YES' : 'NO');
    console.log('[test-auth] API key length:', apiKey.length);

    // Test the API key by making a simple request to HubSpot
    const testUrl = 'https://api.hubapi.com/crm/v3/objects/contacts?limit=1';
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[test-auth] Response status:', response.status);
    console.log('[test-auth] Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: 'HubSpot API key is working correctly',
        status: response.status,
        data: {
          total: data.total,
          hasResults: data.results && data.results.length > 0
        }
      });
    } else {
      const errorText = await response.text();
      console.error('[test-auth] API test failed:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'HubSpot API key authentication failed',
        status: response.status,
        details: errorText
      }, { status: 401 });
    }

  } catch (error) {
    console.error('[test-auth] Test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test HubSpot API key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 