import React from "react";
import Link from "next/link";

export default function ProtectedNotice({ title, description }) {
  return (
    <div className="mx-auto w-[min(760px,calc(100%-32px))] py-16">
      <div className="rounded-[32px] border border-[#D6A84F]/25 bg-white p-8 text-center shadow-premium">
        <h1 className="font-display text-3xl font-bold text-[#064E3B]">{title}</h1>
        <p className="mt-3 leading-7 text-[#1F2937]/68">{description}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-2xl bg-[#064E3B] px-6 py-3 font-bold text-white"
        >
          Masuk
        </Link>
      </div>
    </div>
  );
}

