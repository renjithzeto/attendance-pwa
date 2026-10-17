'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Start front camera stream
  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware access is not supported by this browser.');
      }

      // Stop any existing tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front selfie camera
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera permissions in your browser settings to verify your identity.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No front camera found on this device.');
      } else {
        setCameraError(err.message || 'Unable to access live camera stream.');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup tracks on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync stream to video element once ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Capture instant snapshot directly from the video frame to canvas
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame (mirror horizontally for natural selfie perception)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    onCapture(dataUrl);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    onCapture('');
    startCamera();
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hidden canvas for drawing snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Preview Frame */}
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-2xl flex items-center justify-center">
        {capturedPhoto ? (
          // Captured Snapshot Preview
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto}
              alt="Live Selfie Capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Selfie Captured
            </div>
          </div>
        ) : (
          // Live Video Feed
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* Live Indicator overlay */}
            {!cameraError && !isInitializing && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE CAMERA ONLY
              </div>
            )}

            {/* Anti-spoof watermark notice */}
            <div className="absolute bottom-2 inset-x-2 text-center text-[10px] text-slate-400 bg-slate-900/70 py-0.5 rounded backdrop-blur-xs">
              Hardware-locked stream • Gallery upload disabled
            </div>
          </>
        )}

        {/* Loading overlay */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-300">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-500 mb-2" />
            <span className="text-xs font-medium">Starting secure camera...</span>
          </div>
        )}

        {/* Error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/95 text-rose-300">
            <AlertTriangle className="w-9 h-9 text-rose-500 mb-2" />
            <p className="text-xs font-semibold">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-white hover:bg-slate-700 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
            </button>
          </div>
        )}
      </div>

      {/* Camera Action Buttons */}
      <div className="mt-3 flex w-full max-w-sm justify-center gap-3">
        {capturedPhoto ? (
          <button
            type="button"
            onClick={handleRetake}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            Retake Photo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSnap}
            disabled={disabled || isInitializing || Boolean(cameraError)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Camera className="w-4 h-4" />
            Take Live Selfie
          </button>
        )}
      </div>
    </div>
  );
}
