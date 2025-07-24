import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/services/adminService';

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the current admin from the request (you'll need to implement this based on your auth strategy)
    // For now, we'll use a placeholder - you'll need to get this from the authenticated session
    const currentAdminId = 'placeholder-admin-id'; // This should come from the authenticated session

    const result = await AdminService.createInvitation(
      email, 
      role || 'admin',
      currentAdminId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        invitation: result.invitation,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Admin invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 