import { supabase } from '@/lib/supabase';

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Download image from a URL and convert to File object
 */
export const downloadImageAsFile = async (imageUrl: string, filename: string): Promise<File | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });
    return file;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
};

/**
 * Upload avatar image to Supabase Storage
 */
export const uploadAvatarToStorage = async (
  userId: string, 
  imageFile: File
): Promise<AvatarUploadResult> => {
  try {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${userId}_avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });
    console.log('data', data);
    if (error) {
      console.error('Error uploading to storage:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Error in uploadAvatarToStorage:', error);
    return { success: false, error: 'Failed to upload avatar' };
  }
};

/**
 * Process avatar selection: download and upload to storage
 */
export const processAvatarSelection = async (
  userId: string, 
  avatarPath: string
): Promise<AvatarUploadResult> => {
  try {
    // Create a full URL from the avatar path
    const baseUrl = window.location.origin;
    const fullImageUrl = `${baseUrl}${avatarPath}`;
    
    // Extract filename from path
    const filename = avatarPath.split('/').pop() || 'avatar.png';
    
    // Download the image
    const imageFile = await downloadImageAsFile(fullImageUrl, filename);
    console.log('imageFile', imageFile);
    if (!imageFile) {
      return { success: false, error: 'Failed to download avatar image' };
    }
    
    // Upload to Supabase Storage
    const uploadResult = await uploadAvatarToStorage(userId, imageFile);
    return uploadResult;
  } catch (error) {
    console.error('Error processing avatar selection:', error);
    return { success: false, error: 'Failed to process avatar selection' };
  }
}; 