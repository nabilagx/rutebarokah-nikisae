import React from "react";
import { CheckCircle2, MapPin, Star, X } from "lucide-react";

export default function UMKMModal({ item, onClose, onContact }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-charcoal/55 px-4 py-8 backdrop-blur-sm">
      <article className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-ivory shadow-premium">
        <button
          type="button"
          aria-label="Tutup detail UMKM"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full bg-white/85 p-2 text-emeraldMain shadow-soft transition hover:bg-sand"
        >
          <X size={19} />
        </button>
        <div className="h-44" style={{ background: item.image }}>
          <div className="h-full bg-[linear-gradient(110deg,rgba(13,91,71,.2),rgba(31,31,31,.35))]" />
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emeraldMain">
                {item.category}
              </span>
              <h2 className="mt-3 font-display text-4xl font-bold text-emeraldMain">
                {item.name}
              </h2>
              <p className="mt-2 flex items-center gap-1 text-charcoal/65">
                <MapPin size={16} />
                {item.location}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="flex items-center gap-1 text-sm font-bold text-emeraldMain">
                <Star size={15} fill="currentColor" className="text-mutedGold" />
                Rating {item.rating}
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-emeraldMain">
                {item.score}
                <span className="text-sm text-charcoal/55"> / 100</span>
              </p>
              <p className="text-xs font-semibold text-mutedGold">Barokah Score</p>
            </div>
          </div>
          <p className="mt-6 leading-8 text-charcoal/72">{item.description}</p>
          <div className="mt-6">
            <h3 className="font-bold text-emeraldMain">Layanan</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {item.services.map((service) => (
                <span
                  key={service}
                  className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-charcoal/72"
                >
                  <CheckCircle2 size={16} className="text-tealSecondary" />
                  {service}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onContact}
            className="mt-7 w-full rounded-2xl bg-emeraldMain px-6 py-3.5 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#094b3a]"
          >
            Hubungi Mitra
          </button>
        </div>
      </article>
    </div>
  );
}
