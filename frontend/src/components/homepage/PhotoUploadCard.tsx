// src/components/homepage/PhotoUploadCard.tsx
// Card component for uploading travel photos with client-side image compression before upload.
// #region Imports
import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { compressImage } from "../../utils/imageCompression";
import { uploadPhotos } from "../../services/photos";
import { Camera, Upload, CloudUpload } from "lucide-react";
import { getToken } from "../../services/auth";

// #endregion Imports
const MAX_PHOTO_SIZE_BYTES = 6 * 1024 * 1024;

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

type PhotoUploadCardProps = {
  onUploaded: () => Promise<void> | void;
};

const PhotoUploadCard: React.FC<PhotoUploadCardProps> = ({ onUploaded }) => {
  const { showSuccess, showError } = useToast();
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoCaption, setPhotoCaption] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handles handleChange logic.
  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setMessage(null);

    if (!files.length) {
      setSelectedPhotos([]);
      setPhotoPreviews([]);
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > MAX_PHOTO_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      showError(`Some files are too large. Maximum size is ${MAX_PHOTO_SIZE_BYTES / (1024 * 1024)}MB per file.`);
      return;
    }

    const invalidFiles = files.filter((file) => !file.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      showError("Please select only image files.");
      return;
    }

    try {
      const compressedFiles = await Promise.all(files.map((file) => compressImage(file)));
      setSelectedPhotos(compressedFiles);
      const previews = await Promise.all(compressedFiles.map(convertFileToBase64));
      setPhotoPreviews(previews);
    } catch (err) {
      console.error("Failed to process images", err);
      showError("Failed to process images. Please try again.");
      setPhotoPreviews([]);
      setSelectedPhotos([]);
    }
  };

  // Handles handleSubmit logic.
  const handleSubmit = async () => {
    if (!selectedPhotos.length) {
      setMessage({ type: "error", text: "Please choose at least one photo to upload." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      for (const file of selectedPhotos) {
        if (file.size > MAX_PHOTO_SIZE_BYTES) {
          throw new Error("Each photo must be smaller than 6MB.");
        }
      }

      const imagesData = await Promise.all(selectedPhotos.map((file) => convertFileToBase64(file)));
      const token = getToken() || undefined;
      await uploadPhotos(imagesData, photoCaption, token);

      setMessage({ type: "success", text: "Photo(s) uploaded successfully!" });
      showSuccess("Photo(s) uploaded successfully!");
      setSelectedPhotos([]);
      setPhotoPreviews([]);
      setPhotoCaption("");
      await onUploaded();
    } catch (err: any) {
      const errorMessage = err?.message || "Unable to upload photo. Please try again.";
      setMessage({ type: "error", text: errorMessage });
      showError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl shadow-sm p-8">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-white/10 border border-white/20">
          <Camera className="w-10 h-10 text-white/70" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Share your <span className="underline decoration-2 decoration-white">Trail Photos</span>
        </h3>
        <p className="text-sm text-gray-200">Upload photos from your hikes, treks, and adventures</p>
      </div>

      <div className="mb-4">
        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all glass">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <CloudUpload className="w-10 h-10 mb-2 text-gray-300" />
            <p className="text-sm text-gray-200 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-300 mt-1">PNG, JPG up to 10MB</p>
          </div>
          <input id="photo-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleChange} />
        </label>
        {selectedPhotos.length > 0 && (
          <>
            <p className="mt-2 text-xs text-gray-300 text-center">
              Selected {selectedPhotos.length} {selectedPhotos.length === 1 ? "photo" : "photos"}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="rounded-lg overflow-hidden border border-gray-200 h-20">
                  <img src={preview} alt={`Selected trail preview ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <textarea
        value={photoCaption}
        onChange={(e) => setPhotoCaption(e.target.value)}
        placeholder="Add a caption or description..."
        className="w-full px-4 py-3 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none mb-4 text-white placeholder-gray-300"
        rows={3}
      />

      {message && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.type === "success" ? "glass-strong text-black" : "glass-dark text-white"}`}>{message.text}</div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isUploading}
        className="w-full glass-button-dark font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-white"
      >
        <Upload className="w-4 h-4" />
        {isUploading ? "Uploading..." : "Upload Photos"}
      </button>
    </div>
  );
};

// #region Exports
export default PhotoUploadCard;
// #endregion Exports
