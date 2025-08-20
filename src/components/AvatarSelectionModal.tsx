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
type AgeGroup = "young" | "old";

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isVisible,
  onClose,
  onSave,
  userId,
  isFirstTime = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar data - you can replace these with actual avatar images
  const avatarData = {
    male: {
      young: [
        "/avatars/male/male-young-1.png",
        "/avatars/male/male-young-2.png",
        "/avatars/male/male-young-3.png",
        "/avatars/male/male-young-4.png",
        "/avatars/male/male-young-5.png",
        "/avatars/male/male-young-6.png",

      ],
      old: [
        "/avatars/male/male-old-1.png",
        "/avatars/male/male-old-2.png",
        "/avatars/male/male-old-3.png",
        "/avatars/male/male-old-4.png",
        "/avatars/male/male-old-5.png",
        "/avatars/male/male-old-6.png",

      ],
    },
    female: {
      young: [
        "/avatars/female/female-young-1.png",
        "/avatars/female/female-young-2.png",
        "/avatars/female/female-young-3.png",
        "/avatars/female/female-young-4.png",
        "/avatars/female/female-young-5.png",
        "/avatars/female/female-young-6.png",

      ],
      old: [
        "/avatars/female/female-old-1.png",
        "/avatars/female/female-old-2.png",
        "/avatars/female/female-old-3.png",
        "/avatars/female/female-old-4.png",
        "/avatars/female/female-old-5.png",
        "/avatars/female/female-old-6.png",

      ],
    },
    other: {
      young: [
        "/avatars/others/other-young-1.png",
        "/avatars/others/other-young-2.png",
        "/avatars/others/other-young-3.png",
        "/avatars/others/other-young-4.png",
        "/avatars/others/other-young-5.png",
        "/avatars/others/other-young-6.png",

      ],
      old: [
        "/avatars/others/other-old-1.png",
        "/avatars/others/other-old-2.png",
        "/avatars/others/other-old-3.png",
        "/avatars/others/other-old-4.png",
        "/avatars/others/other-old-5.png",
        "/avatars/others/other-old-6.png",

      ],
    },
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

//   const handleSkip = async () => {
//     if (currentStep < 3) {
//       setCurrentStep(currentStep + 1);
//     }
    
//     // If this is the final step and user skips, mark as skipped
//     if (currentStep === 3 && isFirstTime && userId) {
//       try {
//         setIsProcessing(true);
//         setError(null);
//         await UserService.skipAvatarSelection(userId);
//         onClose();
//       } catch (error) {
//         console.error('Error skipping avatar selection:', error);
//         setError('Failed to skip avatar selection');
//       } finally {
//         setIsProcessing(false);
//       }
//     }
//   };

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
    setSelectedAgeGroup(null);
    setSelectedAvatar(null);
    setError(null);
    setIsProcessing(false);
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

// const handleSkip = async () => {

    
//     // If this is the final step and user skips, mark as skipped
    
//       try {
//         setIsProcessing(true);
//         setError(null);
//         await UserService.skipAvatarSelection(userId);
//         handleClose()
//       } catch (error) {
//         console.error('Error skipping avatar selection:', error);
//         setError('Failed to skip avatar selection');
//       } finally {
//         setIsProcessing(false);
//       }
    
//   };

  const getCurrentAvatars = () => {
    if (!selectedGender || !selectedAgeGroup) return [];
    return avatarData[selectedGender][selectedAgeGroup];
  };

  const getGenderDisplayName = (gender: Gender) => {
    switch (gender) {
      case "male": return "Male";
      case "female": return "Female";
      case "other": return "Other";
      default: return "";
    }
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

  if (!isVisible) return null;

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
              Step {currentStep} of 3
            </p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-[#702DFF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Gender Selection */}
          {currentStep === 1 && (
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
                    <h4 className="text-lg max-md:text-sm font-semibold text-gray-800">Other</h4>
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

          {/* Step 2: Age Group Selection */}
          {currentStep === 2 && selectedGender && (
            <div className="space-y-6">
              <h3 className="text-xl max-md:text-lg font-semibold text-gray-800 text-center">
                Select Age Group for {getGenderDisplayName(selectedGender)}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                    selectedAgeGroup === "young"
                      ? "border-[#702DFF] bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedAgeGroup("young")}
                >
                  <div className="p-6 max-md:p-3 text-center">
                    <div className="relative w-20 h-20 max-md:w-12 max-md:h-12 mx-auto mb-4 rounded-full flex items-center justify-center">
                      <Image
                        src={`/avatars/${selectedGender}-young.png`}
                        alt={`Young ${getGenderDisplayName(selectedGender)}`}
                        layout="fill"
                        className="text-white rounded-full"
                      />
                    </div>
                    <h4 className="text-lg max-md:text-sm font-semibold text-gray-800">
                      Young {getGenderDisplayName(selectedGender)}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">18-35 years</p>
                  </div>
                  {selectedAgeGroup === "young" && (
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
                    selectedAgeGroup === "old"
                      ? "border-[#702DFF] bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedAgeGroup("old")}
                >
                  <div className="p-6 max-md:p-3 text-center">
                    <div className="relative w-20 h-20 max-md:w-12 max-md:h-12 mx-auto mb-4 rounded-full flex items-center justify-center">
                      <Image
                        src={`/avatars/${selectedGender}-old.png`}
                        alt={`Old ${getGenderDisplayName(selectedGender)}`}
                        layout="fill"
                        className="text-white rounded-full"
                      />
                    </div>
                    <h4 className="text-lg max-md:text-sm font-semibold text-gray-800">
                      Old {getGenderDisplayName(selectedGender)}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">36+ years</p>
                  </div>
                  {selectedAgeGroup === "old" && (
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

          {/* Step 3: Avatar Selection */}
          {currentStep === 3 && (
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
              
              {currentStep < 3 ? (
                <Button
                  variant="purple"
                  onClick={handleNext}
                  disabled={
                    isProcessing ||
                    (currentStep === 1 && !selectedGender) ||
                    (currentStep === 2 && !selectedAgeGroup)
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