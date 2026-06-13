"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Star, Store, UsersRound } from "lucide-react";
import { categories, locations } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";
import { uploadUmkmImage } from "@/lib/uploadUmkmImage";
import { normalizeWhatsapp } from "@/lib/formatters";

const initialForm = {
  business_name: "",
  owner_name: "",
  owner_email: "",
  password: "",
  confirm_password: "",
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function JoinUmkmPage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [statusForm, setStatusForm] = useState({ registration_code: "", whatsapp: "" });
  const [statusResult, setStatusResult] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
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
      const cleanEmail = form.owner_email.trim().toLowerCase();
      if (!emailRegex.test(cleanEmail)) throw new Error("Email pemilik wajib valid.");
      if (form.password.length < 8) throw new Error("Password minimal 8 karakter.");
      if (form.password !== form.confirm_password) throw new Error("Password dan konfirmasi password harus sama.");

      let imageUrl = form.image_url.trim();

      if (file) {
        imageUrl = await uploadUmkmImage(file);
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          data: {
            full_name: form.owner_name,
            role: "umkm",
          },
        },
      });

      if (signUpError) {
        console.error("Supabase signUp error:", signUpError);
        throw signUpError;
      }
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Akun berhasil diproses, tetapi user ID belum tersedia. Coba login atau hubungi admin.");

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.owner_name,
        email: cleanEmail,
        role: "umkm",
      });

      if (profileError) {
        console.error("Optional profiles upsert ditolak, lanjut karena trigger Supabase menangani profiles:", profileError);
      }

      const registrationCode = generateRegistrationCode();
      const payload = {
        user_id: userId,
        owner_email: cleanEmail,
        registration_code: registrationCode,
        business_name: form.business_name,
        owner_name: form.owner_name,
        category: form.category,
        subcategory: form.subcategory,
        location: form.location,
        address: form.address,
        whatsapp: normalizeWhatsapp(form.whatsapp),
        capacity_min: form.capacity_min ? Number(form.capacity_min) : null,
        capacity_max: form.capacity_max ? Number(form.capacity_max) : null,
        price_start: form.price_start ? Number(form.price_start) : null,
        description: form.description,
        image_url: imageUrl || null,
        status: "pending",
        barokah_score: 0,
        badges: ["Menunggu Verifikasi"],
        is_featured: false,
      };

      const { error: insertError } = await supabase.from("umkm_profiles").insert(payload);
      if (insertError) {
        console.error("Supabase umkm_profiles insert error:", insertError);
        throw insertError;
      }

      setSuccessData({ registration_code: registrationCode, business_name: form.business_name });
      setMessage("Pendaftaran UMKM berhasil dikirim.");
      setForm(initialForm);
      setFile(null);
      event.target.reset();
    } catch (submitError) {
      console.error("Submit daftar UMKM gagal:", submitError);
      setError(submitError.message || "Gagal mengirim pendaftaran UMKM.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusCheck(event) {
    event.preventDefault();
    setCheckingStatus(true);
    setStatusError("");
    setStatusResult(null);

    const code = statusForm.registration_code.trim().toUpperCase();
    const whatsapp = normalizeWhatsapp(statusForm.whatsapp);

    const { data, error: queryError } = await supabase
      .from("umkm_profiles")
      .select("business_name, owner_name, location, status, created_at, verification_note, registration_code, whatsapp")
      .eq("registration_code", code)
      .maybeSingle();

    if (queryError) {
      setStatusError(queryError.message);
      setCheckingStatus(false);
      return;
    }

    if (!data || normalizeWhatsapp(data.whatsapp) !== whatsapp) {
      setStatusError("Data pendaftaran tidak ditemukan. Pastikan ID pendaftaran dan nomor WhatsApp sesuai.");
      setCheckingStatus(false);
      return;
    }

    setStatusResult(data);
    setCheckingStatus(false);
  }

  if (successData) {
    return (
      <main className="bg-white">
        <RegisterHero />
        <section className="section-shell -mt-16 pb-16">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-[#D6A84F]/25 bg-white p-7 text-center shadow-premium md:p-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ECFDF5] text-[#064E3B]">
              <CheckCircle2 size={34} />
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold text-[#064E3B]">Pendaftaran UMKM Berhasil Dikirim</h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-[#1F2937]/68">
              Akun UMKM Anda sudah dibuat, tetapi profil usaha akan tampil setelah diverifikasi admin.
            </p>
            <div className="mt-6 rounded-3xl bg-[#FFF8E7] p-6">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D6A84F]">ID Pendaftaran</p>
              <p className="mt-2 font-display text-4xl font-bold text-[#064E3B]">{successData.registration_code}</p>
              <p className="mt-2 text-sm font-semibold text-[#1F2937]/62">Simpan ID pendaftaran ini untuk mengecek status verifikasi UMKM Anda.</p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Link href="/login" className="rounded-xl bg-[#064E3B] px-5 py-4 font-bold text-white">Login Dashboard UMKM</Link>
              <button type="button" onClick={() => setSuccessData(null)} className="rounded-xl border border-[#064E3B]/15 px-5 py-4 font-bold text-[#064E3B]">Cek Status Pendaftaran</button>
              <Link href="/" className="rounded-xl border border-[#064E3B]/15 px-5 py-4 font-bold text-[#064E3B]">Kembali ke Beranda</Link>
            </div>
          </div>
        </section>
      </main>
    );
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
              <Input label="Email Pemilik" name="owner_email" value={form.owner_email} onChange={updateField} type="email" required placeholder="nama@email.com" />
              <Input label="Password" name="password" value={form.password} onChange={updateField} type="password" required minLength={8} placeholder="Minimal 8 karakter" />
              <Input label="Konfirmasi Password" name="confirm_password" value={form.confirm_password} onChange={updateField} type="password" required minLength={8} placeholder="Ulangi password" />
              <div className="rounded-2xl bg-[#ECFDF5] p-4 text-sm font-semibold leading-6 text-[#064E3B] md:col-span-2">
                Email dan password digunakan untuk mengakses dashboard UMKM setelah pendaftaran.
              </div>
              <label className="label">
                Nomor WhatsApp
                <div className="grid grid-cols-[88px_1fr] gap-3">
                  <span className="field flex items-center justify-center rounded-xl py-3 font-bold">+62</span>
                  <input className="field rounded-xl py-3" name="whatsapp" value={form.whatsapp} onChange={updateField} required placeholder="812-3456-7890" />
                </div>
              </label>
              <Input label="Subkategori" name="subcategory" value={form.subcategory} onChange={updateField} placeholder="Nasi box, snack box, laundry" />
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
        <StatusCheckSection
          form={statusForm}
          setForm={setStatusForm}
          result={statusResult}
          error={statusError}
          loading={checkingStatus}
          onSubmit={handleStatusCheck}
        />
      </section>
    </main>
  );
}

function StatusCheckSection({ form, setForm, result, error, loading, onSubmit }) {
  return (
    <section className="mt-10 rounded-[24px] border border-[#064E3B]/10 bg-[#F7FBF4] p-6 shadow-soft">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#064E3B]">Sudah pernah mendaftar?</h2>
          <p className="mt-2 leading-7 text-[#1F2937]/68">
            Cek status verifikasi UMKM Anda menggunakan ID pendaftaran dan nomor WhatsApp.
          </p>
        </div>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={form.registration_code}
            onChange={(event) => setForm((current) => ({ ...current, registration_code: event.target.value }))}
            className="field rounded-xl py-3"
            placeholder="RB-20260613-A7K2"
            required
          />
          <input
            value={form.whatsapp}
            onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
            className="field rounded-xl py-3"
            placeholder="Nomor WhatsApp"
            required
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-[#064E3B] px-6 py-3 font-bold text-white disabled:opacity-60">
            {loading ? "Mengecek..." : "Cek Status"}
          </button>
        </form>
      </div>
      {error && <Alert type="error" message={error} />}
      {result && <StatusResultCard result={result} />}
    </section>
  );
}

function StatusResultCard({ result }) {
  const texts = {
    pending: "Pendaftaran Anda sedang menunggu verifikasi admin.",
    approved: "Pendaftaran Anda telah disetujui. Silakan login ke dashboard UMKM menggunakan email dan password yang didaftarkan.",
    rejected: "Pendaftaran belum dapat disetujui. Silakan periksa catatan admin atau hubungi RuteBarokah.",
  };

  return (
    <div className="mt-5 rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#D6A84F]">Status Pendaftaran</p>
          <h3 className="mt-2 font-display text-3xl font-bold text-[#064E3B]">{result.business_name}</h3>
          <p className="mt-1 text-sm text-[#1F2937]/65">{result.owner_name} • {result.location}</p>
        </div>
        <span className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-black text-[#064E3B]">{result.status}</span>
      </div>
      <p className="mt-4 leading-7 text-[#1F2937]/70">{texts[result.status] || texts.pending}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniInfo label="ID Pendaftaran" value={result.registration_code} />
        <MiniInfo label="Tanggal Daftar" value={formatDate(result.created_at)} />
        <MiniInfo label="Catatan Verifikasi" value={result.verification_note || "-"} />
      </div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#FFF8E7] p-4">
      <p className="text-xs font-black uppercase tracking-[0.13em] text-[#064E3B]/55">{label}</p>
      <p className="mt-1 font-bold text-[#1F2937]/75">{value}</p>
    </div>
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

function generateRegistrationCode() {
  const date = new Date();
  const yyyymmdd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RB-${yyyymmdd}-${random}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
