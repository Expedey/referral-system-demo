import React, { useState } from "react";
import AvatarSelectionModal from "./AvatarSelectionModal";
import Button from "./Button";

const AvatarSelectionDemo: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSaveAvatar = (avatar: string) => {
    setSelectedAvatar(avatar);
    console.log("Selected avatar:", avatar);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Avatar Selection Demo
          </h1>
          <p className="text-gray-600">
            Click the button below to open the avatar selection modal
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <Button
            variant="purple"
            onClick={handleOpenModal}
            className="w-full"
          >
            Open Avatar Selection
          </Button>

          {selectedAvatar && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Selected Avatar:
              </h3>
              <p className="text-sm text-gray-600 break-all">
                {selectedAvatar}
              </p>
            </div>
          )}
        </div>

        <AvatarSelectionModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          onSave={handleSaveAvatar}
        />
      </div>
    </div>
  );
};

export default AvatarSelectionDemo; 