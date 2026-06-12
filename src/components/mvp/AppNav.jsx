"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";

const links = [
  ["Vendor", "/vendors"],
  ["Daftar UMKM", "/join-umkm"],
  ["Request Vendor", "/request-vendor"],
  ["Login", "/login"],
];

export default function AppNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#064E3B]/10 bg-white/90 backdrop-blur-xl">
      <nav className="section-shell flex h-[76px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-[#D6A84F]/55 bg-[#FFF8E7] shadow-soft">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0B7A55] text-white">
              <span className="h-4 w-3 rounded-b-full rounded-t-[10px] bg-[#D6A84F]" />
            </span>
          </span>
          <span className="font-display text-[28px] font-bold leading-none text-[#064E3B]">
            RuteBarokah
          </span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-semibold text-[#1F2937]/72 hover:text-[#064E3B]">
              {label}
            </Link>
          ))}
          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 rounded-xl bg-[#064E3B] px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-[#043c2e]"
          >
            Cari Vendor <Search size={16} />
          </Link>
        </div>
        <button
          type="button"
          aria-label="Buka menu"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-[#D6A84F]/30 bg-white p-3 text-[#064E3B] md:hidden"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
      {open && (
        <div className="section-shell pb-4 md:hidden">
          <div className="grid gap-1 rounded-3xl border border-[#D6A84F]/25 bg-white p-3 shadow-soft">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 font-semibold text-[#1F2937]/72 hover:bg-[#ECFDF5] hover:text-[#064E3B]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
