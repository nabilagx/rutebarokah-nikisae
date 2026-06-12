"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LandingHero from "@/components/mvp/LandingHero.jsx";
import LandingSections from "@/components/mvp/LandingSections.jsx";
import VendorCard from "@/components/mvp/VendorCard.jsx";
import { supabase } from "@/lib/supabaseClient";

const fallbackVendors = [
  {
    id: "demo-dapur-barokah",
    business_name: "Dapur Barokah Catering",
    category: "Katering",
    subcategory: "Catering Halal",
    location: "Jember",
    capacity_min: 50,
    capacity_max: 300,
    price_start: 18000,
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
    price_start: 15000,
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
    price_start: 10000,
    barokah_score: 93,
    badges: ["Terkurasi", "Cocok untuk Manasik", "Responsif"],
  },
];

export default function HomePage() {
  const [featuredVendors, setFeaturedVendors] = useState(fallbackVendors);

  useEffect(() => {
    async function loadFeaturedVendors() {
      const { data, error } = await supabase
        .from("umkm_profiles")
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("barokah_score", { ascending: false })
        .limit(3);

      if (!error && data?.length) {
        setFeaturedVendors(data);
      }
    }

    loadFeaturedVendors();
  }, []);

  return (
    <main className="bg-white">
      <LandingHero />
      <LandingSections featuredSlot={<FeaturedUmkm vendors={featuredVendors} />} />
    </main>
  );
}

function FeaturedUmkm({ vendors }) {
  return (
    <section className="section-shell py-12">
        <div className="mb-6 flex flex-col gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-4xl font-bold text-[#064E3B]">Featured UMKM</h2>
            <p className="mt-1 text-[#1F2937]/65">UMKM halal pilihan dari Supabase, dengan fallback dummy untuk demo.</p>
            <span className="mt-3 inline-flex rounded-full bg-[#ECFDF5] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#064E3B]">
              Fokus MVP: Konsumsi Halal & Catering Rombongan
            </span>
          </div>
          <Link href="/vendors" className="mx-auto inline-flex items-center gap-2 rounded-xl border border-[#064E3B]/20 bg-white px-5 py-3 font-bold text-[#064E3B] shadow-soft md:mx-0">
            Lihat Semua <ArrowRight size={17} />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </section>
  );
}
