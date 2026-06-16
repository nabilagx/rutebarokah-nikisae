"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, ImagePlus, LayoutDashboard, LogOut, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import ProtectedNotice from "@/components/mvp/ProtectedNotice.jsx";
import { categories, locations } from "@/lib/constants";
import { getAuthProfile } from "@/lib/authProfile";
import { formatRupiah, splitBadges } from "@/lib/formatters";
import { uploadUmkmGalleryImage } from "@/lib/uploadUmkmImage";

const tabs = ["Overview", "Profil Usaha", "Galeri", "Testimoni", "Leads"];

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
  const [activeTab, setActiveTab] = useState("Overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshAssetsFor = useCallback(async (umkmId) => {
    if (!umkmId) return;
    const [galleryResult, testimonialResult] = await Promise.all([
      supabase
        .from("umkm_gallery")
        .select("*")
        .eq("umkm_id", umkmId)
        .order("created_at", { ascending: false }),
      supabase
        .from("umkm_testimonials")
        .select("*")
        .eq("umkm_id", umkmId)
        .order("created_at", { ascending: false }),
    ]);
    setGallery(galleryResult.data || []);
    setTestimonials(testimonialResult.data || []);
  }, []);

  useEffect(() => {
    async function init() {
      const { user: currentUser, role } = await getAuthProfile();
      setUser(currentUser || null);

      if (!currentUser) {
        router.replace("/login");
        setChecking(false);
        return;
      }

      setAccountRole(role || "");

      if (role === "admin") {
        router.replace("/dashboard/admin");
        setChecking(false);
        return;
      }

      if (role !== "umkm") {
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
        await refreshAssetsFor(umkmData.id);
      }

      setChecking(false);
    }

    init();
  }, [refreshAssetsFor, router]);

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

  const leadSummary = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = leads.filter((lead) => new Date(lead.clicked_at || lead.created_at).toDateString() === todayKey).length;
    return {
      total: leads.length,
      today,
      last: leads[0]?.clicked_at || leads[0]?.created_at || null,
    };
  }, [leads]);

  const approvedGallery = useMemo(() => gallery.filter((item) => item.status === "approved" && item.is_active !== false), [gallery]);
  const approvedTestimonials = useMemo(() => testimonials.filter((item) => item.status === "approved"), [testimonials]);
  const mainBadge = splitBadges(profile?.badges)[0] || (profile?.status === "approved" ? "Terkurasi" : "Menunggu Verifikasi");

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
        title="Akun UMKM belum terhubung"
        description="Akun UMKM belum terhubung dengan profil usaha. Silakan hubungi admin."
      />
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const updatePayload = {
      ...payload,
      capacity_min: payload.capacity_min ? Number(payload.capacity_min) : null,
      capacity_max: payload.capacity_max ? Number(payload.capacity_max) : null,
      price_start: payload.price_start ? Number(payload.price_start) : null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("umkm_profiles")
      .update(updatePayload)
      .eq("id", profile.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProfile((current) => ({ ...current, ...updatePayload }));
    setEditingProfile(false);
    setMessage("Profil usaha berhasil diperbarui.");
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
      await refreshAssetsFor(profile.id);
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
    await refreshAssetsFor(profile.id);
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
    await refreshAssetsFor(profile.id);
  }

  async function updateGalleryItem(id, updates) {
    setMessage("");
    setError("");
    const { error: updateError } = await supabase
      .from("umkm_gallery")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("umkm_id", profile.id)
      .eq("status", "pending");

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Galeri pending berhasil diperbarui.");
    await refreshAssetsFor(profile.id);
  }

  async function updateTestimonialItem(id, updates) {
    setMessage("");
    setError("");
    const { error: updateError } = await supabase
      .from("umkm_testimonials")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("umkm_id", profile.id)
      .eq("status", "pending");

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Testimoni pending berhasil diperbarui.");
    await refreshAssetsFor(profile.id);
  }

  return (
    <main className="bg-[#FBFAF6]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-10">
        <BusinessHeader
          profile={profile}
          user={user}
          role={accountRole}
          mainBadge={mainBadge}
          onLogout={handleLogout}
        />

        <StatusNotice profile={profile} />

        <SummaryCards
          profile={profile}
          totalLeads={leadSummary.total}
          clicksToday={leadSummary.today}
          activeGallery={approvedGallery.length}
          approvedTestimonials={approvedTestimonials.length}
        />

        {(message || error) && (
          <div className="mt-6 grid gap-3">
            {message && <div className="rounded-2xl bg-[#ECFDF5] p-4 text-sm font-semibold text-[#064E3B]">{message}</div>}
            {error && <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
          </div>
        )}

        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="mt-6">
          {activeTab === "Overview" && (
            <OverviewTab
              profile={profile}
              leads={leadSummary}
              gallery={gallery}
              testimonials={testimonials}
            />
          )}
          {activeTab === "Profil Usaha" && (
            <ProfileTab
              profile={profile}
              formState={formState}
              editing={editingProfile}
              setEditing={setEditingProfile}
              onSave={handleSave}
            />
          )}
          {activeTab === "Galeri" && (
            <GalleryManager
              items={gallery}
              uploading={uploadingGallery}
              onSubmit={handleGallerySubmit}
              onUpdate={updateGalleryItem}
              onDelete={(id) => deleteAsset("umkm_gallery", id)}
            />
          )}
          {activeTab === "Testimoni" && (
            <TestimonialManager
              items={testimonials}
              onSubmit={handleTestimonialSubmit}
              onUpdate={updateTestimonialItem}
              onDelete={(id) => deleteAsset("umkm_testimonials", id)}
            />
          )}
          {activeTab === "Leads" && <LeadsTab leads={leads} summary={leadSummary} />}
        </section>
      </div>
    </main>
  );
}

function BusinessHeader({ profile, user, role, mainBadge, onLogout }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#064E3B]/10 bg-[#064E3B] text-white shadow-premium islamic-grid">
      <div className="grid gap-7 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#D6A84F]">Dashboard UMKM</span>
            <StatusBadge status={profile.status} />
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-black text-white">Role: {role?.toUpperCase() || "UMKM"}</span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">{profile.business_name || user?.email}</h1>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-white/76 sm:grid-cols-2 lg:grid-cols-3">
            <p>Email akun: <span className="text-white">{user?.email}</span></p>
            <p>ID pendaftaran: <span className="text-[#D6A84F]">{profile.registration_code || "-"}</span></p>
            <p>Badge utama: <span className="text-[#D6A84F]">{mainBadge}</span></p>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
          <p className="text-sm font-semibold text-white/70">Barokah Score</p>
          <p className="mt-1 font-display text-5xl font-bold text-[#D6A84F]">{profile.barokah_score || 0}</p>
          <div className="mt-5 grid gap-3">
            <Link href={`/vendors/${profile.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#064E3B]">
              <Eye size={17} /> Lihat Profil Publik
            </Link>
            <button type="button" onClick={onLogout} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/50 bg-red-50 px-5 py-3 text-sm font-black text-red-700">
              <LogOut size={17} /> Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCards({ profile, totalLeads, clicksToday, activeGallery, approvedTestimonials }) {
  const cards = [
    ["Total Leads", totalLeads],
    ["Klik WhatsApp", clicksToday],
    ["Galeri Aktif", activeGallery],
    ["Testimoni Approved", approvedTestimonials],
    ["Barokah Score", `${profile.barokah_score || 0}/100`],
    ["Harga Mulai", formatRupiah(profile.price_start)],
    ["Kapasitas", `${profile.capacity_min || 0}-${profile.capacity_max || 0} pax`],
  ];

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-[20px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold text-[#1F2937]/55">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#064E3B]">{value}</p>
        </div>
      ))}
    </section>
  );
}

function TabNav({ activeTab, setActiveTab }) {
  return (
    <nav className="mt-6 overflow-x-auto rounded-[20px] border border-[#064E3B]/10 bg-white p-2 shadow-soft">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-5 py-3 text-sm font-black transition ${activeTab === tab ? "bg-[#064E3B] text-white shadow-soft" : "text-[#1F2937]/68 hover:bg-[#ECFDF5] hover:text-[#064E3B]"}`}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
}

function OverviewTab({ profile, leads, gallery, testimonials }) {
  const latestGallery = gallery.slice(0, 3);
  const latestTestimonials = testimonials.slice(0, 2);
  const tips = [
    "Lengkapi foto layanan agar calon jamaah lebih percaya.",
    "Gunakan deskripsi yang jelas untuk kebutuhan travel, KBIH, dan rombongan.",
    "Pastikan nomor WhatsApp aktif supaya setiap lead cepat ditindaklanjuti.",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ECFDF5] text-[#064E3B]">
            <LayoutDashboard size={24} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#064E3B]">Ringkasan Performa</h2>
            <p className="mt-2 text-sm leading-6 text-[#1F2937]/65">
              Profil {profile.business_name} saat ini berstatus <strong>{profile.status || "pending"}</strong> dengan {leads.total} total lead WhatsApp.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MiniMetric label="Lead Hari Ini" value={leads.today} />
          <MiniMetric label="Terakhir Diklik" value={formatDateTime(leads.last)} />
          <MiniMetric label="Status Approval" value={profile.status || "pending"} />
        </div>
        <div className="mt-6 rounded-2xl bg-[#FFF8E7] p-5">
          <h3 className="font-black text-[#064E3B]">Tips optimasi profil</h3>
          <div className="mt-3 grid gap-2">
            {tips.map((tip) => <p key={tip} className="text-sm font-semibold leading-6 text-[#1F2937]/68">- {tip}</p>)}
          </div>
        </div>
        <Link href={`/vendors/${profile.id}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#064E3B] px-5 py-3 font-bold text-white">
          Lihat Profil Publik <ArrowRight size={17} />
        </Link>
      </section>

      <section className="grid gap-6">
        <PreviewPanel title="Preview Galeri Terbaru">
          {latestGallery.length ? (
            <div className="grid grid-cols-3 gap-3">
              {latestGallery.map((item) => (
                <img key={item.id} src={item.image_url} alt={item.caption || "Galeri UMKM"} className="h-24 rounded-2xl object-cover" />
              ))}
            </div>
          ) : <EmptyPanel text="Tampilan galeri akan muncul setelah Anda mengajukan dokumentasi layanan." />}
        </PreviewPanel>
        <PreviewPanel title="Preview Testimoni Terbaru">
          {latestTestimonials.length ? latestTestimonials.map((item) => (
            <div key={item.id} className="rounded-2xl bg-[#FFF8E7] p-4">
              <p className="font-black text-[#064E3B]">{item.customer_name}</p>
              <p className="mt-1 text-sm text-[#1F2937]/65">{renderStars(item.rating)} {item.customer_type || "Pelanggan"}</p>
              <p className="mt-2 text-sm leading-6 text-[#1F2937]/68">{item.testimonial}</p>
            </div>
          )) : <EmptyPanel text="Testimoni akan tampil setelah Anda mengajukan dan admin menyetujui." />}
        </PreviewPanel>
      </section>
    </div>
  );
}

function ProfileTab({ profile, formState, editing, setEditing, onSave }) {
  return (
    <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#064E3B]">Profil Usaha</h2>
          <p className="mt-1 text-sm text-[#1F2937]/62">Data utama yang dipakai untuk katalog vendor RuteBarokah.</p>
        </div>
        <button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064E3B] px-5 py-3 font-bold text-white">
          <Pencil size={17} /> {editing ? "Tutup Form" : "Edit Profil"}
        </button>
      </div>

      {!editing ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Nama usaha" value={profile.business_name} />
          <InfoItem label="Nama pemilik" value={profile.owner_name} />
          <InfoItem label="Kategori" value={profile.category} />
          <InfoItem label="Subkategori" value={profile.subcategory} />
          <InfoItem label="Lokasi" value={profile.location} />
          <InfoItem label="WhatsApp" value={profile.whatsapp} />
          <InfoItem label="Alamat" value={profile.address} className="md:col-span-2" />
          <InfoItem label="Kapasitas minimum" value={profile.capacity_min} />
          <InfoItem label="Kapasitas maksimum" value={profile.capacity_max} />
          <InfoItem label="Harga mulai" value={formatRupiah(profile.price_start)} />
          <InfoItem label="Image URL" value={profile.image_url} className="md:col-span-2 xl:col-span-3" />
          <InfoItem label="Deskripsi" value={profile.description} className="md:col-span-2 xl:col-span-3" />
        </div>
      ) : (
        <form onSubmit={onSave} className="mt-6 grid gap-4 md:grid-cols-2">
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
          <button type="submit" className="md:col-span-2 rounded-xl bg-[#064E3B] px-6 py-4 font-bold text-white shadow-soft">
            Simpan Perubahan
          </button>
        </form>
      )}
    </section>
  );
}

function GalleryManager({ items, uploading, onSubmit, onUpdate, onDelete }) {
  return (
    <div className="rounded-[24px] border border-[#064E3B]/10 bg-white p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ECFDF5] text-[#064E3B]"><ImagePlus size={22} /></span>
        <div>
          <h2 className="font-display text-2xl font-bold text-[#064E3B]">Galeri</h2>
          <p className="mt-1 text-sm font-semibold text-[#1F2937]/62">Galeri yang diajukan akan ditinjau admin sebelum tampil publik.</p>
        </div>
      </div>
      <InfoBox text="Konten yang sudah disetujui telah melalui verifikasi admin dan hanya dapat diubah melalui pengajuan ke admin." />
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-[20px] bg-[#FFF8E7] p-5 md:grid-cols-[1fr_1fr_150px_auto] md:items-end">
        <Input label="Upload Gambar" name="image" type="file" accept="image/*" />
        <Input label="Caption" name="caption" placeholder="Contoh: Paket nasi box jamaah" />
        <Input label="Urutan Tampil" name="sort_order" type="number" defaultValue="0" />
        <button type="submit" disabled={uploading} className="rounded-xl bg-[#064E3B] px-5 py-3 font-bold text-white disabled:opacity-60">
          {uploading ? "Mengupload..." : "Ajukan Galeri"}
        </button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length ? items.map((item) => (
          <GalleryAssetCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete}>
            <img src={item.image_url} alt={item.caption || "Galeri UMKM"} className="h-44 w-full rounded-2xl object-cover" />
            <p className="mt-3 font-semibold text-[#1F2937]/76">{item.caption || "Tanpa caption"}</p>
            <p className="mt-1 text-xs font-bold text-[#1F2937]/50">Urutan tampil: {item.sort_order || 0}</p>
          </GalleryAssetCard>
        )) : <div className="sm:col-span-2 lg:col-span-3"><EmptyPanel text="Tampilan galeri akan muncul setelah Anda mengajukan dokumentasi layanan." /></div>}
      </div>
    </div>
  );
}

function TestimonialManager({ items, onSubmit, onUpdate, onDelete }) {
  return (
    <div className="rounded-[24px] border border-[#064E3B]/10 bg-white p-6 shadow-soft">
      <h2 className="font-display text-2xl font-bold text-[#064E3B]">Testimoni</h2>
      <p className="mt-1 text-sm font-semibold text-[#1F2937]/62">Testimoni yang diajukan akan diverifikasi admin sebelum tampil publik.</p>
      <InfoBox text="Konten yang sudah disetujui telah melalui verifikasi admin dan hanya dapat diubah melalui pengajuan ke admin." />
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-[20px] bg-[#FFF8E7] p-5 md:grid-cols-2">
        <Input label="Nama Pelanggan" name="customer_name" required />
        <Input label="Tipe Pelanggan" name="customer_type" placeholder="Travel, KBIH, Jamaah" />
        <Input label="Rating" name="rating" type="number" min="1" max="5" defaultValue="5" required />
        <label className="label md:row-span-2">
          Testimoni
          <textarea name="testimonial" rows={5} className="field resize-none" required />
        </label>
        <button type="submit" className="rounded-xl bg-[#064E3B] px-5 py-3 font-bold text-white">
          Ajukan Testimoni
        </button>
      </form>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.length ? items.map((item) => (
          <TestimonialAssetCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete}>
            <p className="font-black text-[#064E3B]">{item.customer_name}</p>
            <p className="text-sm text-[#1F2937]/55">{item.customer_type || "Pelanggan"} - {renderStars(item.rating)}</p>
            <p className="mt-3 text-sm leading-6 text-[#1F2937]/70">{item.testimonial}</p>
          </TestimonialAssetCard>
        )) : <div className="md:col-span-2"><EmptyPanel text="Testimoni akan muncul setelah Anda mengajukan ulasan pelanggan." /></div>}
      </div>
    </div>
  );
}

function LeadsTab({ leads, summary }) {
  return (
    <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#064E3B]">Leads WhatsApp</h2>
          <p className="mt-1 text-sm text-[#1F2937]/62">Lead tercatat saat pengguna mengklik tombol WhatsApp pada profil vendor Anda.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniMetric label="Total leads" value={summary.total} />
          <MiniMetric label="Leads hari ini" value={summary.today} />
          <MiniMetric label="Terakhir diklik" value={formatDateTime(summary.last)} />
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        {leads.length ? leads.map((lead) => (
          <div key={lead.id} className="rounded-2xl border border-[#064E3B]/10 bg-[#FFF8E7] p-4">
            <p className="font-bold text-[#064E3B]">{formatDateTime(lead.clicked_at || lead.created_at)}</p>
            <div className="mt-2 grid gap-2 text-sm text-[#1F2937]/68 sm:grid-cols-2">
              <p><span className="font-bold text-[#1F2937]">Source:</span> {lead.source || "-"}</p>
              <p><span className="font-bold text-[#1F2937]">User Type:</span> {lead.user_type || "-"}</p>
            </div>
          </div>
        )) : (
          <EmptyPanel text="Belum ada lead masuk. Lead akan tercatat saat pengguna mengklik tombol WhatsApp pada profil vendor Anda." />
        )}
      </div>
    </section>
  );
}

function GalleryAssetCard({ item, onUpdate, onDelete, children }) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(item.caption || "");

  function saveEdit() {
    onUpdate(item.id, { caption });
    setEditing(false);
  }

  return (
    <AssetCardShell status={item.status}>
      {children}
      {editing && (
        <div className="mt-3 grid gap-2 rounded-2xl bg-[#FFF8E7] p-3">
          <input value={caption} onChange={(event) => setCaption(event.target.value)} className="field py-3" placeholder="Caption galeri" />
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} className="rounded-lg bg-[#064E3B] px-3 py-2 text-xs font-black text-white">Simpan</button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-[#064E3B]/15 px-3 py-2 text-xs font-black text-[#064E3B]">Batal</button>
          </div>
        </div>
      )}
      <AssetActions
        status={item.status}
        approvedText="Hubungi admin untuk perubahan"
        onEdit={() => setEditing(true)}
        onDelete={() => onDelete(item.id)}
      />
    </AssetCardShell>
  );
}

function TestimonialAssetCard({ item, onUpdate, onDelete, children }) {
  const [editing, setEditing] = useState(false);
  const [customerName, setCustomerName] = useState(item.customer_name || "");
  const [customerType, setCustomerType] = useState(item.customer_type || "");
  const [rating, setRating] = useState(item.rating || 5);
  const [testimonial, setTestimonial] = useState(item.testimonial || "");

  function saveEdit() {
    onUpdate(item.id, {
      customer_name: customerName,
      customer_type: customerType,
      rating: Number(rating || 5),
      testimonial,
    });
    setEditing(false);
  }

  return (
    <AssetCardShell status={item.status}>
      {children}
      {editing && (
        <div className="mt-3 grid gap-2 rounded-2xl bg-[#FFF8E7] p-3">
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="field py-3" placeholder="Nama pelanggan" />
          <input value={customerType} onChange={(event) => setCustomerType(event.target.value)} className="field py-3" placeholder="Tipe pelanggan" />
          <input type="number" min="1" max="5" value={rating} onChange={(event) => setRating(event.target.value)} className="field py-3" />
          <textarea value={testimonial} onChange={(event) => setTestimonial(event.target.value)} rows={4} className="field resize-none" />
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} className="rounded-lg bg-[#064E3B] px-3 py-2 text-xs font-black text-white">Simpan</button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-[#064E3B]/15 px-3 py-2 text-xs font-black text-[#064E3B]">Batal</button>
          </div>
        </div>
      )}
      <AssetActions
        status={item.status}
        approvedText="Testimoni yang sudah disetujui tidak dapat dihapus langsung. Hubungi admin untuk pengajuan perubahan."
        onEdit={() => setEditing(true)}
        onDelete={() => onDelete(item.id)}
      />
    </AssetCardShell>
  );
}

function AssetCardShell({ status, children }) {
  return (
    <article className="rounded-[20px] border border-[#064E3B]/10 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <StatusBadge status={status} />
        {status === "approved" && <VerifiedBadge />}
      </div>
      {children}
    </article>
  );
}

function AssetActions({ status, approvedText, onEdit, onDelete }) {
  if (status === "pending") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg border border-[#064E3B]/15 px-3 py-2 text-xs font-black text-[#064E3B]">
          <Pencil size={13} /> Edit
        </button>
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700">
          <Trash2 size={13} /> Hapus
        </button>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mt-4">
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700">
          <Trash2 size={13} /> Hapus
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return <p className="mt-4 rounded-2xl bg-[#ECFDF5] p-3 text-xs font-bold leading-5 text-[#064E3B]">{approvedText}</p>;
  }

  return null;
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
      <CheckCircle2 size={13} /> Terverifikasi
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${styles[status] || styles.pending}`}>{status || "pending"}</span>;
}

function EmptyPanel({ text }) {
  return <p className="rounded-2xl border border-dashed border-[#064E3B]/15 bg-[#ECFDF5] p-5 text-center text-sm font-semibold text-[#064E3B]">{text}</p>;
}

function InfoBox({ text }) {
  return <p className="mt-5 rounded-2xl border border-[#D6A84F]/25 bg-[#FFF8E7] p-4 text-sm font-semibold leading-6 text-[#064E3B]">{text}</p>;
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#064E3B]/10 bg-white px-4 py-3">
      <p className="text-xs font-bold text-[#1F2937]/52">{label}</p>
      <p className="mt-1 text-sm font-black text-[#064E3B]">{value ?? "-"}</p>
    </div>
  );
}

function PreviewPanel({ title, children }) {
  return (
    <div className="rounded-[24px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <h3 className="font-display text-xl font-bold text-[#064E3B]">{title}</h3>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#064E3B]/10 bg-[#FFF8E7] p-4 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1F2937]/45">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#1F2937]/75">{value || "-"}</p>
    </div>
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

function StatusNotice({ profile }) {
  const status = profile.status || "pending";
  const content = {
    pending: {
      title: "Profil usaha Anda sedang menunggu verifikasi admin.",
      body: "Anda tetap dapat melengkapi data profil, galeri, dan testimoni, tetapi belum tampil publik.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    approved: {
      title: "Profil usaha Anda sudah disetujui dan tampil di katalog publik RuteBarokah.",
      body: "Pastikan data layanan dan nomor WhatsApp selalu terbaru agar calon jamaah mudah menghubungi Anda.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    rejected: {
      title: "Pendaftaran belum disetujui. Silakan lihat catatan admin.",
      body: profile.verification_note || "Silakan periksa kembali data usaha atau hubungi admin RuteBarokah untuk tindak lanjut.",
      className: "border-red-200 bg-red-50 text-red-900",
    },
  }[status] || {
    title: "Status pendaftaran belum diketahui.",
    body: "Hubungi admin RuteBarokah untuk bantuan.",
    className: "border-[#064E3B]/15 bg-[#ECFDF5] text-[#064E3B]",
  };

  return (
    <section className={`mt-6 rounded-[22px] border p-5 shadow-soft ${content.className}`}>
      <h2 className="font-display text-2xl font-bold">{content.title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6">{content.body}</p>
      {profile.verification_note && status !== "rejected" && (
        <p className="mt-3 text-sm leading-6"><span className="font-black">Catatan admin:</span> {profile.verification_note}</p>
      )}
    </section>
  );
}

function renderStars(value = 0) {
  const rating = Math.round(Math.max(0, Math.min(5, Number(value) || 0)));
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
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
