// src/utils/imageCompression.ts

// #region Helpers
const isHeic = (file: File): boolean => {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
};
// #endregion Helpers

// #region compressImage
/**
 * Compresses an image file to reduce its size.
 * HEIC/HEIF files are returned as-is since browsers can't decode them
 * on a canvas — Cloudinary handles the conversion server-side.
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  // HEIC/HEIF: skip client-side compression, Cloudinary converts them server-side
  if (isHeic(file)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Always output as JPEG — canvas doesn't support HEIC/HEIF
        const outputType = "image/jpeg";
        const outputName = file.name.replace(/\.[^.]+$/, ".jpg");

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }
            const compressedFile = new File([blob], outputName, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image."));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};
// #endregion compressImage


