import React, { useEffect, useState } from "react";
import Image from "next/image";
import Button from "./Button";
import { processAvatarSelection } from "@/utils/avatarStorage";
import { generatePlaceholderAvatarFile } from "@/utils/avatarGenerator";
import { UserService } from "@/services/userService";
import { uploadAvatarToStorage } from "@/utils/avatarStorage";

export interface AvatarSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (selectedAvatar: string) => void;
  userId?: string;
  isFirstTime?: boolean;
}

type Gender = "male" | "female" | "other";

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isVisible,
  onClose,
  onSave,
  userId,
  isFirstTime = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    sex?: Gender;
  } | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Fetch user data when modal opens
  useEffect(() => {
    if (isVisible && userId) {
      fetchUserData();
    }
  }, [isVisible, userId]);

  // Determine initial step based on user data
  useEffect(() => {
    if (userData) {
      console.log("userData", userData);
      let initialStep = 1;
      
      // If user has gender, skip step 1 (gender selection)
      if (userData.sex) {
        setSelectedGender(userData.sex);
        initialStep = 2;
      }
      
      setCurrentStep(initialStep);
    }
  }, [userData]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      setIsLoadingUserData(true);
      const user = await UserService.getUserById(userId);
      if (user) {
        setUserData({
          sex: user.sex || undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Avatar data - simplified to only gender-based avatars
  const avatarData = {
    male: [
      "/avatars/male/male-1.png",
      "/avatars/male/male-2.png",
      "/avatars/male/male-3.png",
      "/avatars/male/male-4.png",
      "/avatars/male/male-5.png",
      "/avatars/male/male-6.png",
    ],
    female: [
      "/avatars/female/female-1.png",
      "/avatars/female/female-2.png",
      "/avatars/female/female-3.png",
      "/avatars/female/female-4.png",
      "/avatars/female/female-5.png",
      "/avatars/female/female-6.png",
    ],
    other: [
      "/avatars/others/other-1.png",
      "/avatars/others/other-2.png",
      "/avatars/others/other-3.png",
    ],
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSave = async () => {
    if (!selectedAvatar || !userId) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Process avatar selection: download and upload to storage
      const result = await processAvatarSelection(userId, selectedAvatar);
      
      if (!result.success) {
        setError(result.error || 'Failed to process avatar selection');
        return;
      }

      // Update user profile with the new avatar URL and mark as logged in
      await UserService.updateUserAvatarAndMarkLoggedIn(userId, result.url!);
      
      // Call the onSave callback with the storage URL
      onSave(result.url!);
      onClose();
    } catch (error) {
      console.error('Error saving avatar:', error);
      setError('Failed to save avatar selection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setCurrentStep(1);
    setSelectedGender(null);
    setSelectedAvatar(null);
    setError(null);
    setIsProcessing(false);
    setUserData(null);
    setIsLoadingUserData(false);
    onClose();
  };

  const handleSkip = async () => {
    // Generate placeholder avatar and save it
    if (userId) {
      try {
        setIsProcessing(true);
        setError(null);

        // Generate placeholder avatar
        const { file: placeholderFile } = generatePlaceholderAvatarFile(userId);
        
        // Upload placeholder avatar to Supabase Storage
        const uploadResult = await uploadAvatarToStorage(userId, placeholderFile);
        
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to generate placeholder avatar');
          return;
        }

        // Update user profile with placeholder avatar URL and mark as logged in
        await UserService.updateUserAvatarAndMarkLoggedIn(userId, uploadResult.url!);
        
        // Call the onSave callback with the placeholder URL
        onSave(uploadResult.url!);
        onClose();
      } catch (error) {
        console.error('Error generating placeholder avatar:', error);
        setError('Failed to generate placeholder avatar');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Fallback: just close the modal
      handleClose();
    }
  };

  const getCurrentAvatars = () => {
    if (!selectedGender) return [];
    return avatarData[selectedGender];
  };



  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  // Calculate total steps based on user data
  const getTotalSteps = () => {
    if (userData?.sex) return 1; // Only avatar selection
    return 2; // Gender selection + avatar selection
  };

  const getCurrentStepNumber = () => {
    // If user has sex, they're always on step 1 of 1 (avatar selection)
    if (userData?.sex) return 1;
    
    // If user has no sex, they go through 2 steps
    return currentStep;
  };

  // Get the actual step name for display
  const getCurrentStepName = () => {
    if (userData?.sex) return "Avatar Selection";
    return currentStep === 1 ? "Gender Selection" : "Avatar Selection";
  };

  if (!isVisible) return null;

  // Show loading state while fetching user data
  if (isLoadingUserData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-md:px-5 max-md:py-6 max-w-2xl w-full mx-4 transform transition-all duration-300 animate-in zoom-in-95 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-30"></div>
          <div className="relative z-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#702DFF] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
            <p className="text-gray-600">Preparing avatar selection</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8  max-md:px-5 max-md:py-6 max-w-2xl w-full mx-4 transform transition-all duration-300 animate-in zoom-in-95 relative overflow-hidden">
        {/* Purple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-30"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl max-md:text-xl font-bold text-gray-800 mb-2">
              Choose Your Avatar
            </h2>
            <p className="text-gray-600">
              {getCurrentStepName()} - Step {getCurrentStepNumber()} of {getTotalSteps()}
            </p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-[#702DFF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getCurrentStepNumber() / getTotalSteps()) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Gender Selection - Only show if user doesn't have gender */}
          {currentStep === 1 && !userData?.sex && (
            <div className="space-y-6">
              <h3 className="text-xl max-md:text-lg font-semibold text-gray-800 text-center">
                Select Gender
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                    selectedGender === "male"
                      ? "border-[#702DFF] bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedGender("male")}
                >
                  <div className="p-6 max-md:p-3 text-center">
                    <div className="relative w-20 h-20 max-md:w-12 max-md:h-12 mx-auto mb-4 rounded-full flex items-center justify-center">
                      <Image
                        src="/avatars/male.png"
                        alt="Male"
                        layout="fill"
                        className="text-white rounded-full"
                      />
                    </div>
                    <h4 className="text-lg max-md:text-sm font-semibold text-gray-800">Male</h4>
                  </div>
                  {selectedGender === "male" && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#702DFF] rounded-full flex items-center justify-center">
                      <Image
                        src="/icons/checkmark.svg"
                        alt="Selected"
                        width={16}
                        height={16}
                        className="text-white"
                      />
                    </div>
                  )}
                </div>

                <div
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                    selectedGender === "female"
                      ? "border-[#702DFF] bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedGender("female")}
                >
                  <div className="p-6 max-md:p-3 text-center">
                    <div className="relative w-20 h-20 max-md:w-12 max-md:h-12 mx-auto mb-4 
                     rounded-full flex items-center justify-center">
                      <Image
                        src="/avatars/female.png"
                        alt="Female"
                        layout="fill"
                        className="text-white rounded-full"
                      />
                    </div>
                    <h4 className="text-lg max-md:text-sm font-semibold text-gray-800">Female</h4>
                  </div>
                  {selectedGender === "female" && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#702DFF] rounded-full flex items-center justify-center">
                      <Image
                        src="/icons/checkmark.svg"
                        alt="Selected"
                        width={16}
                        height={16}
                        className="text-white"
                      />
                    </div>
                  )}
                </div>

                <div
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                    selectedGender === "other"
                      ? "border-[#702DFF] bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedGender("other")}
                >
                  <div className="p-6 max-md:p-3 text-center">
                    <div className="relative w-20 h-20 max-md:w-12 max-md:h-12 mx-auto mb-4 rounded-full flex items-center justify-center">
                      <Image
                        src="/avatars/others.png"
                        alt="Other"
                        layout="fill"
                        className="text-white rounded-full"
                      />
                    </div>
                    <h4 className="text-lg max-md:text-sm font-semibold text-gray-800">Custom</h4>
                  </div>
                  {selectedGender === "other" && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#702DFF] rounded-full flex items-center justify-center">
                      <Image
                        src="/icons/checkmark.svg"
                        alt="Selected"
                        width={16}
                        height={16}
                        className="text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Avatar Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl max-md:text-lg font-semibold text-gray-800 text-center">
                Choose Your Avatar
              </h3>
              <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                {getCurrentAvatars().map((avatar, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                      selectedAvatar === avatar
                        ? "border-[#702DFF] bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    <div className="p-3 text-center">
                      <div className="relative w-20 h-20 max-md:w-12 max-md:h-12 mx-auto mb-2 rounded-full overflow-hidden">
                        <Image
                          src={avatar}
                          alt={`Avatar ${index + 1}`}
                          layout="fill"
                          className="object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-lg">
                                  ${selectedGender === "male" ? "👨" : selectedGender === "female" ? "👩" : "🧑"}
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">Avatar {index + 1}</p>
                    </div>
                    {selectedAvatar === avatar && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-[#702DFF] rounded-full flex items-center justify-center">
                        <Image
                          src="/icons/checkmark.svg"
                          alt="Selected"
                          width={12}
                          height={12}
                          className="text-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              {/* Only show Skip button for first-time users */}
              {isFirstTime && (
                <Button
                  variant="purpleOutline"
                  onClick={handleSkip}
                  className="!px-6"
                  disabled={isProcessing}
                >
                  Skip
                </Button>
              )}
              {/* Only show Cancel button for non-first-time users */}
              {!isFirstTime && (
                <Button
                  variant="purpleOutline"
                  onClick={handleClose}
                  className="!px-6"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              )}
              
              {currentStep < 2 ? (
                <Button
                  variant="purple"
                  onClick={handleNext}
                  disabled={
                    isProcessing ||
                    (currentStep === 1 && !selectedGender)
                  }
                  className="!px-6"
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="purple"
                  onClick={handleSave}
                  disabled={!selectedAvatar || isProcessing}
                  loading={isProcessing}
                  className="!px-6"
                >
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200 to-transparent rounded-full translate-y-12 -translate-x-12 opacity-30"></div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;