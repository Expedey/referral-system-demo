import { NextRequest, NextResponse } from 'next/server';
import { sendAccountVerifiedEmail } from '@/lib/sendGridService';

export async function POST(request: NextRequest) {
  try {
    const { to, userName, email, referralCode } = await request.json();

    if (!to || !userName || !email || !referralCode) {
      return NextResponse.json(
        { message: 'Missing required fields: to, userName, email, and referralCode' },
        { status: 400 }
      );
    }

    // Send email using SendGrid
    await sendAccountVerifiedEmail({
      to,
      userName,
      email,
      referralCode
    });

    console.log('Account verification email sent successfully');
    return NextResponse.json({ message: 'Account verification email sent successfully' });
  } catch (error) {
    console.error('Account verification email sending failed:', error);
    return NextResponse.json(
      { message: 'Failed to send account verification email', error },
      { status: 500 }
    );
  }
} 