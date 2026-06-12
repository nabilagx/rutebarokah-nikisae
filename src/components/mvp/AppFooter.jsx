"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Instagram,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Store,
  X,
  Youtube,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function AppFooter() {
  const [comingSoon, setComingSoon] = useState("");

  return (
    <footer className="bg-[#003C2E] text-white">
      <div className="section-shell grid gap-8 py-9 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12" />
            <div>
              <p className="font-display text-2xl font-bold">RuteBarokah</p>
              <p className="-mt-1 text-sm font-bold text-[#D6A84F]">Platform</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/72">
            Platform kurasi dan matching UMKM halal berbasis rute untuk mendukung ekosistem haji dan umrah Indonesia.
          </p>
          <div className="mt-4 flex gap-3">
            {[Instagram, Youtube, MessageCircle, Mail].map((Icon, index) => (
              <span key={index} className="grid h-9 w-9 place-items-center rounded-full border border-white/18 text-white/80">
                <Icon size={17} />
              </span>
            ))}
          </div>
        </div>
        <FooterLinks
          items={[[Search, "Cari Vendor", "/vendors"], [ShieldCheck, "Tentang Kami", "/#tentang"], [Store, "Daftar UMKM", "/join-umkm"]]}
          onSoon={setComingSoon}
        />
        <FooterLinks
          items={[[Star, "Blog", "soon"], [MessageCircle, "Request Vendor", "/request-vendor"], [Mail, "Kontak", "/request-vendor"]]}
          onSoon={setComingSoon}
        />
        <FooterLinks
          items={[[Star, "Barokah Score", "/#barokah-score"], [ShieldCheck, "Kebijakan Privasi", "soon"]]}
          onSoon={setComingSoon}
        />
      </div>
      <div className="section-shell flex flex-col gap-3 border-t border-white/10 py-4 text-xs text-white/72 md:flex-row md:items-center md:justify-between">
        <p>© 2026 RuteBarokah. Mendukung UMKM Halal Indonesia.</p>
        <p>Untuk ekosistem haji-umrah yang lebih baik</p>
      </div>

      {comingSoon && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#001B14]/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-[#D6A84F]/30 bg-white p-6 text-[#1F2937] shadow-premium">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D6A84F]">Segera Hadir</p>
                <h3 className="mt-2 font-display text-3xl font-bold text-[#064E3B]">{comingSoon}</h3>
              </div>
              <button
                type="button"
                onClick={() => setComingSoon("")}
                className="rounded-full border border-[#064E3B]/10 p-2 text-[#064E3B] hover:bg-[#ECFDF5]"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 leading-7 text-[#1F2937]/68">
              Halaman ini sedang disiapkan untuk versi berikutnya. Untuk demo MVP, gunakan menu Cari Vendor, Daftar UMKM, atau Request Vendor.
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}

function FooterLinks({ items, onSoon }) {
  return (
    <div className="grid gap-3 border-white/10 md:border-l md:pl-8">
      {items.map(([Icon, label, href]) => {
        const className = "flex items-center gap-3 text-left text-sm font-semibold text-white/82 hover:text-[#D6A84F]";

        if (href === "soon") {
          return (
            <button key={label} type="button" onClick={() => onSoon(label)} className={className}>
              <Icon size={17} />
              {label}
            </button>
          );
        }

        return (
          <Link key={label} href={href} className={className}>
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
