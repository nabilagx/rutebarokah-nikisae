import React from "react";
import { CheckCircle2, MapPin, Star } from "lucide-react";

export default function UMKMCard({ item, onDetail }) {
  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-sand/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-premium">
      <div className="relative h-48 overflow-hidden" style={{ background: item.image }}>
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.24),transparent_45%,rgba(0,0,0,.22))]" />
        <span className="absolute left-4 top-4 rounded-full bg-ivory px-3 py-1 text-xs font-bold text-emeraldMain">
          {item.category}
        </span>
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emeraldMain px-3 py-1 text-xs font-bold text-white">
          <Star size={13} fill="currentColor" className="text-mutedGold" />
          {item.rating}
        </span>
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div className="grid h-20 w-24 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
            <div className="h-12 w-16 rounded-md border-4 border-mutedGold bg-charcoal">
              <div className="mt-4 h-2 bg-mutedGold" />
            </div>
          </div>
          <div className="h-14 w-14 rounded-full border border-white/40 bg-white/20" />
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-2xl font-bold text-emeraldMain">{item.name}</h3>
        <p className="mt-2 flex items-center gap-1 text-sm text-charcoal/62">
          <MapPin size={15} />
          {item.location}
        </p>
        <p className="mt-3 min-h-[48px] text-sm leading-6 text-charcoal/70">
          {item.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-ivory px-3 py-1 text-xs font-semibold text-emeraldMain"
            >
              <CheckCircle2 size={13} />
              {tag}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onDetail}
          className="mt-5 w-full rounded-2xl border border-emeraldMain/18 bg-emeraldMain px-5 py-3 font-bold text-white transition hover:bg-[#094b3a]"
        >
          Lihat Detail
        </button>
      </div>
    </article>
  );
}
