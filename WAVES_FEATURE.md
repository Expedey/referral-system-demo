# Waves Feature Implementation

## Overview

The Waves feature allows administrators to create and manage access waves for the waitlist system. Users are automatically assigned to waves based on their waitlist position, and admins can activate/deactivate waves to grant or revoke access to users.

## Database Schema

### New Tables

#### `waves` table
- `id` (uuid, primary key)
- `name` (text, required) - Wave name
- `description` (text, optional) - Wave description
- `start_position` (integer, required) - Start position in waitlist
- `end_position` (integer, required) - End position in waitlist
- `is_active` (boolean, default false) - Whether wave is active
- `activated_at` (timestamptz) - When wave was activated
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

### Updated Tables

#### `users` table (new columns)
- `wave_id` (uuid, foreign key to waves.id) - Reference to assigned wave
- `access_granted` (boolean, default false) - Whether user has access

## Database Functions

### `assign_users_to_waves()`
- Automatically assigns users to waves based on their waitlist position
- Returns number of users assigned

### `activate_wave(wave_uuid)`
- Activates a wave and grants access to all users in that wave
- Updates `is_active` to true and sets `activated_at` timestamp
- Sets `access_granted` to true for all users in the wave

### `deactivate_wave(wave_uuid)`
- Deactivates a wave and revokes access from all users in that wave
- Updates `is_active` to false and clears `activated_at`
- Sets `access_granted` to false for all users in the wave

## API Endpoints

### Waves Management
- `GET /api/admin/waves` - List all waves with statistics
- `POST /api/admin/waves` - Create new wave
- `GET /api/admin/waves/[id]` - Get specific wave
- `PUT /api/admin/waves/[id]` - Update wave
- `DELETE /api/admin/waves/[id]` - Delete wave

### Wave Activation
- `POST /api/admin/waves/[id]/activate` - Activate wave
- `POST /api/admin/waves/[id]/deactivate` - Deactivate wave

## Services

### WaveService
Located at `src/services/waveService.ts`

Key methods:
- `createWave()` - Create new wave
- `getAllWaves()` - Get all waves
- `getAllWavesWithStats()` - Get waves with user statistics
- `activateWave()` - Activate wave
- `deactivateWave()` - Deactivate wave
- `assignUsersToWaves()` - Assign users to waves
- `getUserWave()` - Get wave for specific user
- `userHasAccess()` - Check if user has access

## Admin Interface

### Settings Page
Located at `src/app/admin/settings/page.tsx`

Features:
- Tabbed interface with Waves, General, and Advanced tabs
- Waves tab for managing wave definitions and activation

### Waves Tab
Located at `src/app/admin/settings/components/WavesTab.tsx`

Features:
- Table showing all waves with statistics
- Create new wave modal
- Edit wave modal
- Activate/Deactivate wave buttons
- Delete wave functionality
- Real-time statistics (total users, active users, pending users)

## Components

### WaveStatus
Located at `src/components/WaveStatus.tsx`

Displays:
- Wave name and description
- Access status (Granted/Pending)
- Loading states

## Usage

### Creating Waves
1. Navigate to Admin → Settings → Waves tab
2. Click "Create Wave"
3. Fill in:
   - Name (e.g., "Early Access Wave 1")
   - Description (optional)
   - Start Position (e.g., 1)
   - End Position (e.g., 100)
4. Click "Create"

### Activating Waves
1. In the waves table, click "Activate" for the desired wave
2. All users in that wave will immediately get access granted
3. The wave status will change to "Active"

### Deactivating Waves
1. In the waves table, click "Deactivate" for the active wave
2. All users in that wave will have their access revoked
3. The wave status will change to "Inactive"

## User Assignment

Users are automatically assigned to waves based on their waitlist position when:
- A new wave is created that covers their position
- The `assign_users_to_waves()` function is called

The assignment logic:
1. Gets user's waitlist position from the leaderboard view
2. Finds the wave where `start_position <= user_position <= end_position`
3. Assigns the user to that wave

## Access Control

The `access_granted` field can be used throughout the application to:
- Show/hide features based on access
- Gate premium content
- Control feature availability
- Implement progressive rollouts

## Security

- All wave management requires admin authentication
- RLS policies ensure only admins can manage waves
- User assignment is automatic and secure
- Activation/deactivation is atomic and logged

## Future Enhancements

- Email notifications when waves are activated
- Scheduled wave activation
- Wave templates for common configurations
- Analytics dashboard for wave performance
- Integration with external notification systems 