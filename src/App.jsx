import React, { useMemo, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import RouteSearch from "./components/RouteSearch.jsx";
import CategoryFilter from "./components/CategoryFilter.jsx";
import UMKMCard from "./components/UMKMCard.jsx";
import UMKMModal from "./components/UMKMModal.jsx";
import BarokahScore from "./components/BarokahScore.jsx";
import ImpactTracker from "./components/ImpactTracker.jsx";
import Footer from "./components/Footer.jsx";
import { umkmData } from "./data/umkmData.js";
import { CheckCircle2, X } from "lucide-react";

function SoonModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[2rem] border border-mutedGold/30 bg-ivory p-7 shadow-premium">
        <button
          type="button"
          aria-label="Tutup modal"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-sand bg-white/80 p-2 text-emeraldMain transition hover:bg-sand/50"
        >
          <X size={18} />
        </button>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emeraldMain text-mutedGold shadow-soft">
          <CheckCircle2 />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mutedGold">
          RuteBarokah
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-emeraldMain">
          Fitur Segera Hadir
        </h2>
        <p className="mt-3 leading-relaxed text-charcoal/75">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-2xl bg-emeraldMain px-5 py-3 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#094b3a]"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
}

function Toast({ show }) {
  if (!show) return null;

  return (
    <div className="toast-enter fixed bottom-5 left-1/2 z-40 w-[calc(100%-32px)] max-w-lg -translate-x-1/2 rounded-2xl border border-tealSecondary/25 bg-white px-5 py-4 text-sm font-semibold text-emeraldMain shadow-premium">
      Rekomendasi UMKM terbaik untuk rute Anda telah ditemukan.
    </div>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [selectedUmkm, setSelectedUmkm] = useState(null);
  const [soonMessage, setSoonMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const filteredUmkm = useMemo(() => {
    if (activeCategory === "Semua") return umkmData;
    return umkmData.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const handleSearch = () => {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2800);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-ivory text-charcoal">
      <Navbar onSoon={setSoonMessage} />
      <main>
        <Hero onSoon={setSoonMessage} />
        <RouteSearch onSearch={handleSearch} />
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
        <section id="umkm" className="container-rb py-14 md:py-18">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedGold">
                UMKM Pilihan
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-emeraldMain md:text-4xl">
                UMKM Pilihan di Rute Anda
              </h2>
              <p className="mt-2 max-w-2xl text-charcoal/70">
                Mitra lokal terpercaya dengan layanan terbaik untuk jamaah.
              </p>
            </div>
            <a
              href="#kategori"
              className="text-sm font-semibold text-emeraldMain underline-offset-4 hover:underline"
            >
              Lihat semua kategori
            </a>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUmkm.map((item) => (
              <UMKMCard
                key={item.id}
                item={item}
                onDetail={() => setSelectedUmkm(item)}
              />
            ))}
          </div>
        </section>
        <BarokahScore />
        <ImpactTracker />
        <section id="komunitas" className="container-rb py-14">
          <div className="rounded-[2rem] border border-sand/70 bg-white/60 p-6 shadow-soft md:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedGold">
              Komunitas & Mitra
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                "Travel Umrah",
                "KBIH",
                "Masjid Komunitas",
                "UMKM Lokal",
                "Komunitas Jamaah",
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-emeraldMain/15 bg-ivory px-5 py-3 text-sm font-semibold text-emeraldMain"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>
        <section className="container-rb pb-16 pt-4">
          <div className="relative overflow-hidden rounded-[2.3rem] bg-emeraldMain p-7 text-white shadow-premium md:p-12">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-mutedGold/25" />
            <div className="absolute bottom-0 right-8 hidden h-28 w-56 bg-islamic-grid opacity-40 md:block" />
            <div className="relative max-w-3xl">
              <h2 className="font-display text-3xl font-bold md:text-5xl">
                Bawa UMKM lokal masuk ke ekosistem perjalanan ibadah.
              </h2>
              <p className="mt-4 text-white/78 md:text-lg">
                RuteBarokah membantu jamaah menemukan layanan terpercaya sekaligus membuka akses pasar bagi UMKM lokal.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSoonMessage("Pendaftaran UMKM akan segera dibuka.")}
                  className="rounded-2xl bg-mutedGold px-6 py-3 font-bold text-emeraldMain transition hover:-translate-y-0.5 hover:bg-[#d9b75e]"
                >
                  Daftarkan UMKM
                </button>
                <a
                  href="#rute"
                  className="rounded-2xl border border-white/35 px-6 py-3 text-center font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Jelajahi Rute
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <UMKMModal
        item={selectedUmkm}
        onClose={() => setSelectedUmkm(null)}
        onContact={() => setSoonMessage("Fitur hubungi mitra akan segera hadir.")}
      />
      <SoonModal message={soonMessage} onClose={() => setSoonMessage("")} />
      <Toast show={showToast} />
    </div>
  );
}
