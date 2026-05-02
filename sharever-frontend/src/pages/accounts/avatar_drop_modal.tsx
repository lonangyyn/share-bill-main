import { useRef, useState } from "react";
import { Button } from "../../shared/ui/button";

interface AvatarCropModalProps {
  previewUrl: string;
  cropScale: number;
  cropRotate: number;
  loading: boolean;
  onScaleChange: (val: number) => void;
  onRotateChange: (val: number) => void;
  onClose: () => void;
  onSave: (
    canvas: HTMLCanvasElement,
    offset: { x: number; y: number },
    containerWidth: number,
  ) => void;
}

export function AvatarCropModal({
  previewUrl,
  cropScale,
  cropRotate,
  loading,
  onScaleChange,
  onRotateChange,
  onClose,
  onSave,
}: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - cropOffset.x,
      y: e.touches[0].clientY - cropOffset.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCropOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Crop Avatar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kéo ảnh để điều chỉnh khung hình
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center touch-none select-none"
          style={{ aspectRatio: "1", cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEndDrag}
          onMouseLeave={handleEndDrag}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleEndDrag}
        >
          <img
            src={previewUrl}
            alt="Preview"
            draggable={false}
            style={{
              maxWidth: "none",
              transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale}) rotate(${cropRotate}deg)`,
              transformOrigin: "center center",
            }}
          />
          {/* Vòng tròn overlay để user biết phần ảnh sẽ được lấy */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              borderRadius: "50%",
              margin: "20px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Zoom</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={cropScale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            {(cropScale * 100).toFixed(0)}%
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Rotate</label>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={cropRotate}
            onChange={(e) => onRotateChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500">{cropRotate}°</p>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <Button
            className="flex-1"
            onClick={() =>
              canvasRef.current &&
              onSave(
                canvasRef.current,
                cropOffset,
                containerRef.current?.clientWidth || 300,
              )
            }
            disabled={loading}
          >
            {loading ? "Uploading..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
