"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      duration={2000}
      toastOptions={{
        style: {
          background: "white",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          fontSize: "14px",
          fontWeight: 500,
          padding: "10px 16px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        },
        classNames: {
          success: "!bg-emerald-50 !border-emerald-200 !text-emerald-800",
          error: "!bg-red-50 !border-red-200 !text-red-800",
        },
      }}
    />
  );
}
