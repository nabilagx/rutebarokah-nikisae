import React from "react";

export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#D6A84F]/50 bg-white/70 p-8 text-center">
      <h3 className="font-display text-2xl font-bold text-[#064E3B]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#1F2937]/65">
        {description}
      </p>
    </div>
  );
}

