import React, { type RefObject } from 'react';
interface Props { videoRef: RefObject<HTMLVideoElement | null>; canvasRef: RefObject<HTMLCanvasElement | null>; mirrored: boolean }
/** Video + overlay canvas. Both use object-contain so landmarks line up; mirrored = selfie view. */
export default function CameraView({ videoRef, canvasRef, mirrored }: Props) {
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-black" style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
      <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-contain" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" />
    </div>
  );
}