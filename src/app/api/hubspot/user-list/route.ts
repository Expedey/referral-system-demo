import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[user-list] Starting API call');
    
    const { email, full_name, ref_code, ref_count, last_referral_time, created_date } = await request.json();
    console.log('[user-list] Received data:', { email, full_name, ref_code, ref_count, last_referral_time, created_date });

    if (!email) {
      console.log('[user-list] Email is missing');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const portalId = process.env.HUBSPOT_PORTAL_ID;
    const formId = process.env.HUBSPOT_FORM_ID;
    
    console.log('[user-list] Environment variables:', { 
      portalId: portalId ? 'SET' : 'MISSING', 
      formId: formId ? 'SET' : 'MISSING'
    });

    if (!portalId || !formId) {
      console.log('[user-list] HubSpot configuration missing:', { portalId, formId });
      return NextResponse.json(
        { error: 'HubSpot configuration missing - Portal ID and Form ID required' },
        { status: 500 }
      );
    }

    // HubSpot forms API endpoint for EU region
    const hubspotUrl = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;
    console.log('[user-list] HubSpot URL:', hubspotUrl);

    const formData = {
      fields: [
        {
          name: 'email',
          value: email
        }
      ],
      context: {
        pageUri: request.headers.get('referer') || process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com',
        pageName: 'BonBon Newsletter Signup - Footer',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      },
    };

    // Add optional fields only if they have values
    if (full_name) {
      formData.fields.push({
        name: 'full_name',
        value: full_name
      });
    }

    if (ref_code) {
      formData.fields.push({
        name: 'ref_code',
        value: ref_code
      });
    }

    if (ref_count !== undefined && ref_count !== null) {
      formData.fields.push({
        name: 'ref_count',
        value: ref_count.toString()
      });
    }

    if (last_referral_time) {
      formData.fields.push({
        name: 'last_referral_time',
        value: last_referral_time
      });
    }

    if (created_date) {
      formData.fields.push({
        name: 'created_date',
        value: created_date
      });
    }

    console.log('[user-list] Sending data to HubSpot:', JSON.stringify(formData, null, 2));

    const response = await fetch(hubspotUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    console.log('[user-list] HubSpot response status:', response.status);
    console.log('[user-list] HubSpot response headers:', Object.fromEntries(response.headers.entries()));

    // Get the raw response text first to see what we're actually getting
    const responseText = await response.text();
    console.log('[user-list] Raw HubSpot response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[user-list] Failed to parse response as JSON:', parseError);
      console.error('[user-list] Response was:', responseText);
      throw new Error(`HubSpot returned invalid JSON: ${responseText.substring(0, 200)}...`);
    }

    console.log('[user-list] HubSpot response data:', responseData);

    if (!response.ok) {
      console.error('[user-list] HubSpot API error:', responseData);
      throw new Error(`Failed to submit to HubSpot: ${response.status} ${response.statusText}`);
    }

    console.log('[user-list] Successfully submitted to HubSpot');
    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter', data: responseData },
      { status: 200 }
    );

  } catch (error) {
    console.error('[user-list] Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 