import React from "react";

export default function LoadingState({ label = "Memuat data..." }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="rounded-2xl border border-[#D6A84F]/30 bg-white px-5 py-4 text-sm font-semibold text-[#064E3B] shadow-soft">
        {label}
      </div>
    </div>
  );
}

