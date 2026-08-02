import { useState } from "react";

export type UploadImagesResult = {
  urls: string[];
  error: string | null;
};

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const uploadImages = async (files: File[]): Promise<UploadImagesResult> => {
    setUploading(true);
    setUploadError("");

    try {
      if (files.length === 0) {
        return { urls: [], error: null };
      }

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const headers: HeadersInit = {};
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (data as { error?: string }).error || "Upload failed";
        setUploadError(message);
        return { urls: [], error: message };
      }

      const urls = (data as { urls?: string[] }).urls || [];
      if (urls.length === 0) {
        const message = "Upload returned no image URLs";
        setUploadError(message);
        return { urls: [], error: message };
      }

      return { urls, error: null };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to upload images";
      setUploadError(message);
      console.error("Upload error:", error);
      return { urls: [], error: message };
    } finally {
      setUploading(false);
    }
  };

  return { uploadImages, uploading, uploadError, setUploadError };
}
