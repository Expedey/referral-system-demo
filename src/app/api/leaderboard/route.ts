import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/services/referralService';

export async function GET(request: NextRequest) {
  try {
    // Get limit from query parameters, default to 10
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 100.' },
        { status: 400 }
      );
    }

    // Fetch leaderboard data
    const leaderboardData = await ReferralService.getLeaderboard(limit);

    // Return the data with proper headers
    return NextResponse.json(
      {
        success: true,
        data: leaderboardData,
        count: leaderboardData.length,
        limit: limit,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );

  } catch (error) {
    console.error('[API] Error fetching leaderboard:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch leaderboard data'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
    console.log('request', request);
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  );
} 