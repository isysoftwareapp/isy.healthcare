"use client";

import { useState } from "react";
import { decryptFile } from "@/lib/encryption";
import EncryptionKeyManager from "@/lib/encryption";

interface SecureFileViewerProps {
  encryptedData: string;
  metadata: { name: string; type: string };
  className?: string;
}

export default function SecureFileViewer({
  encryptedData,
  metadata,
  className = "",
}: SecureFileViewerProps) {
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setDecrypting(true);
      setError(null);

      // Get encryption key
      const key = await EncryptionKeyManager.getKey();
      if (!key) {
        throw new Error("Encryption key not available. Please login again.");
      }

      // Decrypt file
      const decryptedFile = await decryptFile(encryptedData, key, metadata);

      // Create download link
      const url = URL.createObjectURL(decryptedFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = metadata.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("File decryption error:", err);
      setError(err.message || "Failed to decrypt file");
    } finally {
      setDecrypting(false);
    }
  };

  const handleView = async () => {
    try {
      setDecrypting(true);
      setError(null);

      // Get encryption key
      const key = await EncryptionKeyManager.getKey();
      if (!key) {
        throw new Error("Encryption key not available. Please login again.");
      }

      // Decrypt file
      const decryptedFile = await decryptFile(encryptedData, key, metadata);

      // Open in new tab
      const url = URL.createObjectURL(decryptedFile);
      window.open(url, "_blank");

      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      console.error("File decryption error:", err);
      setError(err.message || "Failed to decrypt file");
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <svg
          className="w-4 h-4 text-blue-500"
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
        <span className="font-medium">{metadata.name}</span>
      </div>

      <button
        onClick={handleView}
        disabled={decrypting}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        title="View file"
      >
        {decrypting ? "Decrypting..." : "View"}
      </button>

      <button
        onClick={handleDownload}
        disabled={decrypting}
        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        title="Download file"
      >
        {decrypting ? "Decrypting..." : "Download"}
      </button>

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}

