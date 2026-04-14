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

// #region Helpers
const MAX_PHOTO_SIZE_BYTES = 6 * 1024 * 1024;

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let result = reader.result as string;
      // HEIC/HEIF files often get "application/octet-stream" MIME type from FileReader.
      // Normalize to "image/heic" so backend validation accepts it.
      if (!result.startsWith("data:image/")) {
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
        if (ext === ".heic" || ext === ".heif") {
          result = result.replace(/^data:[^;]*;/, "data:image/heic;");
        }
      }
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });

// #endregion Helpers

// #region Component
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

    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".bmp", ".tiff"];
    const invalidFiles = files.filter((file) => {
      if (file.type.startsWith("image/")) return false;
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      return !imageExtensions.includes(ext);
    });
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
    <div className="site-card rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#8FA68E]/60 via-[#8FA68E]/30 to-transparent" />

      <div className="p-6 flex-1 flex flex-col">
        {/* Title row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#8FA68E]/10 border border-[#8FA68E]/25 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-[#8FA68E]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F3EE] font-heading">Share Trail Photos</h3>
            <p className="text-xs text-[#8E8A81]">Upload photos from your hikes and adventures</p>
          </div>
        </div>

        {/* Drop zone */}
        <div className="mb-4">
          <label
            htmlFor="photo-upload"
            className={`flex flex-col items-center justify-center w-full h-36 rounded-xl cursor-pointer transition-all border-2 border-dashed ${
              selectedPhotos.length > 0
                ? "border-[#8FA68E]/50 bg-[#8FA68E]/5"
                : "border-white/12 bg-[#111714] hover:border-[#8FA68E]/40 hover:bg-[#8FA68E]/5"
            }`}
          >
            {selectedPhotos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <CloudUpload className="w-8 h-8 text-[#8FA68E]/70" />
                <p className="text-sm text-[#B8B4AA] font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-[#8E8A81]">PNG, JPG, HEIC · up to 6 MB each</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-2xl">📷</span>
                <p className="text-sm text-[#8FA68E] font-medium">
                  {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? "s" : ""} selected
                </p>
                <p className="text-xs text-[#8E8A81]">Click to change</p>
              </div>
            )}
            <input id="photo-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleChange} />
          </label>

          {/* Preview thumbnails */}
          {photoPreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="rounded-lg overflow-hidden border border-white/10 h-16 bg-[#111714]">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
        <textarea
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
          placeholder="Add a caption — where was this?"
          className="site-input w-full px-4 py-3 rounded-lg resize-none text-sm mb-4 flex-1"
          rows={3}
        />

        {message && (
          <div className={`mb-3 rounded-lg px-3 py-2 text-sm border ${
            message.type === "success"
              ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
              : "bg-red-900/20 border-red-700/30 text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isUploading || selectedPhotos.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 mt-auto"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Uploading…" : "Upload Photos"}
        </button>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default PhotoUploadCard;
// #endregion Exports
