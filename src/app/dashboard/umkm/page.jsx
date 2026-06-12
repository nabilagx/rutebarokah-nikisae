"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import ProtectedNotice from "@/components/mvp/ProtectedNotice.jsx";
import { categories, locations } from "@/lib/constants";
import { formatRupiah } from "@/lib/formatters";

export default function UmkmDashboardPage() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      setUser(currentUser || null);

      if (!currentUser) {
        setChecking(false);
        return;
      }

      const { data: umkmData } = await supabase
        .from("umkm_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setProfile(umkmData || null);

      if (umkmData?.id) {
        const { data: leadData } = await supabase
          .from("leads")
          .select("*")
          .eq("umkm_id", umkmData.id)
          .order("created_at", { ascending: false });
        setLeads(leadData || []);
      }

      setChecking(false);
    }

    init();
  }, []);

  const formState = useMemo(() => ({
    business_name: profile?.business_name || "",
    owner_name: profile?.owner_name || "",
    category: profile?.category || "Katering",
    subcategory: profile?.subcategory || "",
    location: profile?.location || "Jakarta",
    address: profile?.address || "",
    whatsapp: profile?.whatsapp || "",
    capacity_min: profile?.capacity_min || "",
    capacity_max: profile?.capacity_max || "",
    price_start: profile?.price_start || "",
    description: profile?.description || "",
    image_url: profile?.image_url || "",
  }), [profile]);

  if (checking) return <LoadingState label="Memuat dashboard UMKM..." />;

  if (!user) {
    return (
      <ProtectedNotice
        title="Dashboard UMKM membutuhkan login"
        description="Silakan login dengan akun UMKM agar profil usaha dan leads milik Anda dapat ditampilkan."
      />
    );
  }

  if (!profile) {
    return (
      <ProtectedNotice
        title="Profil UMKM belum ditemukan"
        description="Akun ini belum terhubung dengan data UMKM. Daftarkan usaha melalui form daftar UMKM saat sudah login."
      />
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const { error: updateError } = await supabase
      .from("umkm_profiles")
      .update({
        ...payload,
        capacity_min: payload.capacity_min ? Number(payload.capacity_min) : null,
        capacity_max: payload.capacity_max ? Number(payload.capacity_max) : null,
        price_start: payload.price_start ? Number(payload.price_start) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProfile((current) => ({ ...current, ...payload }));
    setMessage("Profil usaha berhasil diperbarui.");
  }

  return (
    <main className="mx-auto w-[min(1120px,calc(100%-32px))] py-10">
      <div className="mb-8 overflow-hidden rounded-[24px] bg-[#064E3B] p-7 text-white shadow-premium islamic-grid">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">Dashboard UMKM</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{profile.business_name}</h1>
        <p className="mt-3 text-white/75">
          Status approval: <span className="font-bold text-[#D6A84F]">{profile.status}</span> • Barokah Score: {profile.barokah_score || 0}/100
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSave} className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft md:p-6">
          <h2 className="font-display text-2xl font-bold text-[#064E3B]">Edit Data Dasar Usaha</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Nama Usaha" name="business_name" defaultValue={formState.business_name} />
            <Input label="Nama Pemilik" name="owner_name" defaultValue={formState.owner_name} />
            <Select label="Kategori" name="category" defaultValue={formState.category} options={categories} />
            <Input label="Subkategori" name="subcategory" defaultValue={formState.subcategory} />
            <Select label="Lokasi" name="location" defaultValue={formState.location} options={locations} />
            <Input label="WhatsApp" name="whatsapp" defaultValue={formState.whatsapp} />
            <Input label="Alamat" name="address" defaultValue={formState.address} className="md:col-span-2" />
            <Input label="Kapasitas Minimal" name="capacity_min" type="number" defaultValue={formState.capacity_min} />
            <Input label="Kapasitas Maksimal" name="capacity_max" type="number" defaultValue={formState.capacity_max} />
            <Input label="Harga Mulai" name="price_start" type="number" defaultValue={formState.price_start} />
            <Input label="Image URL" name="image_url" defaultValue={formState.image_url} />
            <label className="label md:col-span-2">
              Deskripsi
              <textarea name="description" defaultValue={formState.description} rows={5} className="field resize-none" />
            </label>
          </div>

          {message && <div className="mt-5 rounded-2xl bg-[#ECFDF5] p-4 text-sm font-semibold text-[#064E3B]">{message}</div>}
          {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

          <button type="submit" className="mt-6 w-full rounded-xl bg-[#064E3B] px-6 py-4 font-bold text-white shadow-soft">
            Simpan Perubahan
          </button>
        </form>

        <div className="grid gap-6">
          <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
            <h2 className="font-display text-2xl font-bold text-[#064E3B]">Ringkasan</h2>
            <div className="mt-5 grid gap-3">
              <Metric label="Jumlah Leads" value={leads.length} />
              <Metric label="Harga Mulai" value={formatRupiah(profile.price_start)} />
              <Metric label="Kapasitas" value={`${profile.capacity_min || 0}-${profile.capacity_max || 0} pax`} />
            </div>
          </div>
          <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
            <h2 className="font-display text-2xl font-bold text-[#064E3B]">Leads Masuk</h2>
            <div className="mt-5 grid gap-3">
              {leads.length ? leads.map((lead) => (
                <div key={lead.id} className="rounded-2xl bg-[#FFF8E7] p-4">
                  <p className="font-bold text-[#064E3B]">{lead.source || "Lead WhatsApp"}</p>
                  <p className="mt-1 text-sm text-[#1F2937]/65">{lead.message || lead.whatsapp || "-"}</p>
                </div>
              )) : (
                <p className="text-sm text-[#1F2937]/60">Belum ada leads.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={`label ${className}`}>
      {label}
      <input className="field" {...props} />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="label">
      {label}
      <select className="field" {...props}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#FFF8E7] p-4">
      <p className="text-sm font-semibold text-[#1F2937]/55">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-[#064E3B]">{value}</p>
    </div>
  );
}
