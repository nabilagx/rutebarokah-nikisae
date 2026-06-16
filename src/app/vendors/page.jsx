"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, MapPin, Search, SlidersHorizontal, Store, UsersRound, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import VendorCard from "@/components/mvp/VendorCard.jsx";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import EmptyState from "@/components/mvp/EmptyState.jsx";

const HERO_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Al_Qibla.jpg/1280px-Al_Qibla.jpg";
const capacityOptions = ["Semua Kapasitas", "10 - 50 pax", "51 - 100 pax", "101 - 300 pax", "300+ pax"];

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("Semua Kapasitas");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVendors() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("umkm_profiles")
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("barokah_score", { ascending: false });

      if (fetchError) setError(fetchError.message);
      setVendors(data || []);
      setLoading(false);
    }

    loadVendors();
  }, []);

  const categoryOptions = useMemo(() => getCountOptions(vendors, "category"), [vendors]);
  const locationOptions = useMemo(() => getCountOptions(vendors, "location"), [vendors]);
  const subcategoryOptions = useMemo(() => getCountOptions(vendors, "subcategory"), [vendors]);

  const filtered = useMemo(() => {
    return vendors.filter((vendor) => {
      const text = `${vendor.business_name || ""} ${vendor.category || ""} ${vendor.subcategory || ""} ${vendor.location || ""}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchCategory = category ? vendor.category === category : true;
      const matchSubcategory = subcategory ? vendor.subcategory === subcategory : true;
      const matchLocation = location ? vendor.location === location : true;
      const max = Number(vendor.capacity_max || 0);
      const matchCapacity =
        capacity === "Semua Kapasitas" ||
        (capacity === "10 - 50 pax" && max <= 50) ||
        (capacity === "51 - 100 pax" && max > 50 && max <= 100) ||
        (capacity === "101 - 300 pax" && max > 100 && max <= 300) ||
        (capacity === "300+ pax" && max > 300);
      return matchSearch && matchCategory && matchSubcategory && matchLocation && matchCapacity;
    });
  }, [vendors, search, category, subcategory, location, capacity]);

  const activeFilters = [
    search ? { key: "search", label: `Pencarian: ${search}`, clear: () => setSearch("") } : null,
    location ? { key: "location", label: `Lokasi: ${location}`, clear: () => setLocation("") } : null,
    category ? { key: "category", label: `Kategori: ${category}`, clear: () => setCategory("") } : null,
    subcategory ? { key: "subcategory", label: `Subkategori: ${subcategory}`, clear: () => setSubcategory("") } : null,
    capacity !== "Semua Kapasitas" ? { key: "capacity", label: `Kapasitas: ${capacity}`, clear: () => setCapacity("Semua Kapasitas") } : null,
  ].filter(Boolean);

  function resetFilters() {
    setSearch("");
    setCategory("");
    setSubcategory("");
    setLocation("");
    setCapacity("Semua Kapasitas");
  }

  return (
    <main className="bg-white">
      <CatalogHero
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        location={location}
        setLocation={setLocation}
        categoryOptions={categoryOptions}
        locationOptions={locationOptions}
      />

      <section className="section-shell grid gap-7 py-10 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-[18px] border border-[#064E3B]/10 bg-white p-4 shadow-soft lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-[#064E3B]/10 pb-4">
            <h2 className="text-xl font-black text-[#1F2937]">Filter Pencarian</h2>
            <SlidersHorizontal size={18} className="text-[#08734F]" />
          </div>
          <FilterGroup title="Lokasi">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari vendor, lokasi, kategori..."
              className="field rounded-xl py-3 text-sm"
            />
            {locationOptions.length ? locationOptions.map((item) => (
              <CheckRow key={item.value} label={`${item.value} (${item.count})`} checked={location === item.value} onChange={() => setLocation(location === item.value ? "" : item.value)} />
            )) : <SmallEmpty text="Belum ada lokasi approved." />}
          </FilterGroup>
          <FilterGroup title="Kategori">
            {categoryOptions.length ? categoryOptions.map((item) => (
              <CheckRow key={item.value} label={`${item.value} (${item.count})`} checked={category === item.value} onChange={() => setCategory(category === item.value ? "" : item.value)} />
            )) : <SmallEmpty text="Belum ada kategori approved." />}
          </FilterGroup>
          {!!subcategoryOptions.length && (
            <FilterGroup title="Subkategori">
              {subcategoryOptions.map((item) => (
                <CheckRow key={item.value} label={`${item.value} (${item.count})`} checked={subcategory === item.value} onChange={() => setSubcategory(subcategory === item.value ? "" : item.value)} />
              ))}
            </FilterGroup>
          )}
          <FilterGroup title="Kapasitas" withMore={false}>
            {capacityOptions.map((item) => (
              <RadioRow key={item} label={item} checked={capacity === item} onChange={() => setCapacity(item)} />
            ))}
          </FilterGroup>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-[#064E3B]/12 px-4 py-3 font-bold text-[#1F2937]/72"
            >
              Reset
            </button>
            <a href="#catalog-grid" className="rounded-xl bg-[#08734F] px-4 py-3 text-center font-bold text-white">
              Terapkan
            </a>
          </div>
        </aside>

        <div id="catalog-grid">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-[#1F2937]/70">
              Menampilkan <strong className="text-[#064E3B]">{filtered.length}</strong> dari <strong className="text-[#064E3B]">{vendors.length}</strong> vendor
            </p>
            <select className="field w-full rounded-xl py-3 text-sm md:w-48">
              <option>Urutkan: Terbaru</option>
              <option>Barokah Score Tertinggi</option>
              <option>Harga Terendah</option>
            </select>
          </div>

          {!!activeFilters.length && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={filter.clear}
                  className="inline-flex items-center gap-2 rounded-full border border-[#064E3B]/15 bg-[#ECFDF5] px-3 py-2 text-xs font-black text-[#064E3B]"
                >
                  {filter.label} <X size={14} />
                </button>
              ))}
              <button type="button" onClick={resetFilters} className="rounded-full bg-[#064E3B] px-3 py-2 text-xs font-black text-white">
                Reset Filter
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : filtered.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada UMKM yang sesuai"
              description="Belum ada UMKM yang sesuai. Coba ubah lokasi atau kategori."
            />
          )}
        </div>
      </section>

      <section className="section-shell pb-12">
        <div className="flex flex-col gap-5 rounded-[18px] border border-[#064E3B]/10 bg-[#F1F8F3] p-7 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-[#08734F]">
              <Store size={34} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-[#064E3B]">UMKM Halal? Bergabung Sekarang!</h2>
              <p className="mt-1 text-[#1F2937]/68">Daftarkan usaha Anda secara gratis dan dapatkan peluang dari ekosistem haji-umrah.</p>
            </div>
          </div>
          <Link href="/join-umkm" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#08734F] px-7 py-4 font-bold text-white">
            Daftarkan UMKM <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function CatalogHero({ search, setSearch, category, setCategory, location, setLocation, categoryOptions, locationOptions }) {
  return (
    <section className="relative overflow-hidden bg-[#EEF6F0]">
      <div className="absolute inset-0">
        <img src={HERO_IMAGE} alt="Ka'bah dan jamaah di Masjidil Haram" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#F8FBF7_0%,rgba(248,251,247,.92)_36%,rgba(248,251,247,.35)_70%,rgba(248,251,247,.08)_100%)]" />
      </div>
      <div className="section-shell relative py-12 md:py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black leading-tight text-[#063D2E] md:text-5xl">
            Temukan Vendor Halal Untuk Kebutuhan Ibadah Anda
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#1F2937]/74">
            UMKM halal terkurasi siap mendukung kebutuhan manasik, rombongan jamaah, travel, dan KBIH.
          </p>
        </div>
        <div className="mt-9 rounded-[18px] bg-white p-6 shadow-premium">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <SearchField icon={MapPin} label="Lokasi / Kota">
              <select value={location} onChange={(event) => setLocation(event.target.value)} className="w-full bg-transparent text-sm text-[#1F2937]/72 outline-none">
                <option value="">Contoh: Jember</option>
                {locationOptions.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
              </select>
            </SearchField>
            <SearchField icon={Box} label="Kategori">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full bg-transparent text-sm text-[#1F2937]/72 outline-none">
                <option value="">Pilih kategori</option>
                {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
              </select>
            </SearchField>
            <SearchField icon={UsersRound} label="Kapasitas (Opsional)">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari vendor/kota/kategori" className="w-full bg-transparent text-sm text-[#1F2937]/72 outline-none" />
            </SearchField>
            <a href="#catalog-grid" className="inline-flex min-h-[64px] items-center justify-center gap-2 rounded-xl bg-[#08734F] px-8 font-bold text-white shadow-soft">
              <Search size={19} />
              Cari Vendor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchField({ icon: Icon, label, children }) {
  return (
    <label className="flex items-center gap-4 rounded-xl border border-[#064E3B]/10 px-4 py-3">
      <Icon size={22} className="text-[#1F2937]/65" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-[#1F2937]/70">{label}</span>
        {children}
      </span>
    </label>
  );
}

function FilterGroup({ title, children, withMore = false }) {
  return (
    <div className="border-b border-[#064E3B]/10 py-4 last:border-b-0">
      <h3 className="mb-3 font-black text-[#1F2937]">{title}</h3>
      <div className="grid gap-3">{children}</div>
      {withMore && <button type="button" className="mt-2 text-sm font-bold text-[#08734F]">Lihat semua</button>}
    </div>
  );
}

function CheckRow({ label, checked = false, onChange = () => {} }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1F2937]/78">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-[#1F2937]/30 accent-[#08734F]" />
      {label}
    </label>
  );
}

function RadioRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1F2937]/78">
      <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#08734F]" />
      {label}
    </label>
  );
}

function SmallEmpty({ text }) {
  return <p className="rounded-xl bg-[#ECFDF5] p-3 text-xs font-semibold text-[#064E3B]">{text}</p>;
}

function getCountOptions(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const value = item?.[key];
    if (!value) return;
    map.set(value, (map.get(value) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
