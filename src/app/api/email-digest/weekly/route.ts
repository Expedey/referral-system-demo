import { NextRequest, NextResponse } from 'next/server';
import { EmailDigestService } from '@/services/emailDigestService';
import { HubSpotDirectService } from '@/services/hubspotDirectService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamEmail, sendEmail = true } = body;

    console.log('[Email Digest API] Generating weekly digest for:', teamEmail);

    // Validate required fields
    if (!teamEmail) {
      return NextResponse.json(
        { success: false, error: 'Team email is required' },
        { status: 400 }
      );
    }

    // Generate digest data
    const digestData = await EmailDigestService.generateWeeklyDigest();
    
    console.log('[Email Digest API] Digest data generated:', {
      topReferrers: digestData.topReferrers.length,
      totalGrowth: digestData.totalGrowth,
      flaggedAccounts: digestData.flaggedAccounts,
      tierBreakdown: digestData.tierBreakdown.length,
    });

    // If sendEmail is true, send via HubSpot
    let emailSent = false;
    if (sendEmail) {
      try {
        console.log('[Email Digest API] Sending email to:', teamEmail);
        
        // Send email via HubSpot
        emailSent = await EmailDigestService.sendWeeklyDigest(teamEmail);
        
        if (emailSent) {
          console.log('[Email Digest API] Email sent successfully to:', teamEmail);
        } else {
          console.error('[Email Digest API] Failed to send email to:', teamEmail);
        }
      } catch (emailError) {
        console.error('[Email Digest API] Error sending email:', emailError);
        // Continue with the response even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly digest generated successfully',
      data: digestData,
      emailSent,
      teamEmail,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Email Digest API] Error generating weekly digest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate weekly digest' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Email Digest API] Generating digest preview');

    // Generate digest data without sending email
    const digestData = await EmailDigestService.generateWeeklyDigest();

    return NextResponse.json({
      success: true,
      message: 'Weekly digest preview generated',
      data: digestData,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Email Digest API] Error generating digest preview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate digest preview' },
      { status: 500 }
    );
  }
} 