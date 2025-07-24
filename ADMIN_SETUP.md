# Admin Portal Setup Guide

This guide will help you set up the admin portal for the referral system.

## Phase 1 Implementation Complete ✅

The following components have been implemented:

### Database Schema
- `admins` table with role-based access control
- `admin_invitations` table for managing admin invitations
- Row Level Security (RLS) policies for data protection

### Authentication System
- Admin-specific authentication hook (`useAdminAuth`)
- Admin login page at `/admin/login`
- Admin route protection with `AdminRouteGuard`
- Admin service for managing admin operations

### API Routes
- `/api/admin/login` - Admin authentication
- `/api/admin/invite` - Admin invitation management

## Setup Instructions

### 1. Database Setup

Run the admin schema SQL file in your Supabase database:

```sql
-- Run the contents of admin-schema.sql in your Supabase SQL editor
```

### 2. Environment Variables

Ensure you have the following environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Create Initial Admin User

Use the setup script to create your first super admin:

```bash
node scripts/setup-admin.js admin@yourdomain.com your_password
```

### 4. Access the Admin Portal

1. Navigate to `/admin/login`
2. Sign in with your admin credentials
3. You'll be redirected to `/admin/dashboard`

## Admin Roles

The system supports three admin roles:

- **super_admin**: Full access to all admin features, can manage other admins
- **admin**: Standard admin access to dashboard and user management
- **moderator**: Limited access for basic monitoring and support

## Admin Invitation System

Super admins can invite new admins:

1. Use the invitation API endpoint
2. Invitee receives an email with invitation link
3. Invitee sets up their password and account
4. Invitation expires after 7 days

## Security Features

- **Route Protection**: All admin routes are protected by authentication
- **Role-Based Access**: Different permissions based on admin role

- **Session Management**: Secure session handling with automatic logout

## Next Steps

Phase 1 is complete! The next phases will include:

- **Phase 2**: Admin dashboard with metrics and user management
- **Phase 3**: Data export functionality and advanced filtering
- **Phase 4**: Fraud detection and monitoring systems
- **Phase 5**: Email digest and reporting features

## Troubleshooting

### Common Issues

1. **Admin login fails**: Ensure the admin user exists in both auth and admins tables
2. **Route access denied**: Check that the user has the correct admin role
3. **Database errors**: Verify RLS policies are correctly configured

### Support

For issues with the admin portal setup, check:
- Supabase logs for database errors
- Browser console for client-side errors
- Network tab for API request failures

## File Structure

```
src/
├── app/admin/
│   ├── login/page.tsx          # Admin login page
│   ├── dashboard/page.tsx      # Admin dashboard
│   └── layout.tsx              # Admin layout wrapper
├── components/
│   └── AdminRouteGuard.tsx     # Route protection component
├── hooks/
│   └── useAdminAuth.ts         # Admin authentication hook
├── services/
│   └── adminService.ts         # Admin service functions
└── utils/
    └── generateReferralCode.ts # Updated with secure token generation
``` 