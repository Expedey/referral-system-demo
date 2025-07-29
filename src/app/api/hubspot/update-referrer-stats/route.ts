import { NextRequest, NextResponse } from 'next/server';
import { HubSpotDirectService } from '@/services/hubspotDirectService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, referralCount, lastReferralAt } = body;

    console.log('[HubSpot API] Updating referrer stats:', { email, referralCount, lastReferralAt });

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (referralCount === undefined || referralCount === null) {
      return NextResponse.json(
        { success: false, error: 'Referral count is required' },
        { status: 400 }
      );
    }

    // Update referrer's stats in HubSpot
    const success = await HubSpotDirectService.updateReferrerStats(
      email,
      referralCount,
      lastReferralAt || new Date().toISOString()
    );

    if (success) {
      console.log('[HubSpot API] Referrer stats updated successfully for:', email);
      return NextResponse.json({
        success: true,
        message: 'Referrer stats updated successfully',
        email,
        referralCount,
        lastReferralAt: lastReferralAt || new Date().toISOString(),
      });
    } else {
      console.error('[HubSpot API] Failed to update referrer stats for:', email);
      return NextResponse.json(
        { success: false, error: 'Failed to update referrer stats' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[HubSpot API] Error updating referrer stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 