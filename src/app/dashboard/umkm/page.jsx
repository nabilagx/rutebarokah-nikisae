"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import ProtectedNotice from "@/components/mvp/ProtectedNotice.jsx";
import { categories, locations } from "@/lib/constants";
import { formatRupiah } from "@/lib/formatters";
import { uploadUmkmGalleryImage } from "@/lib/uploadUmkmImage";

export default function UmkmDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [accountRole, setAccountRole] = useState("");
  const [profile, setProfile] = useState(null);
  const [leads, setLeads] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      setUser(currentUser || null);

      if (!currentUser) {
        router.replace("/login");
        setChecking(false);
        return;
      }

      const { data: accountProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();

      setAccountRole(accountProfile?.role || "");

      if (accountProfile?.role === "admin") {
        router.replace("/dashboard/admin");
        setChecking(false);
        return;
      }

      if (accountProfile?.role !== "umkm") {
        router.replace("/login");
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
        let { data: leadData, error: leadError } = await supabase
          .from("leads")
          .select("*")
          .eq("umkm_id", umkmData.id)
          .order("clicked_at", { ascending: false });

        if (leadError) {
          console.error("Gagal mengambil leads berdasarkan clicked_at:", leadError);
          const fallback = await supabase
            .from("leads")
            .select("*")
            .eq("umkm_id", umkmData.id)
            .order("created_at", { ascending: false });
          leadData = fallback.data || [];
        }

        setLeads(leadData || []);

        const [galleryResult, testimonialResult] = await Promise.all([
          supabase
            .from("umkm_gallery")
            .select("*")
            .eq("umkm_id", umkmData.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("umkm_testimonials")
            .select("*")
            .eq("umkm_id", umkmData.id)
            .order("created_at", { ascending: false }),
        ]);

        setGallery(galleryResult.data || []);
        setTestimonials(testimonialResult.data || []);
      }

      setChecking(false);
    }

    init();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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

  async function refreshAssets() {
    if (!profile?.id) return;
    const [galleryResult, testimonialResult] = await Promise.all([
      supabase
        .from("umkm_gallery")
        .select("*")
        .eq("umkm_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("umkm_testimonials")
        .select("*")
        .eq("umkm_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);
    setGallery(galleryResult.data || []);
    setTestimonials(testimonialResult.data || []);
  }

  async function handleGallerySubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setUploadingGallery(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("image");

    try {
      if (!file || !file.name) throw new Error("Pilih gambar galeri terlebih dahulu.");
      const imageUrl = await uploadUmkmGalleryImage(file, profile.id);
      const { error: insertError } = await supabase.from("umkm_gallery").insert({
        umkm_id: profile.id,
        image_url: imageUrl,
        caption: formData.get("caption") || null,
        sort_order: Number(formData.get("sort_order") || 0),
        is_active: true,
        status: "pending",
        created_by: user.id,
      });

      if (insertError) throw insertError;
      event.currentTarget.reset();
      setMessage("Galeri berhasil diajukan dan menunggu tinjauan admin.");
      await refreshAssets();
    } catch (submitError) {
      setError(submitError.message || "Upload galeri gagal.");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleTestimonialSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);

    const { error: insertError } = await supabase.from("umkm_testimonials").insert({
      umkm_id: profile.id,
      customer_name: formData.get("customer_name"),
      customer_type: formData.get("customer_type"),
      rating: Number(formData.get("rating") || 5),
      testimonial: formData.get("testimonial"),
      status: "pending",
      created_by: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    event.currentTarget.reset();
    setMessage("Testimoni berhasil diajukan dan menunggu tinjauan admin.");
    await refreshAssets();
  }

  async function deleteAsset(table, id) {
    setMessage("");
    setError("");
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setMessage("Data berhasil dihapus.");
    await refreshAssets();
  }

  return (
    <main className="mx-auto w-[min(1120px,calc(100%-32px))] py-10">
      <div className="mb-8 overflow-hidden rounded-[24px] bg-[#064E3B] p-7 text-white shadow-premium islamic-grid">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">Dashboard UMKM</p>
            <h1 className="mt-2 font-display text-4xl font-bold">{profile.business_name || user?.email}</h1>
            <p className="mt-3 text-white/75">
              ID Pendaftaran: <span className="font-bold text-[#D6A84F]">{profile.registration_code || "-"}</span> • Status: <span className="font-bold text-[#D6A84F]">{profile.status}</span> • Role: {accountRole || "umkm"} • Barokah Score: {profile.barokah_score || 0}/100
            </p>
            <p className="mt-2 text-sm font-semibold text-white/75">{user?.email}</p>
          </div>
          <button type="button" onClick={handleLogout} className="rounded-xl border border-red-200/50 bg-red-50 px-5 py-3 text-sm font-black text-red-700">
            Logout
          </button>
        </div>
      </div>

      <StatusNotice profile={profile} />

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
                  <p className="font-bold text-[#064E3B]">{formatDateTime(lead.clicked_at || lead.created_at)}</p>
                  <div className="mt-2 grid gap-2 text-sm text-[#1F2937]/68 sm:grid-cols-2">
                    <p><span className="font-bold text-[#1F2937]">Source:</span> {lead.source || "-"}</p>
                    <p><span className="font-bold text-[#1F2937]">User Type:</span> {lead.user_type || "-"}</p>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-[#064E3B]/20 bg-[#ECFDF5] p-5 text-center">
                  <p className="font-bold text-[#064E3B]">Belum ada lead masuk.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[22px] border border-[#D6A84F]/25 bg-[#FFF8E7] p-5 text-sm font-semibold text-[#064E3B] shadow-soft">
        Galeri dan testimoni yang diajukan UMKM akan ditinjau admin sebelum tampil publik.
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <GalleryManager
          items={gallery}
          uploading={uploadingGallery}
          onSubmit={handleGallerySubmit}
          onDelete={(id) => deleteAsset("umkm_gallery", id)}
        />
        <TestimonialManager
          items={testimonials}
          onSubmit={handleTestimonialSubmit}
          onDelete={(id) => deleteAsset("umkm_testimonials", id)}
        />
      </section>
    </main>
  );
}

function GalleryManager({ items, uploading, onSubmit, onDelete }) {
  return (
    <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <h2 className="font-display text-2xl font-bold text-[#064E3B]">Galeri</h2>
      <form onSubmit={onSubmit} className="mt-5 grid gap-3">
        <Input label="Upload Gambar" name="image" type="file" accept="image/*" />
        <Input label="Caption" name="caption" placeholder="Contoh: Paket nasi box jamaah" />
        <Input label="Urutan Tampil" name="sort_order" type="number" defaultValue="0" />
        <button type="submit" disabled={uploading} className="rounded-xl bg-[#064E3B] px-5 py-3 font-bold text-white disabled:opacity-60">
          {uploading ? "Mengupload..." : "Ajukan Galeri"}
        </button>
      </form>
      <div className="mt-5 grid gap-3">
        {items.length ? items.map((item) => (
          <AssetCard key={item.id} status={item.status} canDelete={canDeleteAsset(item.status)} onDelete={() => onDelete(item.id)}>
            <img src={item.image_url} alt={item.caption || "Galeri UMKM"} className="h-32 w-full rounded-xl object-cover" />
            <p className="mt-2 text-sm font-semibold text-[#1F2937]/72">{item.caption || "Tanpa caption"}</p>
            <p className="mt-1 text-xs text-[#1F2937]/55">Urutan: {item.sort_order || 0}</p>
          </AssetCard>
        )) : <EmptyPanel text="Belum ada galeri." />}
      </div>
    </div>
  );
}

function TestimonialManager({ items, onSubmit, onDelete }) {
  return (
    <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <h2 className="font-display text-2xl font-bold text-[#064E3B]">Testimoni</h2>
      <form onSubmit={onSubmit} className="mt-5 grid gap-3">
        <Input label="Nama Pelanggan" name="customer_name" required />
        <Input label="Tipe Pelanggan" name="customer_type" placeholder="Travel, KBIH, Jamaah" />
        <Input label="Rating" name="rating" type="number" min="1" max="5" defaultValue="5" required />
        <label className="label">
          Testimoni
          <textarea name="testimonial" rows={4} className="field resize-none" required />
        </label>
        <button type="submit" className="rounded-xl bg-[#064E3B] px-5 py-3 font-bold text-white">
          Ajukan Testimoni
        </button>
      </form>
      <div className="mt-5 grid gap-3">
        {items.length ? items.map((item) => (
          <AssetCard key={item.id} status={item.status} canDelete={canDeleteAsset(item.status)} onDelete={() => onDelete(item.id)}>
            <p className="font-black text-[#064E3B]">{item.customer_name}</p>
            <p className="text-sm text-[#1F2937]/55">{item.customer_type || "Pelanggan"} • {item.rating || 0}/5</p>
            <p className="mt-2 text-sm leading-6 text-[#1F2937]/70">{item.testimonial}</p>
          </AssetCard>
        )) : <EmptyPanel text="Belum ada testimoni." />}
      </div>
    </div>
  );
}

function AssetCard({ status, canDelete, onDelete, children }) {
  return (
    <article className="rounded-2xl bg-[#FFF8E7] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <StatusBadge status={status} />
        {canDelete && (
          <button type="button" onClick={onDelete} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
            Hapus
          </button>
        )}
      </div>
      {children}
    </article>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${styles[status] || styles.pending}`}>{status || "pending"}</span>;
}

function EmptyPanel({ text }) {
  return <p className="rounded-2xl border border-dashed border-[#064E3B]/15 bg-[#ECFDF5] p-5 text-center text-sm font-semibold text-[#064E3B]">{text}</p>;
}

function canDeleteAsset(status) {
  return status === "pending" || status === "rejected";
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

function StatusNotice({ profile }) {
  const status = profile.status || "pending";
  const content = {
    pending: {
      title: "Profil usaha Anda sedang menunggu verifikasi admin.",
      body: "Anda tetap dapat melengkapi data profil, galeri, dan testimoni, tetapi belum tampil publik.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    approved: {
      title: "Profil usaha Anda sudah disetujui.",
      body: "Dashboard penuh aktif dan profil UMKM dapat tampil di katalog publik RuteBarokah.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    rejected: {
      title: "Pendaftaran belum disetujui.",
      body: profile.verification_note || "Silakan periksa catatan admin atau hubungi RuteBarokah untuk tindak lanjut.",
      className: "border-red-200 bg-red-50 text-red-900",
    },
  }[status] || {
    title: "Status pendaftaran belum diketahui.",
    body: "Hubungi admin RuteBarokah untuk bantuan.",
    className: "border-[#064E3B]/15 bg-[#ECFDF5] text-[#064E3B]",
  };

  return (
    <section className={`mb-6 rounded-[22px] border p-5 shadow-soft ${content.className}`}>
      <h2 className="font-display text-2xl font-bold">{content.title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6">{content.body}</p>
      {profile.verification_note && status !== "rejected" && (
        <p className="mt-3 text-sm leading-6"><span className="font-black">Catatan admin:</span> {profile.verification_note}</p>
      )}
    </section>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
