"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, File, X, AlertCircle, Lock } from "lucide-react";

interface SecureFileUploadProps {
  onFileSelect: (file: File, encryptedData?: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label: string;
  description?: string;
  encrypt?: boolean;
  currentFile?: string;
}

export default function SecureFileUpload({
  onFileSelect,
  acceptedTypes = "image/*,.pdf",
  maxSizeMB = 10,
  label,
  description,
  encrypt = false,
  currentFile,
}: SecureFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(currentFile || "");
  const [error, setError] = useState<string>("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple XOR encryption for demonstration (use proper encryption in production)
  const encryptFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);

          // Generate a simple encryption key (in production, use proper key management)
          const encryptionKey = crypto.getRandomValues(new Uint8Array(32));

          // XOR encryption (for demonstration - use AES-256-GCM in production)
          const encrypted = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) {
            encrypted[i] = bytes[i] ^ encryptionKey[i % encryptionKey.length];
          }

          // Convert to base64 with key prefix
          const keyBase64 = btoa(String.fromCharCode(...encryptionKey));
          const dataBase64 = btoa(String.fromCharCode(...encrypted));
          const encryptedData = `ENC:${keyBase64}:${dataBase64}`;

          resolve(encryptedData);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");

    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    const fileType = file.type;
    const acceptedTypesArray = acceptedTypes.split(",").map((t) => t.trim());
    const isValidType = acceptedTypesArray.some((type) => {
      if (type.endsWith("/*")) {
        const category = type.replace("/*", "");
        return fileType.startsWith(category);
      }
      return fileType === type || file.name.endsWith(type);
    });

    if (!isValidType) {
      setError(`Invalid file type. Accepted: ${acceptedTypes}`);
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (fileType.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview("");
    }

    // Encrypt if required
    let encryptedData: string | undefined;
    if (encrypt) {
      try {
        setIsEncrypting(true);
        encryptedData = await encryptFile(file);
      } catch (err) {
        setError("Failed to encrypt file");
        console.error("Encryption error:", err);
        setIsEncrypting(false);
        return;
      } finally {
        setIsEncrypting(false);
      }
    }

    onFileSelect(file, encryptedData);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {encrypt && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
            <Lock className="h-3 w-3" />
            Encrypted
          </span>
        )}
      </label>

      {description && (
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
        disabled={isEncrypting}
      />

      {!selectedFile && !preview ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={isEncrypting}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center hover:border-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            Click to upload
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {acceptedTypes} (max {maxSizeMB}MB)
          </p>
        </button>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          {preview && (
            <div className="mb-3">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-32 w-auto rounded object-contain"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile?.name || "Uploaded file"}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedFile &&
                    `${(selectedFile.size / 1024).toFixed(2)} KB`}
                  {encrypt && isEncrypting && (
                    <span className="ml-2 text-green-600">Encrypting...</span>
                  )}
                  {encrypt && !isEncrypting && selectedFile && (
                    <span className="ml-2 text-green-600">✓ Encrypted</span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full p-1 hover:bg-gray-100"
              aria-label="Remove file"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
