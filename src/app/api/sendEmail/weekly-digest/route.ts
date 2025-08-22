import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyDigestEmail } from '@/lib/sendGridService';

export async function POST(request: NextRequest) {
  try {
    const { to, digestData } = await request.json();

    if (!to || !digestData) {
      return NextResponse.json(
        { message: 'Missing required fields: to and digestData' },
        { status: 400 }
      );
    }

    // Send email using SendGrid
    await sendWeeklyDigestEmail({
      to,
      digestData
    });

    console.log('Weekly digest email sent successfully');
    return NextResponse.json({ message: 'Weekly digest email sent successfully' });
  } catch (error) {
    console.error('Weekly digest email sending failed:', error);
    return NextResponse.json(
      { message: 'Failed to send weekly digest email', error },
      { status: 500 }
    );
  }
} 