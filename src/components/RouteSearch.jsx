import React from "react";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";

export default function RouteSearch({ onSearch }) {
  return (
    <section id="rute" className="container-rb -mt-2 py-8 md:py-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-emeraldMain p-6 text-white shadow-premium md:p-9">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -left-16 top-5 h-52 w-52 rounded-full border border-mutedGold" />
          <div className="absolute bottom-0 right-8 h-40 w-72 bg-islamic-grid" />
        </div>
        <div className="relative">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-bold">Pilih Rute Jamaah</h2>
            <p className="mt-2 text-sm text-white/72">
              Temukan layanan & UMKM terbaik di sepanjang rute perjalanan Anda.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Field icon={MapPin} label="Dari" as="select">
              {["Jeddah (KSA)", "Jakarta", "Surabaya", "Jember"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Field>
            <Field icon={MapPin} label="Ke" as="select">
              {["Makkah", "Madinah", "Hotel", "Bandara"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Field>
            <Field icon={CalendarDays} label="Tanggal Berangkat" type="date" />
            <Field icon={Users} label="Jumlah Jamaah" type="number" defaultValue="2" />
            <button
              type="button"
              onClick={onSearch}
              className="inline-flex min-h-[64px] items-center justify-center gap-2 rounded-2xl bg-mutedGold px-7 font-bold text-emeraldMain shadow-soft transition hover:-translate-y-0.5 hover:bg-[#d9b75e]"
            >
              <Search size={18} />
              Cari Rute
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ icon: Icon, label, as, children, type = "text", defaultValue }) {
  const common =
    "mt-1 w-full bg-transparent text-sm font-bold text-charcoal outline-none";

  return (
    <label className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-white px-4 text-charcoal shadow-soft">
      <Icon size={20} className="shrink-0 text-emeraldMain" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-charcoal/55">{label}</span>
        {as === "select" ? (
          <select className={common}>{children}</select>
        ) : (
          <input className={common} type={type} defaultValue={defaultValue} />
        )}
      </span>
    </label>
  );
}
