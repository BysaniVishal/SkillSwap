import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

const VARIANTS = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-700",
};

const ICONS = {
  success: "✓",
  error: "✕",
};

const DEFAULT_DURATION_MS = 3500;

let nextId = 0;

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, variant = "success") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), DEFAULT_DURATION_MS);
    },
    [dismiss]
  );

  const value = {
    success: (message) => show(message, "success"),
    error: (message) => show(message, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2 text-sm rounded-xl border px-3 py-2.5 shadow-lg animate-[toast-in_0.2s_ease-out] ${VARIANTS[t.variant]}`}
            >
              <span className="font-medium shrink-0">{ICONS[t.variant]}</span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export { ToastProvider, useToast };
