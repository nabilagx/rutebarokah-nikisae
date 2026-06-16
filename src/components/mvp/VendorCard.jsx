"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, MessageCircle, PackageCheck, UsersRound } from "lucide-react";
import VendorImage from "./VendorImage.jsx";
import { formatRupiah, splitBadges } from "@/lib/formatters";
import { openVendorWhatsapp } from "@/lib/leadTracking";

export default function VendorCard({ vendor }) {
  const [openingWhatsapp, setOpeningWhatsapp] = useState(false);
  const badges = splitBadges(vendor.badges).slice(0, 3);
  const fitTags = getFitTags(vendor);
  const capacityLabel = `${vendor.capacity_min || 0}-${vendor.capacity_max || 0} pax`;

  async function handleWhatsapp() {
    setOpeningWhatsapp(true);
    const message = `Assalamualaikum, saya tertarik dengan layanan ${vendor.business_name} di RuteBarokah. Mohon info paket dan ketersediaannya.`;
    await openVendorWhatsapp(vendor, message);
    setOpeningWhatsapp(false);
  }

  return (
    <article className="group overflow-hidden rounded-[18px] border border-[#064E3B]/10 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-premium">
      <div className="relative overflow-hidden">
        <VendorImage src={vendor.image_url} name={vendor.business_name} category={vendor.category} className="h-56" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-lg bg-[#0B7A55] px-3 py-1.5 text-xs font-black text-white shadow-soft">
          <PackageCheck size={14} />
          Terkurasi
        </span>
        <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/45 bg-white/18 text-white backdrop-blur">
          <Heart size={20} />
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[#1F2937]">{vendor.business_name}</h3>
            <p className="mt-1 text-sm text-[#1F2937]/62">
              {vendor.category || "UMKM Halal"}{vendor.subcategory ? ` - ${vendor.subcategory}` : ""}
            </p>
          </div>
          <div className="grid min-w-14 place-items-center rounded-xl border border-[#064E3B]/10 bg-white px-2 py-2 text-center shadow-soft">
            <strong className="text-2xl font-black text-[#08734F]">{vendor.barokah_score || 0}</strong>
            <span className="-mt-1 text-[10px] font-bold leading-3 text-[#1F2937]/60">Barokah<br />Score</span>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1 text-sm text-[#1F2937]/70">
          <MapPin size={15} />
          {vendor.location || "Lokasi belum diisi"} - kapasitas {capacityLabel}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#ECFDF5] px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1F2937]/45">Harga mulai</p>
            <p className="text-base font-black text-[#08734F]">{formatRupiah(vendor.price_start)}/pax</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#064E3B] shadow-soft">
            <UsersRound size={15} />
            {capacityLabel}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(badges.length ? badges : ["Terkurasi", "Responsif"]).map((badge) => (
            <span key={badge} className="rounded-lg bg-[#F4F4F2] px-3 py-1.5 text-xs font-semibold text-[#1F2937]/72">
              {badge}
            </span>
          ))}
          {fitTags.map((tag) => (
            <span key={tag} className="rounded-lg bg-[#FFF8E7] px-3 py-1.5 text-xs font-bold text-[#064E3B]">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={handleWhatsapp}
            disabled={openingWhatsapp || !vendor.whatsapp}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] px-5 py-3 font-bold text-white transition hover:bg-[#043c2e] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <MessageCircle size={17} />
            {openingWhatsapp ? "Membuka WhatsApp..." : "Hubungi WhatsApp"}
          </button>
          <Link
            href={`/vendors/${vendor.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#064E3B]/18 bg-white px-5 py-3 font-bold text-[#08734F] transition hover:bg-[#064E3B] hover:text-white"
          >
            Lihat Detail <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function getFitTags(vendor) {
  const text = `${vendor.category || ""} ${vendor.subcategory || ""} ${vendor.description || ""}`.toLowerCase();
  const tags = [];

  if (text.includes("manasik") || text.includes("snack") || text.includes("nasi")) tags.push("Cocok untuk Manasik");
  if (text.includes("catering") || text.includes("katering") || text.includes("rombongan") || Number(vendor.capacity_max || 0) >= 50) tags.push("Cocok untuk Rombongan Jamaah");
  if (text.includes("transport") || text.includes("laundry") || text.includes("katering") || text.includes("catering")) tags.push("Cocok untuk Travel/KBIH");

  return (tags.length ? tags : ["Cocok untuk Rombongan Jamaah", "Cocok untuk Travel/KBIH"]).slice(0, 3);
}
