import React from "react";

export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <section className="section-shell pb-8 pt-10 md:pb-12 md:pt-14">
      <div className="relative overflow-hidden rounded-[28px] border border-[#064E3B]/10 bg-[#FFF8E7] p-7 shadow-premium md:p-10">
        <div className="absolute inset-y-0 left-0 w-24 ornament-bg opacity-70" />
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-[#D6A84F]/35" />
        <div className="absolute bottom-0 right-8 hidden h-24 w-56 rounded-t-full bg-[#ECFDF5] md:block" />
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">
          {eyebrow}
        </p>
        <div className="relative mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="max-w-4xl font-display text-4xl font-bold leading-tight text-[#064E3B] md:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-3xl text-base leading-8 text-[#1F2937]/70 md:text-lg">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}
