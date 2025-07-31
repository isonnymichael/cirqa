"use client"
import React, { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  link?: string;
  linkLabel?: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, link?: string, linkLabel?: string) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, link?: string, linkLabel?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, link, linkLabel }]);
    setTimeout(() => removeToast(id), 6000);
  };
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-gray-900 text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 min-w-[260px] max-w-xs">
            <span>{toast.message}</span>
            {toast.link && (
              <a href={toast.link} target="_blank" rel="noopener noreferrer" className="ml-2 underline text-accent hover:text-accent-light">{toast.linkLabel || "View"}</a>
            )}
            <button onClick={() => removeToast(toast.id)} className="ml-auto text-gray-400 hover:text-white">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};