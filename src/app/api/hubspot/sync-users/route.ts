import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { HubSpotService } from '@/services/hubspotService';

export async function POST(request: NextRequest) {
  try {
    // Get all users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { message: 'No users found to sync' },
        { status: 200 }
      );
    }

    console.log(`[HubSpot Sync] Starting sync for ${users.length} users`);

    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Sync each user to HubSpot
    for (const user of users) {
      try {
        const success = await HubSpotService.syncUserToHubSpot(user);
        if (success) {
          results.successful++;
          console.log(`[HubSpot Sync] Successfully synced user: ${user.email}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to sync user: ${user.email}`);
          console.error(`[HubSpot Sync] Failed to sync user: ${user.email}`);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = `Error syncing user ${user.email}: ${error}`;
        results.errors.push(errorMessage);
        console.error(`[HubSpot Sync] ${errorMessage}`);
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[HubSpot Sync] Sync completed. Results:`, results);

    return NextResponse.json({
      message: 'User sync completed',
      results,
    });
  } catch (error) {
    console.error('Error in user sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get sync status by checking HubSpot contacts
    const hubspotContacts = await HubSpotService.getContactsWithReferrals(10);
    
    return NextResponse.json({
      message: 'HubSpot sync status',
      hubspotContactsCount: hubspotContacts.length,
      recentContacts: hubspotContacts.slice(0, 5).map(contact => ({
        email: contact.properties.email,
        referralCount: contact.properties.referral_count,
        lastReferralAt: contact.properties.last_referral_at,
      })),
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
} 