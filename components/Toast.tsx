import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastAppearance = "positive" | "negative" | "neutral";

interface ToastProps {
  id: string;
  message: string;
  appearance?: ToastAppearance;
  timeout?: number;
  onDismiss: (id: string) => void;
  action?: React.ReactNode;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  appearance = "neutral",
  timeout = 5000,
  onDismiss,
  action,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [timeout]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Wait for exit animation
  };

  const styles = {
    positive: {
      icon: <CheckCircle2 size={18} className="text-emerald-500" />,
      border: "border-emerald-500/20",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.1)]",
      accent: "bg-emerald-500/10",
    },
    negative: {
      icon: <AlertCircle size={18} className="text-rose-500" />,
      border: "border-rose-500/20",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.1)]",
      accent: "bg-rose-500/10",
    },
    neutral: {
      icon: <Info size={18} className="text-orange-400" />,
      border: "border-orange-500/20",
      glow: "shadow-[0_0_20px_rgba(251,146,60,0.1)]",
      accent: "bg-orange-500/10",
    },
  }[appearance];

  return (
    <div
      className={`
                relative min-w-[320px] max-w-md 
                bg-black/40 backdrop-blur-3xl 
                border ${styles.border} ${styles.glow}
                rounded-2xl overflow-hidden
                animate-in slide-in-from-right-4 fade-in duration-300
                ${isExiting ? "animate-out slide-out-to-right-4 fade-out fill-mode-forwards" : ""}
            `}
      role={appearance === "negative" ? "alert" : "status"}
    >
      <div className="p-4 flex gap-4">
        <div className={`p-2 rounded-xl ${styles.accent} shrink-0`}>
          {styles.icon}
        </div>

        <div className="flex-1 flex flex-col justify-center min-w-0">
          <p className="text-[13px] font-black text-slate-100 italic tracking-tight leading-tight">
            {message}
          </p>
          {action && <div className="mt-2">{action}</div>}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-slate-500 hover:text-white transition-colors h-fit"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Animated Progress Bar */}
      {timeout > 0 && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5">
          <div
            className={`h-full ${appearance === "positive" ? "bg-emerald-500" : appearance === "negative" ? "bg-rose-500" : "bg-orange-400"} opacity-50 transition-all linear`}
            style={{
              animation: `toast-progress ${timeout}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
    </div>
  );
};

export default Toast;
