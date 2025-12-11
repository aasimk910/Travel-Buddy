import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { useToast } from "../../context/ToastContext";

type Hike = {
  _id: string;
  title: string;
  location: string;
  difficulty: number;
  date: string;
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
};

type ConnectModalProps = {
  open: boolean;
  hike: Hike;
  onClose: () => void;
};

const difficultyLabels = ["Very Easy", "Easy", "Moderate", "Hard", "Expert"];
const extractPlace = (location: string): string => {
  if (location.toLowerCase().includes("kathmandu")) return "Kathmandu Valley";
  if (location.toLowerCase().includes("pokhara")) return "Pokhara";
  if (location.toLowerCase().includes("annapurna")) return "Annapurna Region";
  if (location.toLowerCase().includes("kavre") || location.toLowerCase().includes("dhulikhel")) return "Kavre";
  return "Nepal";
};

const ConnectModal: React.FC<ConnectModalProps> = ({ open, hike, onClose }) => {
  const { showSuccess } = useToast();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!open) return;
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex="0"]'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      lastFocusedElementRef.current?.focus();
    }, 0);
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      showSuccess("Joined hike");
      handleClose();
    } finally {
      setIsJoining(false);
    }
  };

  if (!open) return null;

  const place = extractPlace(hike.location);
  const difficultyText = difficultyLabels[(hike.difficulty || 1) - 1] || difficultyLabels[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`connect-dialog-title-${hike._id}`}
      aria-describedby={`connect-dialog-desc-${hike._id}`}
      id={`connect-dialog-${hike._id}`}
    >
      <div ref={dialogRef} className="glass-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass-nav px-6 py-4 flex items-center justify-end rounded-t-2xl">
          <button type="button" onClick={handleClose} className="px-3 py-1.5 text-gray-200 hover:text-white glass-button rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>

        <div className="p-6">
          <div className="rounded-2xl overflow-hidden mb-6">
            <div className="h-56 sm:h-72 bg-gray-200 relative">
              {hike.imageUrl ? (
                <img src={hike.imageUrl} alt={hike.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gray-100" />
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="inline-flex items-center rounded-full glass-strong px-3 py-1 text-[11px] font-medium text-black shadow-sm">{place}</span>
                <span className="inline-flex items-center rounded-full glass-strong px-3 py-1 text-[11px] font-medium text-black shadow-sm">{difficultyText}</span>
              </div>
            </div>
          </div>

          <h2 id={`connect-dialog-title-${hike._id}`} className="text-2xl sm:text-3xl font-bold text-white">
            {hike.title}
          </h2>
          <div id={`connect-dialog-desc-${hike._id}`} className="mt-2 inline-flex items-center gap-2 text-sm text-gray-200">
            <CalendarDays className="w-4 h-4" />
            <span>{new Date(hike.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>

          <div className="mt-6 glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full glass-button-dark flex items-center justify-center text-white">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-sm text-white">Spots left: {hike.spotsLeft}</span>
              </div>
              <button type="button" onClick={handleJoin} disabled={isJoining || hike.spotsLeft <= 0} className="px-5 py-2 glass-button-dark rounded-full font-semibold disabled:opacity-60 transition-colors shadow-lg text-white">
                {isJoining ? "Joining…" : "Join Hike"}
              </button>
            </div>
          </div>

          <div className="mt-6 glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4">
              <p className="text-xs text-gray-300 mb-2">Organized By</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full glass-button-dark text-white flex items-center justify-center">TB</div>
                <div>
                  <p className="text-sm font-medium text-white">Travel Buddy</p>
                  <p className="text-xs text-gray-300">Hike Leader</p>
                </div>
              </div>
            </div>
          </div>

          {hike.description && (
            <div className="mt-6 glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4">
                <p className="text-xs text-gray-300 mb-2">About Hike</p>
                <p className="text-sm text-gray-200">{hike.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
