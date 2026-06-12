"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Star, Store, UsersRound } from "lucide-react";
import { categories, locations } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";
import { uploadUmkmImage } from "@/lib/uploadUmkmImage";

const initialForm = {
  business_name: "",
  owner_name: "",
  category: "Katering",
  subcategory: "",
  location: "Jakarta",
  address: "",
  whatsapp: "",
  capacity_min: "",
  capacity_max: "",
  price_start: "",
  description: "",
  image_url: "",
};

const steps = [
  ["Informasi Dasar", "Data dasar UMKM Anda"],
  ["Informasi Usaha", "Detail usaha dan layanan"],
  ["Lokasi & Layanan", "Area dan kapasitas"],
  ["Dokumen & Legalitas", "Foto dan pendukung"],
  ["Verifikasi", "Review & kirim"],
];

export default function JoinUmkmPage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const { data: authData } = await supabase.auth.getUser();
      let imageUrl = form.image_url.trim();

      if (file) {
        imageUrl = await uploadUmkmImage(file);
      }

      const payload = {
        ...form,
        user_id: authData?.user?.id || null,
        capacity_min: form.capacity_min ? Number(form.capacity_min) : null,
        capacity_max: form.capacity_max ? Number(form.capacity_max) : null,
        price_start: form.price_start ? Number(form.price_start) : null,
        image_url: imageUrl || null,
        status: "pending",
        barokah_score: 0,
        badges: ["Menunggu Verifikasi"],
        is_featured: false,
      };

      const { error: insertError } = await supabase.from("umkm_profiles").insert(payload);
      if (insertError) throw insertError;

      setMessage("Data UMKM berhasil dikirim dan sedang menunggu validasi admin.");
      setForm(initialForm);
      setFile(null);
      event.target.reset();
    } catch (submitError) {
      setError(submitError.message || "Gagal mengirim pendaftaran UMKM.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-white">
      <RegisterHero />

      <section className="section-shell -mt-16 pb-16">
        <Stepper />
        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handleSubmit} className="rounded-[22px] border border-[#064E3B]/10 bg-white p-6 shadow-premium md:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-[#1F2937]">Informasi Dasar</h2>
              <p className="mt-1 text-[#1F2937]/62">Lengkapi informasi dasar UMKM Anda</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Nama UMKM / Brand" name="business_name" value={form.business_name} onChange={updateField} required placeholder="Contoh: Dapur Barokah Catering" />
              <Input label="Nama Pemilik" name="owner_name" value={form.owner_name} onChange={updateField} required placeholder="Masukkan nama pemilik usaha" />
              <label className="label">
                Nomor WhatsApp
                <div className="grid grid-cols-[88px_1fr] gap-3">
                  <span className="field flex items-center justify-center rounded-xl py-3 font-bold">+62</span>
                  <input className="field rounded-xl py-3" name="whatsapp" value={form.whatsapp} onChange={updateField} required placeholder="812-3456-7890" />
                </div>
              </label>
              <Input label="Subkategori / Email Opsional" name="subcategory" value={form.subcategory} onChange={updateField} placeholder="Nasi box, snack box, laundry" />
              <Select label="Kategori Usaha" name="category" value={form.category} onChange={updateField} options={categories} className="md:col-span-2" />
              <label className="label md:col-span-2">
                Deskripsi Singkat
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={4}
                  className="field resize-none rounded-xl"
                  required
                  placeholder="Ceritakan secara singkat tentang usaha Anda, produk/layanan yang ditawarkan, dan keunggulan Anda..."
                />
                <span className="text-xs font-medium text-[#1F2937]/50">Minimal 30 karakter</span>
              </label>
            </div>

            <div className="mt-8 border-t border-[#064E3B]/10 pt-7">
              <h2 className="text-2xl font-black text-[#1F2937]">Lokasi & Layanan</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Select label="Lokasi Utama" name="location" value={form.location} onChange={updateField} options={locations} />
                <Input label="Alamat Lengkap" name="address" value={form.address} onChange={updateField} placeholder="Alamat usaha atau area layanan" />
                <Input label="Kapasitas Minimal" name="capacity_min" value={form.capacity_min} onChange={updateField} type="number" placeholder="50" />
                <Input label="Kapasitas Maksimal" name="capacity_max" value={form.capacity_max} onChange={updateField} type="number" placeholder="300" />
                <Input label="Harga Mulai" name="price_start" value={form.price_start} onChange={updateField} type="number" placeholder="18000" />
                <Input label="URL Gambar Manual" name="image_url" value={form.image_url} onChange={updateField} placeholder="https://..." />
                <label className="label md:col-span-2">
                  Upload Foto/Logo UMKM
                  <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} className="field rounded-xl" />
                  <span className="text-xs font-medium text-[#1F2937]/55">
                    Upload akan masuk ke bucket Supabase `umkm-images`. Jika kosong, sistem memakai URL manual atau fallback image.
                  </span>
                </label>
              </div>
            </div>

            {message && <Alert type="success" message={message} />}
            {error && <Alert type="error" message={error} />}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#064E3B]/12 px-6 py-4 font-bold text-[#1F2937]">
                <ArrowLeft size={18} /> Kembali
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#08734F] px-8 py-4 font-bold text-white shadow-soft transition hover:bg-[#064E3B] disabled:opacity-60"
              >
                {submitting ? "Mengirim Data..." : "Simpan & Kirim"}
                <ArrowRight size={18} />
              </button>
            </div>
          </form>

          <RegisterAside />
        </div>
      </section>
    </main>
  );
}

function RegisterHero() {
  return (
    <section className="section-shell pt-8">
      <div className="relative min-h-[310px] overflow-hidden rounded-[24px] bg-[#F4F8F5] p-8 shadow-soft md:p-12">
        <div className="absolute inset-y-0 right-0 w-[55%]">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Al_Qibla.jpg/1280px-Al_Qibla.jpg"
            alt="Ka'bah di Masjidil Haram"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#F4F8F5_0%,rgba(244,248,245,.86)_22%,rgba(244,248,245,.25)_100%)]" />
        </div>
        <div className="relative max-w-2xl">
          <h1 className="text-4xl font-black leading-tight text-[#101820] md:text-5xl">
            Daftarkan UMKM Anda <span className="block text-[#08734F]">Bersama RuteBarokah</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#1F2937]/70">
            Bergabunglah dengan ekosistem haji-umrah dan dapatkan lebih banyak peluang untuk usaha Anda.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stepper() {
  return (
    <div className="relative z-10 rounded-[18px] bg-white p-6 shadow-premium">
      <div className="grid gap-5 md:grid-cols-5">
        {steps.map(([title, desc], index) => {
          const active = index === 0;
          return (
            <div key={title} className="flex items-center gap-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-black ${active ? "bg-[#08734F] text-white" : "bg-[#E5E7EB] text-[#1F2937]"}`}>
                {index + 1}
              </span>
              <span>
                <strong className={active ? "text-[#08734F]" : "text-[#1F2937]"}>{title}</strong>
                <span className="block text-xs text-[#1F2937]/58">{desc}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegisterAside() {
  const benefits = [
    [ShieldCheck, "Terkurasi & Terpercaya", "UMKM Anda akan melalui proses kurasi untuk menjaga kualitas dan kepercayaan."],
    [UsersRound, "Lebih Banyak Peluang", "Terhubung dengan travel, KBIH, dan komunitas jamaah di seluruh Indonesia."],
    [Star, "Sistem Penilaian Transparan", "Bangun reputasi usaha Anda dengan Barokah Score yang transparan."],
    [CheckCircle2, "Mudah & Gratis", "Pendaftaran gratis, pengguna hanya membayar saat mendapatkan lead."],
  ];

  return (
    <aside className="grid h-fit gap-4">
      <div className="rounded-[22px] bg-[#F1F8F3] p-6 shadow-soft">
        <h2 className="text-xl font-black text-[#1F2937]">Kenapa Daftar di RuteBarokah?</h2>
        <div className="mt-6 grid gap-5">
          {benefits.map(([Icon, title, desc]) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E1F4E8] text-[#08734F]">
                <Icon size={22} />
              </span>
              <span>
                <strong className="text-[#1F2937]">{title}</strong>
                <p className="mt-1 text-sm leading-6 text-[#1F2937]/65">{desc}</p>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[18px] bg-[#F1F8F3] p-6 shadow-soft">
        <h3 className="font-black text-[#1F2937]">Butuh bantuan?</h3>
        <p className="mt-1 text-sm text-[#1F2937]/65">Tim kami siap membantu proses pendaftaran Anda.</p>
        <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#08734F]/30 bg-white px-4 py-3 font-bold text-[#08734F]">
          <MessageCircle size={18} />
          Hubungi Admin
        </button>
      </div>
    </aside>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={`label ${className}`}>
      {label}
      <input className="field rounded-xl py-3" {...props} />
    </label>
  );
}

function Select({ label, options, className = "", ...props }) {
  return (
    <label className={`label ${className}`}>
      {label}
      <select className="field rounded-xl py-3" {...props}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Alert({ type, message }) {
  return (
    <div className={`mt-5 rounded-2xl p-4 text-sm font-semibold ${type === "success" ? "bg-[#ECFDF5] text-[#064E3B]" : "bg-red-50 text-red-700"}`}>
      {message}
    </div>
  );
}
