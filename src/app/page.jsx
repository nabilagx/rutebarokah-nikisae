import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import LandingHero from "@/components/mvp/LandingHero.jsx";
import LandingSections from "@/components/mvp/LandingSections.jsx";
import VendorImage from "@/components/mvp/VendorImage.jsx";

const featuredVendors = [
  {
    id: "demo-dapur-barokah",
    business_name: "Dapur Barokah Catering",
    category: "Katering",
    subcategory: "Catering Halal",
    location: "Jember",
    capacity_min: 50,
    capacity_max: 300,
    price_start: "Rp18.000/pax",
    barokah_score: 95,
    badges: ["Terkurasi", "Responsif", "Cocok untuk Rombongan"],
  },
  {
    id: "demo-nasi-box",
    business_name: "Nasi Box Amanah",
    category: "Katering",
    subcategory: "Nasi Box",
    location: "Ambulu",
    capacity_min: 30,
    capacity_max: 150,
    price_start: "Rp15.000/pax",
    barokah_score: 94,
    badges: ["Terkurasi", "Responsif", "Harga Terjangkau"],
  },
  {
    id: "demo-safa-marwah",
    business_name: "Sajian Safa Marwah",
    category: "Snack Box",
    subcategory: "Snack Box Manasik",
    location: "Jember Kota",
    capacity_min: 40,
    capacity_max: 250,
    price_start: "Rp10.000/pax",
    barokah_score: 93,
    badges: ["Terkurasi", "Cocok untuk Manasik", "Responsif"],
  },
];

export default function HomePage() {
  return (
    <main className="bg-white">
      <LandingHero />
      <LandingSections />
      <section className="section-shell pb-14">
        <div className="mb-6 flex flex-col gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-4xl font-bold text-[#064E3B]">Vendor Unggulan</h2>
            <p className="mt-1 text-[#1F2937]/65">Contoh vendor halal dengan Barokah Score tertinggi.</p>
          </div>
          <Link href="/vendors" className="mx-auto inline-flex items-center gap-2 rounded-xl border border-[#064E3B]/20 bg-white px-5 py-3 font-bold text-[#064E3B] shadow-soft md:mx-0">
            Lihat Semua <ArrowRight size={17} />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featuredVendors.map((vendor) => (
            <FeaturedCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </section>
    </main>
  );
}

function FeaturedCard({ vendor }) {
  return (
    <article className="group overflow-hidden rounded-[18px] border border-[#064E3B]/10 bg-white p-2 shadow-soft">
      <div className="relative overflow-hidden rounded-[14px]">
        <VendorImage name={vendor.business_name} category={vendor.category} className="h-52" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-[#064E3B] px-3 py-1.5 text-sm font-black text-[#D6A84F]">
          <Star size={15} fill="currentColor" />
          {vendor.barokah_score}
        </span>
      </div>
      <div className="p-3 pt-4">
        <h3 className="text-xl font-black text-[#1F2937]">{vendor.business_name}</h3>
        <p className="mt-1 text-sm text-[#1F2937]/62">{vendor.subcategory}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="flex items-center gap-1 text-[#1F2937]/70">
            <MapPin size={15} />
            {vendor.location} - {vendor.capacity_min}-{vendor.capacity_max} pax
          </p>
          <p className="font-black text-[#08734F]">{vendor.price_start}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {vendor.badges.map((badge) => (
            <span key={badge} className="rounded-lg bg-[#FFF2C9] px-3 py-1.5 text-xs font-bold text-[#6F551C]">
              {badge}
            </span>
          ))}
        </div>
        <Link href="/vendors" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#064E3B] px-5 py-3 font-bold text-white">
          Lihat Detail <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}
