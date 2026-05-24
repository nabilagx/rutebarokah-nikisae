import React from "react";
import { Compass } from "lucide-react";

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-sand/70 bg-[#f1eadc]">
      <div className="container-rb grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <a href="#beranda" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emeraldMain text-mutedGold">
              <Compass />
            </span>
            <span className="font-display text-2xl font-bold text-emeraldMain">
              RuteBarokah
            </span>
          </a>
          <p className="mt-4 max-w-md leading-7 text-charcoal/68">
            Peta digital UMKM pendukung perjalanan haji & umrah yang menghubungkan jamaah, komunitas, dan mitra lokal terpercaya.
          </p>
          <p className="mt-5 font-display text-2xl font-bold italic text-emeraldMain">
            Jalan ibadah lebih mudah, berkah untuk semua.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-emeraldMain">Menu Cepat</h3>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-charcoal/68">
            {["Beranda", "Jelajahi Rute", "UMKM", "Komunitas", "Manasik", "Artikel"].map((item) => (
              <a key={item} href={item === "Beranda" ? "#beranda" : "#rute"} className="hover:text-emeraldMain">
                {item}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-emeraldMain">Kontak Dummy</h3>
          <div className="mt-4 grid gap-3 text-sm text-charcoal/68">
            <p>halo@rutebarokah.id</p>
            <p>+62 812 0000 1445</p>
            <p>Jakarta, Indonesia</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
