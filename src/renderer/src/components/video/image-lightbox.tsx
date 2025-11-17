import { X } from "lucide-react";
import { useEffect } from "react";

interface ImageLightboxProps {
  imageUrl: string;
  time: string;
  onClose: () => void;
}

export default function ImageLightbox({
  imageUrl,
  time,
  onClose,
}: ImageLightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 z-10"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="flex flex-col items-center gap-4 w-full h-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 flex items-center justify-center w-full">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="放大预览"
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg?height=600&width=800";
            }}
          />
        </div>
        <div className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
          {time}
        </div>
      </div>
    </div>
  );
}
