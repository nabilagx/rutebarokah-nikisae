import React from "react";
import { ArrowRight, CheckCircle2, Lock, MapPin, ShieldCheck, Users } from "lucide-react";

function Pin({ className }) {
  return (
    <span className={`absolute grid h-11 w-11 place-items-center rounded-full bg-tealSecondary text-white shadow-soft ring-4 ring-white ${className}`}>
      <MapPin size={22} fill="currentColor" strokeWidth={1.5} />
    </span>
  );
}

export default function Hero({ onSoon }) {
  return (
    <section id="beranda" className="container-rb pb-10 pt-10 md:pb-14 md:pt-16">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-mutedGold/30 bg-white/55 shadow-premium">
        <div className="islamic-corner absolute left-0 top-0 h-28 w-28 opacity-70" />
        <div className="islamic-corner absolute bottom-0 right-0 h-28 w-28 opacity-70" />
        <div className="grid items-center gap-10 p-6 md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
          <div className="relative z-10">
            <p className="mb-5 inline-flex rounded-full border border-mutedGold/35 bg-ivory px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-mutedGold">
              Peta digital UMKM haji & umrah
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.03] text-emeraldMain md:text-6xl">
              Temukan mitra UMKM terpercaya untuk perjalanan ibadah Anda
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-charcoal/72 md:text-lg">
              Peta digital yang menghubungkan jamaah, travel, KBIH, masjid, dan UMKM lokal untuk persiapan haji & umrah yang lebih mudah, aman, dan penuh berkah.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#rute"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emeraldMain px-6 py-3.5 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#094b3a]"
              >
                Jelajahi Rute <ArrowRight size={18} />
              </a>
              <button
                type="button"
                onClick={() => onSoon("Pendaftaran UMKM akan segera dibuka.")}
                className="rounded-2xl border border-emeraldMain/25 bg-white px-6 py-3.5 font-bold text-emeraldMain transition hover:-translate-y-0.5 hover:bg-sand/30"
              >
                Untuk UMKM
              </button>
            </div>
            <div className="mt-9 grid gap-3 text-sm text-charcoal/70 sm:grid-cols-3">
              {[
                [ShieldCheck, "Terverifikasi"],
                [Lock, "Aman & Transparan"],
                [Users, "Rekomendasi Komunitas"],
              ].map(([Icon, label]) => (
                <span key={label} className="flex items-center gap-2">
                  <Icon className="text-emeraldMain" size={18} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-[#efe6d4] p-4 shadow-inner md:min-h-[500px]">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-10 top-10 h-28 w-52 rotate-[-12deg] rounded-full border border-white/80" />
              <div className="absolute right-6 top-20 h-40 w-64 rotate-12 rounded-full border border-white/80" />
              <div className="absolute bottom-16 left-8 h-32 w-72 rotate-6 rounded-full border border-white/80" />
              <div className="absolute inset-0 bg-[linear-gradient(30deg,rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(120deg,rgba(255,255,255,.5)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 650 520" fill="none">
              <path
                className="map-line"
                d="M83 350 C170 250, 214 375, 310 285 S480 165, 548 260"
                stroke="#0D5B47"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M100 120 C190 160, 280 95, 390 135 S520 130, 610 80"
                stroke="#2FA58A"
                strokeWidth="2"
                strokeDasharray="6 10"
                opacity="0.35"
              />
            </svg>
            <Pin className="left-[10%] top-[62%]" />
            <Pin className="left-[45%] top-[48%]" />
            <Pin className="right-[12%] top-[42%]" />
            <Pin className="right-[30%] top-[17%]" />

            <div className="absolute right-[18%] top-[30%] grid h-28 w-28 place-items-center rounded-xl bg-charcoal shadow-premium md:h-36 md:w-36">
              <div className="h-16 w-20 rounded-sm border-4 border-mutedGold bg-[#1b1b1b] md:h-20 md:w-24">
                <div className="mt-5 h-4 bg-mutedGold" />
              </div>
            </div>
            <div className="absolute left-[16%] top-[14%] grid h-20 w-24 place-items-center rounded-t-full bg-mutedGold/30 text-mutedGold">
              <div className="h-14 w-14 rounded-t-full border-4 border-mutedGold/80" />
            </div>

            <div className="absolute bottom-12 left-6 w-56 rounded-2xl border border-sand bg-white/92 p-5 shadow-premium backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emeraldMain">
                <CheckCircle2 size={17} />
                Barokah Score
              </div>
              <div className="font-display text-4xl font-bold text-emeraldMain">
                4.8<span className="text-lg text-charcoal"> / 5</span>
              </div>
              <div className="mt-2 text-xl text-mutedGold">★★★★★</div>
              <p className="mt-3 text-xs leading-5 text-charcoal/65">
                Berdasarkan ulasan jamaah & mitra terpercaya.
              </p>
            </div>

            <div className="absolute bottom-[28%] right-6 w-64 rounded-2xl bg-emeraldMain p-5 text-white shadow-premium">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">Rute Makkah - Masjidil Haram</p>
                  <p className="mt-1 text-sm text-white/78">12 km • 25 Menit</p>
                </div>
                <ArrowRight size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
