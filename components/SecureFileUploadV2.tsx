"use client";

import { useState } from "react";
import { encryptFile, decryptFile } from "@/lib/encryption";
import EncryptionKeyManager from "@/lib/encryption";

interface SecureFileUploadV2Props {
  onFileEncrypted: (
    encryptedData: string,
    metadata: { name: string; type: string; size: number }
  ) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function SecureFileUploadV2({
  onFileEncrypted,
  acceptedFileTypes = "image/*,.pdf",
  maxSizeMB = 10,
  label = "Upload Secure File",
}: SecureFileUploadV2Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    try {
      setUploading(true);

      // Get encryption key
      const key = await EncryptionKeyManager.getKey();
      if (!key) {
        throw new Error("Encryption key not available. Please login again.");
      }

      // Encrypt file using AES-256-GCM
      const { encrypted, metadata } = await encryptFile(file, key);

      // Pass encrypted data to parent
      onFileEncrypted(encrypted, metadata);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("File encryption error:", err);
      setError(err.message || "Failed to encrypt file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        <span className="ml-2 text-xs text-gray-500">
          (AES-256-GCM Encrypted)
        </span>
      </label>

      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer">
          <input
            type="file"
            onChange={handleFileChange}
            accept={acceptedFileTypes}
            disabled={uploading}
            className="hidden"
          />
          <div
            className={`px-4 py-2 border-2 border-dashed rounded-lg transition-colors ${
              uploading
                ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                : "border-blue-300 hover:border-blue-500 hover:bg-blue-50"
            }`}
          >
            <div className="flex items-center gap-2">
              {uploading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Encrypting...
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Choose File
                  </span>
                </>
              )}
            </div>
          </div>
        </label>

        {success && (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Encrypted Successfully</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Max file size: {maxSizeMB}MB. All files are encrypted with AES-256-GCM
        before upload.
      </p>
    </div>
  );
}

