"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FlipHorizontal2, RefreshCw, SwitchCamera, VideoOff } from "lucide-react";
import type { PixelSource } from "@/features/ascii/types";

export default function CameraCapture({ onCapture }: { onCapture: (source: PixelSource) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState("");

  function stop() {
    generation.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setLoading(false);
  }

  useEffect(() => () => {
    generation.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function start(nextFacing = facing) {
    stop();
    const request = ++generation.current;
    setError("");
    setLoading(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access needs a secure browser connection (HTTPS or localhost).");
      setLoading(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (request !== generation.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (request !== generation.current) return;
      setActive(true);
      setCaptured(false);
    } catch (reason) {
      if (request !== generation.current) return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const code = reason instanceof DOMException ? reason.name : "";
      setError(code === "NotAllowedError" ? "Camera permission was declined. Allow camera access in your browser, then try again." : code === "NotFoundError" ? "No camera was found. You can upload a photo instead." : code === "NotReadableError" ? "This camera is busy in another application. Close it there and try again." : "Your camera could not start. Try again or upload a photo.");
    } finally { if (request === generation.current) setLoading(false); }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) { setError("The camera is warming up. Try capture again in a moment."); return; }
    const scale = Math.min(1, 1600 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) { setError("Your browser could not capture this frame."); return; }
    if (mirror) { context.translate(canvas.width, 0); context.scale(-1, 1); }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    onCapture({ data: pixels.data, width: canvas.width, height: canvas.height });
    stop();
    setCaptured(true);
  }

  return <div className="studio-camera">
    <div className={`studio-camera-preview ${active ? "is-active" : ""}`}>
      <video ref={videoRef} muted playsInline style={{ transform: mirror ? "scaleX(-1)" : undefined }} aria-label="Live camera preview" />
      {!active && <div><Camera size={26} /><span>{loading ? "[ ░▒▓ ] Connecting…" : captured ? "Photo captured" : "Your next self-portrait."}</span><small>Your camera stays on this device.</small></div>}
    </div>
    {error && <p className="studio-inline-error" role="alert">{error}</p>}
    {active ? <><button className="studio-button primary full" onClick={capture}><Camera size={15} /> Capture photo</button><div className="studio-button-row"><button className="studio-button" onClick={() => setMirror(!mirror)} aria-pressed={mirror}><FlipHorizontal2 size={14} /> Mirror</button><button className="studio-button" onClick={() => { const next = facing === "user" ? "environment" : "user"; setFacing(next); void start(next); }}><SwitchCamera size={14} /> Flip</button><button className="studio-icon-button" onClick={stop} title="Stop camera" aria-label="Stop camera"><VideoOff size={16} /></button></div></> : <button className="studio-button primary full" disabled={loading} onClick={() => void start()}>{captured ? <RefreshCw size={15} /> : <Camera size={15} />}{loading ? "Starting camera…" : captured ? "Retake photo" : "Enable camera"}</button>}
  </div>;
}
