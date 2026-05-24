import React, { useState } from "react";
import { Menu, X, Compass, Globe2 } from "lucide-react";

const navItems = [
  ["Beranda", "#beranda"],
  ["Jelajahi Rute", "#rute"],
  ["UMKM", "#umkm"],
  ["Komunitas", "#komunitas"],
  ["Manasik", "#barokah-score"],
  ["Artikel", "#footer"],
];

export default function Navbar({ onSoon }) {
  const [open, setOpen] = useState(false);

  const action = (label) => {
    onSoon(`${label} RuteBarokah sedang disiapkan untuk jamaah dan mitra.`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-ivory/88 backdrop-blur-xl">
      <nav className="container-rb flex h-20 items-center justify-between">
        <a href="#beranda" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emeraldMain text-mutedGold shadow-soft">
            <Compass size={24} />
          </span>
          <span className="font-display text-2xl font-bold text-emeraldMain">
            RuteBarokah
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-sm font-semibold text-charcoal/75 transition hover:text-emeraldMain"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={() => action("Masuk")}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand/50"
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => action("Daftar")}
            className="rounded-full bg-emeraldMain px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#094b3a]"
          >
            Daftar
          </button>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-sand text-emeraldMain">
            <Globe2 size={18} />
          </span>
        </div>

        <button
          type="button"
          aria-label="Buka menu"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-sand bg-white/70 p-3 text-emeraldMain lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="container-rb pb-5 lg:hidden">
          <div className="rounded-[1.5rem] border border-sand bg-white p-4 shadow-soft">
            <div className="grid gap-1">
              {navItems.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 font-semibold text-charcoal/75 hover:bg-ivory hover:text-emeraldMain"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => action("Masuk")}
                className="rounded-2xl border border-sand py-3 font-semibold text-emeraldMain"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => action("Daftar")}
                className="rounded-2xl bg-emeraldMain py-3 font-bold text-white"
              >
                Daftar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
