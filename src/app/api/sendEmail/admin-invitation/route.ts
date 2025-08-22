import { NextRequest, NextResponse } from 'next/server';
import { sendAdminInvitationEmail } from '@/lib/sendGridService';

export async function POST(request: NextRequest) {
  try {
    const { to, role, email, password } = await request.json();

    if (!to || !role || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields: to, role, email, and password' },
        { status: 400 }
      );
    }

    // Send email using SendGrid
    await sendAdminInvitationEmail({
      to,
      role,
      email,
      password
    });

    console.log('Admin invitation email sent successfully');
    return NextResponse.json({ message: 'Admin invitation email sent successfully' });
  } catch (error) {
    console.error('Admin invitation email sending failed:', error);
    return NextResponse.json(
      { message: 'Failed to send admin invitation email', error },
      { status: 500 }
    );
  }
} 