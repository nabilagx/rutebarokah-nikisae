import React from "react";
import Link from "next/link";
import {
  Award,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";

const HERO_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Al_Qibla.jpg/960px-Al_Qibla.jpg";

const stats = [
  [UsersRound, "50+", "Target UMKM Validasi"],
  [Award, "MVP", "Barokah Score System"],
  [Store, "3", "Segmen Buyer Utama"],
];

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#064E3B]/10 bg-[#FFF8E7]">
      <div className="absolute inset-y-0 left-0 w-40 ornament-bg opacity-70" />
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-white to-transparent" />
      <div className="section-shell relative grid min-h-[560px] items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
        <div className="relative z-10">
          <h1 className="font-display text-[42px] font-bold leading-[1.05] text-[#064E3B] md:text-[64px]">
            Temukan UMKM Halal Tepercaya di Setiap Rute Ibadah
          </h1>
          <p className="mt-4 text-xl font-bold text-[#B8871F]">
            Platform kurasi dan matching vendor halal untuk ekosistem haji & umrah.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#1F2937]/75">
            RuteBarokah membantu travel, KBIH, komunitas masjid, keluarga jamaah, dan jamaah menemukan vendor konsumsi halal dan layanan pendukung haji-umrah secara lebih mudah, relevan, dan terkurasi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/vendors"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#064E3B] px-7 py-4 font-bold text-white shadow-premium transition hover:-translate-y-0.5 hover:bg-[#043c2e]"
            >
              <Search size={20} />
              Cari Vendor Halal
            </Link>
            <Link
              href="/join-umkm"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#064E3B]/15 bg-white px-7 py-4 font-bold text-[#064E3B] shadow-soft transition hover:-translate-y-0.5 hover:bg-[#ECFDF5]"
            >
              <Store size={20} />
              Daftarkan UMKM
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map(([Icon, number, label]) => (
              <div key={label} className="flex items-center gap-4 rounded-xl border border-[#064E3B]/10 bg-white p-4 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ECFDF5] text-[#064E3B]">
                  <Icon size={25} />
                </span>
                <span>
                  <strong className="block text-3xl font-black text-[#064E3B]">{number}</strong>
                  <span className="text-xs font-semibold text-[#1F2937]/65">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <HeroPhoto />
      </div>
    </section>
  );
}

function HeroPhoto() {
  return (
    <div className="relative min-h-[430px] lg:min-h-[520px]">
      <div className="absolute inset-x-0 bottom-0 h-40 rounded-[50%] bg-[#D8E7D5]" />
      <div className="absolute inset-x-4 top-4 overflow-hidden rounded-[34px] border border-[#D6A84F]/25 bg-white p-2 shadow-premium md:inset-x-8">
        <div className="relative h-[330px] overflow-hidden rounded-[26px] md:h-[430px]">
          <img
            src={HERO_IMAGE}
            alt="Jamaah mengelilingi Ka'bah di Masjidil Haram"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,231,.85)_0%,rgba(255,248,231,.25)_34%,rgba(6,78,59,.1)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#064E3B]/72 to-transparent" />
        </div>
      </div>

      <div className="absolute right-0 top-3 z-30 hidden rounded-[22px] border-4 border-[#D6A84F] bg-[#064E3B] px-5 py-5 text-center text-[#D6A84F] shadow-premium md:block">
        <ShieldCheck className="mx-auto mb-2" size={38} />
        <p className="text-sm font-black leading-4">HALAL<br />TERPERCAYA</p>
      </div>

      <div className="absolute bottom-20 left-0 z-30 w-64 rounded-[20px] border border-[#064E3B]/10 bg-white/95 p-4 shadow-premium backdrop-blur">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#064E3B]">
          <Award size={18} className="text-[#D6A84F]" />
          Barokah Score
        </div>
        <div className="flex items-end gap-2">
          <strong className="font-display text-5xl leading-none text-[#064E3B]">MVP</strong>
          <span className="pb-1 text-sm font-bold text-[#1F2937]/60">beta</span>
        </div>
        <div className="mt-2 text-[#D6A84F]">★★★★★</div>
        <p className="mt-2 text-xs leading-5 text-[#1F2937]/60">
          Sistem skor berbasis kurasi, data layanan, kapasitas, dan respon mitra.
        </p>
      </div>

      <div className="absolute bottom-12 right-6 z-30 w-72 rounded-[20px] bg-[#064E3B] p-5 text-white shadow-premium">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D6A84F]">
          Rekomendasi Rute
        </p>
        <p className="mt-2 font-black">Makkah • Katering Rombongan</p>
        <p className="mt-1 text-sm text-white/70">12 vendor siap melayani 50-300 pax</p>
      </div>

      <div className="absolute left-[38%] top-[28%] z-30 hidden md:block">
        <RouteOverlay />
      </div>

      <a
        href="https://commons.wikimedia.org/wiki/File:Al_Qibla.jpg"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-10 z-30 text-[10px] font-semibold text-white/72 underline-offset-2 hover:underline"
      >
        Foto: Cagritasarim / Wikimedia Commons
      </a>
    </div>
  );
}

function RouteOverlay() {
  return (
    <div className="relative h-48 w-64">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 260 190" fill="none">
        <path
          d="M22 132 C72 70 92 152 138 96 S208 52 235 92"
          stroke="#D6A84F"
          strokeWidth="5"
          className="route-dash"
          strokeLinecap="round"
        />
      </svg>
      <Pin className="left-3 top-28" />
      <Pin className="left-[49%] top-20" gold />
      <Pin className="right-3 top-16" />
    </div>
  );
}

function Pin({ className, gold }) {
  return (
    <span className={`absolute grid h-10 w-10 place-items-center rounded-full ${gold ? "bg-[#D6A84F]" : "bg-[#0B7A55]"} text-white shadow-premium ring-4 ring-white/80 ${className}`}>
      <MapPin size={19} fill="currentColor" strokeWidth={1.5} />
    </span>
  );
}
