import React from "react";
import {
  BookOpen,
  Bus,
  Camera,
  CookingPot,
  PackageCheck,
  Shirt,
  Sparkles,
} from "lucide-react";
import { categories } from "../data/umkmData.js";

const icons = {
  Semua: Sparkles,
  Perlengkapan: PackageCheck,
  Katering: CookingPot,
  Laundry: Shirt,
  Transportasi: Bus,
  Dokumentasi: Camera,
  Manasik: BookOpen,
};

export default function CategoryFilter({ active, onChange }) {
  return (
    <section id="kategori" className="container-rb py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedGold">
            Kategori Kebutuhan
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-emeraldMain">
            Pilih layanan untuk rute Anda
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {categories.map((category) => {
          const Icon = icons[category];
          const isActive = active === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={`group min-h-[126px] rounded-3xl border p-4 text-center shadow-soft transition hover:-translate-y-1 ${
                isActive
                  ? "border-emeraldMain bg-emeraldMain text-white"
                  : "border-sand bg-white/72 text-emeraldMain hover:border-tealSecondary"
              }`}
            >
              <span
                className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl ${
                  isActive ? "bg-white/15" : "bg-ivory"
                }`}
              >
                <Icon size={24} />
              </span>
              <span className="block text-sm font-bold">{category}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
