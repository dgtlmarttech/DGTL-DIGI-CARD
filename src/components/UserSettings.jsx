import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/getCroppedImg";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc , getDoc , updateDoc } from "firebase/firestore";
import { storage, db } from "../firebase/firebase";
import { FiEdit, FiImage, FiSettings, FiLogOut, FiX, FiInfo } from 'react-icons/fi';

const UserSettings = ({ currentUser, onLogout, onEditProfile, onClose, isPremium, isCurrUser }) => {
  
  // For profile image change (crop modal)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [preview, setPreview] = useState(null);

  // For card style changer
  const [cardStyle, setCardStyle] = useState("default");

  // Cropper callback
  const onCropComplete = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Fetch the card style from Firestore on component mount
  useEffect(() => {
    const fetchCardStyle = async () => {
      if (!currentUser?.uid) return;
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && userSnap.data().cardStyle) {
          setCardStyle(userSnap.data().cardStyle);
        }
      } catch (error) {
        console.error("Error fetching card style:", error);
      }
    };
    fetchCardStyle();
  }, [currentUser]);

  // Save selected cardStyle to Firestore
  const handleCardStyleChange = async (e) => {
    const newStyle = e.target.value;
    setCardStyle(newStyle);

    if (currentUser?.uid) {
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        await updateDoc(userDocRef, { cardStyle: newStyle });
      } catch (error) {
        console.error("Error updating card style:", error);
      }
    }
  };

  // Generate preview image from cropped area
  useEffect(() => {
    if (imageSrc && croppedAreaPixels) {
      (async () => {
        try {
          const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
          setPreview(croppedImage);
        } catch (error) {
          console.error("Error generating preview:", error);
        }
      })();
    }
  }, [imageSrc, croppedAreaPixels]);

  // Handle file input change for new profile picture
  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropModalOpen(true);
    }
  };

  // Read file as data URL
  const readFile = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.readAsDataURL(file);
    });

  // Save cropped image to Cloudinary and update Firestore
  const handleSaveImage = useCallback(async () => {
    try {
      const croppedImageDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Secure direct upload to Cloudinary (bypassing filled Firebase storage)
      const formData = new FormData();
      formData.append('file', croppedImageDataUrl);
      formData.append('upload_preset', 'digicard_preset');

      const response = await fetch('https://api.cloudinary.com/v1_1/dbbll23jz/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image uploading to Cloudinary failed.');
      }

      const data = await response.json();
      const downloadURL = data.secure_url;

      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { imgUrl: downloadURL }, { merge: true });
      setIsCropModalOpen(false);
      setImageSrc(null);
      setPreview(null);
      window.location.reload(); // Reload to reflect changes
    } catch (error) {
      console.error("Error saving image:", error);
    }
  }, [imageSrc, croppedAreaPixels, currentUser]);

  // If user is not logged in, show a different view
  if (!isCurrUser) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-6 text-center text-gray-800 dark:text-gray-200">
          <h2 className="text-xl font-bold mb-4">User Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Please log in or sign up to create a new account or access your Digital Card to make changes.
          </p>
          <button
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => window.location.href = "/signin"}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Settings sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl transform translate-x-0 transition-transform duration-300 ease-in-out flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Settings</h2>
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full"
              onClick={onLogout}
            >
              <FiLogOut size={20} />
            </button>
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full"
              onClick={onClose}
            >
              <FiX size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 flex-grow overflow-y-auto">
          {/* Profile section */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-indigo-500 dark:ring-indigo-400 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              {currentUser.imgUrl ? (
                <img src={currentUser.imgUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">No Image</span>
              )}
            </div>
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">{currentUser.displayName || currentUser.email}</p>
          </div>

          {/* Options container */}
          <div className="space-y-4">
            {/* Edit Details button */}
            <div className="relative group">
              <button
                className="w-full px-4 py-3 rounded-lg bg-indigo-500 text-white text-left transition-colors flex items-center justify-between hover:bg-indigo-600"
                onClick={onEditProfile}
              >
                <div className="flex items-center gap-3">
                  <FiEdit size={20} />
                  <span>Edit Details</span>
                </div>
              </button>
            </div>

            {/* Change Profile Pic button */}
            <div className="relative group">
              <button 
                className="w-full px-4 py-3 text-left rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
                onClick={() => setIsCropModalOpen(true)}
              >
                <FiImage size={20} />
                <span>Change Profile Pic</span>
              </button>
            </div>

            {/* Card Style Changer */}
            <div className="relative group">
              <div className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${!isPremium ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <div className="flex items-center gap-3">
                  <FiSettings size={20} />
                  <span>Card Style</span>
                </div>
                <select 
                  className={`bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0 ${!isPremium ? 'cursor-not-allowed' : ''}`}
                  value={cardStyle} 
                  onChange={handleCardStyleChange} 
                  disabled={!isPremium}
                >
                  <option value="default">Default</option>
                  <option value="style1">Radiant</option>
                  <option value="style2">Sleek</option>
                  <option value="style3">Heritage</option>
                  <option value="style4">Nova</option>
                  <option value="style5">Vanguard</option>
                  <option value="style6">Zenith</option>
                </select>
                {!isPremium && <FiInfo size={20} className="text-gray-400" />}
              </div>
              {!isPremium && (
                <span className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-800 dark:bg-gray-600 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Buy Premium to unlock this feature
                </span>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Crop Modal Popup for Profile Pic */}
      {isCropModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Change Profile Picture</h2>
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImageSrc(null);
                }}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-grow overflow-y-auto">
              {imageSrc ? (
                <>
                  <div className="relative w-full h-64 mb-4">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      cropShape="round"
                    />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Zoom:</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(e.target.value)}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-md font-semibold mb-2">Preview</h3>
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border border-gray-300 dark:border-gray-600">
                      {preview ? (
                        <img src={preview} alt="Cropped Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Select a new image to crop</p>
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Select Image
                  </label>
                  <input
                    id="file-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                onClick={handleSaveImage}
                disabled={!preview}
              >
                Save Image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserSettings;
