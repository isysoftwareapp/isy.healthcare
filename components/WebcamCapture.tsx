"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, X, Check, RefreshCw } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export default function WebcamCapture({
  onCapture,
  onClose,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Start webcam
  const startWebcam = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      setError(
        "Failed to access camera. Please ensure camera permissions are granted."
      );
      console.error("Webcam error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data URL
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageDataUrl);
      }
    }
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Confirm and save photo
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopWebcam();
      onClose();
    }
  }, [capturedImage, onCapture, stopWebcam, onClose]);

  // Cleanup on unmount
  const handleClose = useCallback(() => {
    stopWebcam();
    onClose();
  }, [stopWebcam, onClose]);

  // Auto-start webcam on mount
  useState(() => {
    startWebcam();
    return () => stopWebcam();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Capture Patient Photo
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={startWebcam}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Camera Preview */}
        <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-gray-900">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                  <div className="text-white">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!capturedImage ? (
            <>
              <button
                onClick={handleClose}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={!stream || isLoading}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Retake
              </button>
              <button
                onClick={confirmPhoto}
                className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                Use This Photo
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            {!capturedImage
              ? "Position the patient's face in the frame and click 'Capture Photo'."
              : "Review the photo. Click 'Use This Photo' to save or 'Retake' to try again."}
          </p>
        </div>
      </div>
    </div>
  );
}
