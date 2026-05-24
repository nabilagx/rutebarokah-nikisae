import React from "react";
import { Building2, Landmark, TrendingUp, UsersRound } from "lucide-react";

const stats = [
  [Building2, "1.250+", "UMKM Terbantu"],
  [UsersRound, "85.340+", "Jamaah Dilayani"],
  [TrendingUp, "Rp 24,8 M+", "Transaksi Lokal"],
  [Landmark, "120+", "Komunitas & Travel Mitra"],
];

export default function ImpactTracker() {
  return (
    <section className="container-rb py-10">
      <div className="relative overflow-hidden rounded-[2.2rem] bg-emeraldMain p-7 text-white shadow-premium md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_40%,rgba(207,166,74,.32),transparent_18rem)]" />
        <div className="absolute bottom-0 right-0 h-52 w-96 bg-islamic-grid opacity-30" />
        <div className="relative">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedGold">
                Impact Tracker
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
                Dampak nyata untuk ekonomi umat
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/68">
              Dashboard ringkas untuk melihat pertumbuhan layanan, transaksi lokal, dan jejaring komunitas.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(([Icon, number, label]) => (
              <div
                key={label}
                className="rounded-[1.5rem] border border-white/12 bg-white/8 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/12"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-mutedGold/18 text-mutedGold">
                  <Icon size={27} />
                </div>
                <p className="font-display text-3xl font-bold text-mutedGold">{number}</p>
                <p className="mt-1 text-sm font-semibold text-white/88">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
