import React from "react";
import Link from "next/link";
import { Instagram, Mail, MessageCircle, Search, ShieldCheck, Star, Store, Youtube } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="bg-[#003C2E] text-white">
      <div className="section-shell grid gap-8 py-9 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#D6A84F] bg-[#FFF8E7]">
              <span className="h-7 w-7 rounded-full bg-[#0B7A55]" />
            </span>
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
        <FooterLinks items={[[Search, "Cari Vendor", "/vendors"], [ShieldCheck, "Tentang Kami", "/vendors"], [Store, "Daftar UMKM", "/join-umkm"]]} />
        <FooterLinks items={[[Star, "Blog", "/vendors"], [MessageCircle, "Request Vendor", "/request-vendor"], [Mail, "Kontak", "/request-vendor"]]} />
        <FooterLinks items={[[Star, "Barokah Score", "/vendors"], [ShieldCheck, "Kebijakan Privasi", "/vendors"]]} />
      </div>
      <div className="section-shell flex flex-col gap-3 border-t border-white/10 py-4 text-xs text-white/72 md:flex-row md:items-center md:justify-between">
        <p>© 2026 RuteBarokah. Mendukung UMKM Halal Indonesia.</p>
        <p>Untuk ekosistem haji-umrah yang lebih baik</p>
      </div>
    </footer>
  );
}

function FooterLinks({ items }) {
  return (
    <div className="grid gap-3 border-white/10 md:border-l md:pl-8">
      {items.map(([Icon, label, href]) => (
        <Link key={label} href={href} className="flex items-center gap-3 text-sm font-semibold text-white/82 hover:text-[#D6A84F]">
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </div>
  );
}

