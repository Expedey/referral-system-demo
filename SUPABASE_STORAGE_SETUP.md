# Supabase Storage Setup for Avatar Functionality

## 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Check this option
   - **File size limit**: 5MB (or your preferred limit)
   - **Allowed MIME types**: `image/*`

## 2. Configure Row Level Security (RLS)

### Enable RLS on the bucket:
```sql
-- Enable RLS on the avatars bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies:

```sql
-- Policy for users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for public read access to avatars
CREATE POLICY "Public read access to avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

## 3. Database Schema Updates

Run the SQL commands from `avatar-schema-update-v2.sql`:

```sql
-- Update avatar-related columns in users table
-- Remove is_avatar_skipped column
ALTER TABLE users DROP COLUMN IF EXISTS is_avatar_skipped;

-- Add logged_in_before column
ALTER TABLE users ADD COLUMN IF NOT EXISTS logged_in_before BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_logged_in_before ON users(logged_in_before);
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_image_url);

-- Remove old index if it exists
DROP INDEX IF EXISTS idx_users_avatar_skipped;
```

**Note**: If you already have the `loggedInBefore` column, run the migration from `update-logged-in-before.sql`:

```sql
-- Rename loggedInBefore column to logged_in_before (snake_case)
ALTER TABLE users RENAME COLUMN "loggedInBefore" TO logged_in_before;

-- Update index name to match new column name
DROP INDEX IF EXISTS idx_users_logged_in_before;
CREATE INDEX IF NOT EXISTS idx_users_logged_in_before ON users(logged_in_before);
```

## 4. Environment Variables

Ensure your `.env.local` file has the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. File Structure

Your avatar images should be placed in the `public/avatars/` directory:

```
public/
├── avatars/
│   ├── male.png
│   ├── female.png
│   ├── others.png
│   ├── male-young.png
│   ├── male-old.png
│   ├── female-young.png
│   ├── female-old.png
│   ├── other-young.png
│   ├── other-old.png
│   ├── male-young-1.png
│   ├── male-young-2.png
│   ├── ...
│   ├── female-old-1.png
│   ├── female-old-2.png
│   ├── ...
│   ├── other-young-1.png
│   ├── other-young-2.png
│   ├── ...
│   └── other-old-1.png
│   └── other-old-2.png
│   └── ...
```

## 6. Testing the Setup

1. **Sign up a new user** - Should see avatar modal on first login (`logged_in_before = false`)
2. **Select an avatar** - Should upload to Supabase Storage and save URL, mark as logged in
3. **Skip avatar selection** - Should generate random color placeholder avatar, upload to Supabase, and mark as logged in
4. **Change avatar later** - Should work via the "Change Avatar" button
5. **Subsequent logins** - Should not show modal (`logged_in_before = true`)

## 7. Troubleshooting

### Common Issues:

1. **Upload fails**: Check bucket permissions and RLS policies
2. **Images not loading**: Verify public bucket setting and read policies
3. **Modal not showing**: Check `logged_in_before` field in database
4. **Storage URL issues**: Ensure proper bucket configuration

### Debug Commands:

```sql
-- Check user avatar status
SELECT id, email, logged_in_before, avatar_image_url 
FROM users 
WHERE id = 'user_id_here';

-- Check storage objects
SELECT * FROM storage.objects 
WHERE bucket_id = 'avatars' 
AND name LIKE 'user_id_here/%';
```

## 8. Security Notes

- Users can only upload/update/delete their own avatars
- Public read access allows avatar images to be displayed
- File size and type restrictions are enforced
- RLS policies ensure data isolation between users 