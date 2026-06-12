import React from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Handshake,
  Map,
  Megaphone,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Star,
  Store,
  Tags,
  WalletCards,
} from "lucide-react";

const challenges = [
  [MessageCircle, "Tersebar di Mana-Mana", "Vendor masih tersebar di WhatsApp, Instagram, Google Maps, dan rekomendasi personal."],
  [Map, "Sulit Menemukan yang Sesuai", "Travel/KBIH sulit menemukan vendor sesuai lokasi, kapasitas, dan kebutuhan ibadah."],
  [BarChart3, "UMKM Sulit Berkembang", "UMKM lokal halal sulit masuk ke pasar haji-umrah secara berkelanjutan."],
];

const solutions = [
  [Map, "Rekomendasi Berbasis Rute", "Temukan vendor halal berdasarkan lokasi dan rute perjalanan ibadah."],
  [ShieldCheck, "UMKM Terkurasi", "Setiap vendor melalui proses seleksi dan validasi admin."],
  [Star, "Barokah Score", "Sistem penilaian transparan untuk membantu memilih vendor terpercaya."],
];

const business = [
  [Tags, "Free Listing", "Daftarkan UMKM Anda tanpa biaya awal."],
  [WalletCards, "Pay per Lead", "Bayar hanya saat mendapatkan lead nyata."],
  [Handshake, "Success Fee", "Komisi kecil dari transaksi berhasil."],
  [Megaphone, "Campaign Package", "Paket promosi musiman Ramadan dan umrah."],
  [Rocket, "Premium Boost", "Tampil lebih menonjol di hasil pencarian."],
];

export default function LandingSections({ featuredSlot = null }) {
  return (
    <>
      <InfoSection title="Tantangan yang Sering Dihadapi" subtitle="Mencari vendor halal untuk kegiatan ibadah masih penuh hambatan dan ketidakpastian." items={challenges} />
      <section className="section-shell rounded-[20px] bg-[#F4F8EF] px-6 py-7 shadow-soft md:px-10">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold text-[#064E3B]">Solusi RuteBarokah</h2>
          <p className="mt-2 text-[#1F2937]/70">Satu platform kurasi yang menghubungkan kebutuhan ibadah dengan UMKM halal terpercaya.</p>
        </div>
        <div className="mt-7 grid gap-6 md:grid-cols-3">
          {solutions.map(([Icon, title, desc]) => (
            <Feature key={title} icon={Icon} title={title} desc={desc} />
          ))}
        </div>
      </section>
      {featuredSlot}
      <BarokahScoreSection />
      <section className="section-shell pb-10">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold text-[#064E3B]">Model Bisnis</h2>
          <p className="mt-1 text-[#1F2937]/65">Bergabung gratis, berkembang bersama ekosistem haji-umrah Indonesia</p>
        </div>
        <div className="mt-5 grid overflow-hidden rounded-[20px] border border-[#064E3B]/10 bg-white shadow-soft sm:grid-cols-2 lg:grid-cols-5">
          {business.map(([Icon, title, desc]) => (
            <div key={title} className="border-b border-[#064E3B]/10 p-6 text-center last:border-b-0 sm:border-r lg:border-b-0">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ECFDF5] text-[#0B7A55]">
                <Icon size={30} />
              </span>
              <h3 className="mt-3 font-bold text-[#064E3B]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#1F2937]/65">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <ImpactAndCta />
    </>
  );
}

function BarokahScoreSection() {
  const scoreItems = [
    "Verifikasi admin dan kelengkapan profil",
    "Kualitas layanan dan ketepatan respon",
    "Kapasitas melayani rombongan jamaah",
    "Harga wajar dan transparan",
    "Dampak untuk UMKM lokal halal",
  ];

  return (
    <section className="section-shell py-12">
      <div className="grid gap-6 rounded-[24px] bg-[#064E3B] p-7 text-white shadow-premium md:grid-cols-[0.85fr_1.15fr] md:p-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">Barokah Score</p>
          <h2 className="mt-3 font-display text-4xl font-bold">Skor kepercayaan untuk memilih vendor halal.</h2>
          <p className="mt-4 leading-7 text-white/75">
            Barokah Score membantu jamaah, travel, dan KBIH menilai UMKM berdasarkan kurasi, kualitas layanan, kesiapan rombongan, dan dampak sosial.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {scoreItems.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/9 p-4">
              <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-[#D6A84F]" />
              <span className="text-sm font-semibold leading-6 text-white/86">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoSection({ title, subtitle, items }) {
  return (
    <section className="section-shell py-12">
      <div className="text-center">
        <h2 className="font-display text-4xl font-bold text-[#064E3B]">{title}</h2>
        <p className="mt-2 text-[#1F2937]/65">{subtitle}</p>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {items.map(([Icon, itemTitle, desc]) => (
          <div key={itemTitle} className="flex gap-5 rounded-xl border border-[#064E3B]/10 bg-white p-6 shadow-soft">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#F0F5EB] text-[#0B7A55]">
              <Icon size={36} />
            </span>
            <div>
              <h3 className="font-bold text-[#064E3B]">{itemTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-[#1F2937]/65">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-5">
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#064E3B] text-[#D6A84F] shadow-soft">
        <Icon size={36} />
      </span>
      <div>
        <h3 className="font-bold text-[#064E3B]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#1F2937]/68">{desc}</p>
      </div>
    </div>
  );
}

function ImpactAndCta() {
  const bullets = [
    "Visibilitas digital UMKM meningkat signifikan",
    "Akses ke ribuan travel, KBIH, dan komunitas jamaah",
    "Lead berkualitas dari kegiatan ibadah nyata",
    "Kredibilitas terbangun melalui Barokah Score",
  ];

  return (
    <>
      <section className="section-shell grid gap-8 border-t border-[#064E3B]/10 py-10 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#064E3B]">Dampak Nyata untuk UMKM Halal</h2>
          <p className="mt-3 leading-7 text-[#1F2937]/68">
            RuteBarokah bukan sekadar direktori, kami membangun ekosistem yang berkelanjutan untuk UMKM halal Indonesia agar dapat tumbuh bersama pertumbuhan industri haji dan umrah.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {bullets.map((item) => (
            <p key={item} className="flex items-start gap-3 font-semibold text-[#064E3B]">
              <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[#0B7A55]" fill="currentColor" />
              {item}
            </p>
          ))}
        </div>
      </section>
      <section className="section-shell pb-12">
        <div className="grid overflow-hidden rounded-[24px] bg-[#064E3B] text-white shadow-premium md:grid-cols-[220px_1fr_260px]">
          <div className="grid min-h-44 place-items-center bg-[#075F49] p-6 islamic-grid">
            <div className="grid h-28 w-28 place-items-center rounded-[28px] border-4 border-[#D6A84F] text-[#D6A84F]">
              <Store size={52} />
            </div>
          </div>
          <div className="p-7 md:p-9">
            <h2 className="font-display text-4xl font-bold">Mulai Sekarang, Gratis</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/78">
              Bergabunglah dengan ratusan UMKM halal yang sudah terdaftar dan ribuan pengguna yang mencari vendor terpercaya.
            </p>
          </div>
          <div className="grid gap-3 p-7 md:p-9">
            <Link href="/vendors" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6A84F] px-6 py-3 font-bold text-[#064E3B]">
              <SearchIcon /> Cari Vendor
            </Link>
            <Link href="/join-umkm" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#064E3B]">
              <Store size={18} /> Daftarkan UMKM
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SearchIcon() {
  return <span className="h-4 w-4 rounded-full border-2 border-current before:block before:h-2 before:w-0.5 before:translate-x-3 before:translate-y-3 before:rotate-[-45deg] before:bg-current" />;
}
