import { NextRequest, NextResponse } from 'next/server';
import { HubSpotService } from '@/services/hubspotService';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    console.log('[HubSpot API] Syncing user to HubSpot:', userData.email);
    
    // Validate required fields
    if (!userData.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Sync user to HubSpot
    const success = await HubSpotService.syncUserToHubSpot(userData);
    
    if (success) {
      console.log('[HubSpot API] User synced to HubSpot successfully:', userData.email);
      return NextResponse.json({
        success: true,
        message: 'User synced to HubSpot successfully',
        email: userData.email,
      });
    } else {
      console.error('[HubSpot API] Failed to sync user to HubSpot:', userData.email);
      return NextResponse.json(
        { success: false, error: 'Failed to sync user to HubSpot' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[HubSpot API] Error syncing user to HubSpot:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 