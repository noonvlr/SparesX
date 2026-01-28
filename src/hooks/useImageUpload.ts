import { useState } from "react";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const uploadImages = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      return data.urls || [];
    } catch (error: any) {
      const message = error.message || "Failed to upload images";
      setUploadError(message);
      console.error("Upload error:", error);
      return [];
    } finally {
      setUploading(false);
    }
  };

  return { uploadImages, uploading, uploadError };
}
