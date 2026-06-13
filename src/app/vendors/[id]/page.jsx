"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, Star, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatRupiah, splitBadges } from "@/lib/formatters";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import EmptyState from "@/components/mvp/EmptyState.jsx";
import VendorImage from "@/components/mvp/VendorImage.jsx";
import { openVendorWhatsapp } from "@/lib/leadTracking";

export default function VendorDetailPage({ params }) {
  const [vendor, setVendor] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadLoading, setLeadLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVendor() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("umkm_profiles")
        .select("*")
        .eq("id", params.id)
        .eq("status", "approved")
        .single();

      if (fetchError) setError(fetchError.message);
      setVendor(data || null);

      if (data?.id) {
        const [galleryResult, testimonialResult] = await Promise.all([
          supabase
            .from("umkm_gallery")
            .select("*")
            .eq("umkm_id", data.id)
            .eq("status", "approved")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("umkm_testimonials")
            .select("*")
            .eq("umkm_id", data.id)
            .eq("status", "approved")
            .order("created_at", { ascending: false }),
        ]);

        setGallery(galleryResult.data || []);
        setTestimonials(testimonialResult.data || []);
      }

      setLoading(false);
    }

    loadVendor();
  }, [params.id]);

  async function handleWhatsapp() {
    if (!vendor?.whatsapp) return;

    setLeadLoading(true);
    const message = `Assalamualaikum, saya tertarik dengan layanan ${vendor.business_name} di RuteBarokah. Mohon info paket dan ketersediaannya.`;
    await openVendorWhatsapp(vendor, message);
    setLeadLoading(false);
  }

  if (loading) return <LoadingState label="Memuat detail UMKM..." />;

  if (!vendor) {
    return (
      <main className="mx-auto w-[min(900px,calc(100%-32px))] py-14">
        <EmptyState
          title="Vendor tidak ditemukan"
          description={error || "Data vendor mungkin belum approved atau ID tidak tersedia."}
        />
      </main>
    );
  }

  const badges = splitBadges(vendor.badges);

  return (
    <main className="mx-auto w-[min(1080px,calc(100%-32px))] py-10">
      <Link href="/vendors" className="mb-6 inline-flex items-center gap-2 font-semibold text-[#064E3B]">
        <ArrowLeft size={18} />
        Kembali ke daftar vendor
      </Link>

      <article className="overflow-hidden rounded-[36px] border border-[#D6A84F]/25 bg-white shadow-premium">
        <VendorImage src={vendor.image_url} name={vendor.business_name} className="h-72 md:h-[380px]" />
        <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-9">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#064E3B]">
                {vendor.category}
              </span>
              {vendor.subcategory && (
                <span className="rounded-full bg-[#FFF8E7] px-3 py-1 text-xs font-semibold text-[#8A6424]">
                  {vendor.subcategory}
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold text-[#064E3B] md:text-5xl">
              {vendor.business_name}
            </h1>
            <p className="mt-5 whitespace-pre-line leading-8 text-[#1F2937]/72">
              {vendor.description || "Deskripsi layanan belum tersedia."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span key={badge} className="rounded-full border border-[#064E3B]/12 bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#064E3B]">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] bg-[#FFF8E7] p-5">
            <div className="grid gap-3">
              <Info icon={MapPin} label="Lokasi" value={`${vendor.location || "-"}${vendor.address ? ` • ${vendor.address}` : ""}`} />
              <Info icon={UsersRound} label="Kapasitas" value={`${vendor.capacity_min || 0}-${vendor.capacity_max || 0} pax`} />
              <Info icon={Star} label="Barokah Score" value={`${vendor.barokah_score || 0}/100`} gold />
              <Info label="Harga Mulai" value={formatRupiah(vendor.price_start)} />
            </div>
            <button
              type="button"
              onClick={handleWhatsapp}
              disabled={leadLoading || !vendor.whatsapp}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#064E3B] px-5 py-3.5 font-bold text-white transition hover:bg-[#043c2e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageCircle size={19} />
              {leadLoading ? "Membuka WhatsApp..." : "Hubungi via WhatsApp"}
            </button>
            <p className="mt-3 text-xs leading-5 text-[#1F2937]/55">
              Klik WhatsApp akan mencatat lead ke Supabase lalu mengarahkan ke nomor mitra.
            </p>
          </aside>
        </div>
      </article>

      <GallerySection items={gallery} />
      <TestimonialsSection items={testimonials} />
    </main>
  );
}

function GallerySection({ items }) {
  return (
    <section className="mt-8 rounded-[28px] border border-[#064E3B]/10 bg-white p-5 shadow-soft md:p-7">
      <div className="mb-5">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D6A84F]">Galeri Layanan</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-[#064E3B]">Dokumentasi layanan UMKM</h2>
      </div>
      {items.length ? (
        <div className="flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {items.map((item) => (
            <figure key={item.id} className="min-w-[260px] snap-start overflow-hidden rounded-2xl border border-[#064E3B]/10 bg-[#FFF8E7] md:min-w-0">
              <img src={item.image_url} alt={item.caption || "Galeri layanan UMKM"} className="h-52 w-full object-cover" />
              {item.caption && <figcaption className="p-4 text-sm font-semibold text-[#1F2937]/72">{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ) : (
        <EmptyMini title="Galeri layanan belum tersedia." />
      )}
    </section>
  );
}

function TestimonialsSection({ items }) {
  return (
    <section className="mt-8 rounded-[28px] border border-[#064E3B]/10 bg-white p-5 shadow-soft md:p-7">
      <div className="mb-5">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D6A84F]">Testimoni Pelanggan</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-[#064E3B]">Ulasan yang sudah diverifikasi</h2>
      </div>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-[#FFF8E7] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black text-[#064E3B]">{item.customer_name || "Pelanggan"}</h3>
                  <p className="text-sm text-[#1F2937]/60">{item.customer_type || "Jamaah"}</p>
                </div>
                <p className="font-black text-[#D6A84F]">{"★".repeat(Number(item.rating || 0))}</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#1F2937]/72">{item.testimonial}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyMini title="Testimoni pelanggan belum tersedia." />
      )}
    </section>
  );
}

function EmptyMini({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#064E3B]/18 bg-[#ECFDF5] p-6 text-center font-semibold text-[#064E3B]">
      {title}
    </div>
  );
}

function Info({ icon: Icon, label, value, gold }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-[#064E3B]">
        {Icon && <Icon size={16} className={gold ? "text-[#D6A84F]" : ""} fill={gold ? "currentColor" : "none"} />}
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#1F2937]/70">{value}</p>
    </div>
  );
}
