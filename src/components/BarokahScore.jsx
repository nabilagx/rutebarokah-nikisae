import React from "react";
import { BadgeCheck, Clock3, HeartHandshake, ShieldCheck, Star, WalletCards } from "lucide-react";

const criteria = [
  [ShieldCheck, "Terverifikasi"],
  [WalletCards, "Harga Wajar"],
  [Star, "Ulasan Jamaah"],
  [Clock3, "Kesiapan Rombongan"],
  [HeartHandshake, "Dampak UMKM Lokal"],
];

export default function BarokahScore() {
  return (
    <section id="barokah-score" className="container-rb py-14">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-sand bg-white p-7 shadow-soft md:p-9">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emeraldMain text-mutedGold shadow-soft">
            <BadgeCheck size={30} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedGold">
            Barokah Score
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-emeraldMain md:text-5xl">
            Ukuran kepercayaan untuk perjalanan ibadah.
          </h2>
          <p className="mt-5 leading-8 text-charcoal/72">
            Barokah Score membantu jamaah dan travel memilih mitra UMKM berdasarkan verifikasi, kualitas layanan, ulasan jamaah, ketepatan waktu, dan dampak sosial.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {criteria.map(([Icon, label], index) => (
            <div
              key={label}
              className={`rounded-[1.5rem] border p-5 shadow-soft ${
                index === 4
                  ? "border-emeraldMain/20 bg-emeraldMain text-white sm:col-span-2"
                  : "border-sand bg-white/72 text-emeraldMain"
              }`}
            >
              <div
                className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${
                  index === 4 ? "bg-white/15 text-mutedGold" : "bg-ivory"
                }`}
              >
                <Icon />
              </div>
              <h3 className="text-lg font-bold">{label}</h3>
              <p className={`mt-2 text-sm leading-6 ${index === 4 ? "text-white/72" : "text-charcoal/62"}`}>
                Dinilai dari data layanan, kesiapan mitra, dan pengalaman jamaah.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
