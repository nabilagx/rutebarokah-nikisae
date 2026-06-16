"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Image,
  MapPin,
  MessageCircle,
  Star,
  UsersRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import ProtectedNotice from "@/components/mvp/ProtectedNotice.jsx";
import { categories, locations } from "@/lib/constants";
import { getAuthProfile } from "@/lib/authProfile";
import { normalizeWhatsapp, splitBadges, whatsappUrl } from "@/lib/formatters";

const requestStatuses = ["new", "contacted", "matched", "closed", "cancelled"];
const requesterTypes = ["travel", "kbih", "masjid", "keluarga_jamaah", "jamaah", "lainnya"];
const periods = ["Semua", "Hari ini", "7 hari terakhir", "30 hari terakhir"];
const leadSorts = ["Total klik terbanyak", "Klik hari ini terbanyak", "Terakhir diklik terbaru"];
const requestSorts = ["Request terbaru", "Tanggal acara terdekat", "Pax terbesar"];
const moderationStatuses = ["all", "pending", "approved", "rejected"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [allUmkm, setAllUmkm] = useState([]);
  const [pendingUmkm, setPendingUmkm] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leads, setLeads] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedLeadVendor, setSelectedLeadVendor] = useState(null);
  const [selectedUmkm, setSelectedUmkm] = useState(null);
  const [accountHelpUmkm, setAccountHelpUmkm] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const { user, role } = await getAuthProfile();

      if (!user) {
        router.replace("/login");
        setChecking(false);
        return;
      }

      setAdminEmail(user.email || "");

      if (role === "umkm") {
        router.replace("/dashboard/umkm");
        setChecking(false);
        return;
      }

      if (role !== "admin") {
        router.replace("/login");
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
      setChecking(false);
    }

    init();
    // loadDashboardData is intentionally defined as a stable page-level loader and called only during the initial auth guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function loadDashboardData() {
    const [vendorResult, requestResult, galleryResult, testimonialResult] = await Promise.all([
      supabase
        .from("umkm_profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("vendor_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("umkm_gallery")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("umkm_testimonials")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const allUmkmData = vendorResult.data || [];
    const vendorList = allUmkmData.map((vendor) => ({
      id: vendor.id,
      business_name: vendor.business_name,
      category: vendor.category,
      location: vendor.location,
      status: vendor.status,
    }));
    const vendorMap = new Map(vendorList.map((vendor) => [vendor.id, vendor]));
    const leadData = await fetchLeadsWithFallback();

    setAllUmkm(allUmkmData);
    setPendingUmkm(allUmkmData.filter((item) => item.status === "pending"));
    setVendors(vendorList);
    setRequests(requestResult.data || []);
    setLeads(leadData.map((lead) => ({ ...lead, vendor: vendorMap.get(lead.umkm_id) || null })));
    setGallery((galleryResult.data || []).map((item) => ({ ...item, vendor: vendorMap.get(item.umkm_id) || null })));
    setTestimonials((testimonialResult.data || []).map((item) => ({ ...item, vendor: vendorMap.get(item.umkm_id) || null })));
  }

  async function fetchLeadsWithFallback() {
    const leadResult = await supabase
      .from("leads")
      .select("*")
      .order("clicked_at", { ascending: false })
      .limit(300);

    if (!leadResult.error) return leadResult.data || [];

    console.error("Gagal mengambil leads berdasarkan clicked_at:", leadResult.error);
    const fallbackResult = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    return fallbackResult.data || [];
  }

  async function updateUmkm(id, updates) {
    const { error } = await supabase
      .from("umkm_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Data UMKM berhasil diperbarui.");
    await loadDashboardData();
  }

  async function updateRequestStatus(id, status) {
    const { data, error } = await supabase
      .from("vendor_requests")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
      return null;
    }

    setRequests((current) => current.map((item) => (item.id === id ? data : item)));
    setSelectedRequest((current) => (current?.id === id ? data : current));
    setMessage(`Status request diubah menjadi ${status}.`);
    return data;
  }

  async function handleRequestWhatsapp(request) {
    if (!request?.whatsapp) return;

    const updatedRequest = await updateRequestStatus(request.id, "contacted");
    const activeRequest = updatedRequest || request;
    const text = `[TESTING] Halo ${activeRequest.requester_name || "Bapak/Ibu"}, kami dari RuteBarokah. Kami sudah menerima request vendor untuk kebutuhan ${activeRequest.need_category || "-"} di ${activeRequest.location || "-"} dengan estimasi ${activeRequest.pax || 0} pax. Apakah kebutuhan ini masih tersedia untuk kami bantu cocokkan dengan UMKM mitra?`;

    window.open(whatsappUrl(activeRequest.whatsapp, text), "_blank", "noopener,noreferrer");
  }

  async function updateGallery(id, updates) {
    const { error } = await supabase
      .from("umkm_gallery")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Galeri berhasil diperbarui.");
    await loadDashboardData();
  }

  async function updateTestimonial(id, updates) {
    const { error } = await supabase
      .from("umkm_testimonials")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Testimoni berhasil diperbarui.");
    await loadDashboardData();
  }

  async function deleteRow(table, id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Data berhasil dihapus.");
    await loadDashboardData();
  }

  if (checking) return <LoadingState label="Memeriksa akses admin..." />;

  if (!isAdmin) {
    return (
      <ProtectedNotice
        title="Akses admin dibatasi"
        description="Silakan login dengan akun yang memiliki role admin pada tabel profiles."
      />
    );
  }

  return (
    <main className="mx-auto w-[min(1280px,calc(100%-32px))] py-10">
      <div className="mb-8 overflow-hidden rounded-[24px] bg-[#064E3B] p-7 text-white shadow-premium islamic-grid">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">Admin RuteBarokah</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Operasional matching RuteBarokah.</h1>
            <p className="mt-3 text-white/70">Pantau lead, kelola request vendor, validasi UMKM, dan moderasi galeri/testimoni.</p>
            <p className="mt-3 text-sm font-semibold text-white/80">{adminEmail}</p>
          </div>
          <button type="button" onClick={handleLogout} className="rounded-xl border border-red-200/50 bg-red-50 px-5 py-3 text-sm font-black text-red-700">
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-[#ECFDF5] p-4 text-sm font-semibold text-[#064E3B]">
          {message}
        </div>
      )}

      <section className="grid gap-6">
        <SectionNav active={activeSection} onChange={setActiveSection} />
        {activeSection === "overview" && (
          <OverviewSection allUmkm={allUmkm} pendingUmkm={pendingUmkm} leads={leads} requests={requests} gallery={gallery} testimonials={testimonials} />
        )}
        {activeSection === "leads" && <LeadsPanel leads={leads} onDetail={setSelectedLeadVendor} />}
        {activeSection === "requests" && (
          <VendorRequestsPanel
            requests={requests}
            onDetail={setSelectedRequest}
            onWhatsapp={handleRequestWhatsapp}
            onStatus={updateRequestStatus}
          />
        )}
        {activeSection === "umkm" && (
          <AllUmkmPanel
            items={allUmkm}
            onDetail={setSelectedUmkm}
            onUpdate={updateUmkm}
            onAccountHelp={setAccountHelpUmkm}
          />
        )}
        {activeSection === "pending" && (
          <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
            <h2 className="font-display text-2xl font-bold text-[#064E3B]">UMKM Pending</h2>
            <div className="mt-5 grid gap-4">
              {pendingUmkm.length ? pendingUmkm.map((item) => (
                <AdminUmkmCard key={item.id} item={item} onUpdate={updateUmkm} onDetail={setSelectedUmkm} />
              )) : (
                <p className="text-sm text-[#1F2937]/60">Belum ada UMKM pending.</p>
              )}
            </div>
          </div>
        )}
        {activeSection === "moderation" && (
          <ModerationPanel
            vendors={vendors}
            gallery={gallery}
            testimonials={testimonials}
            onGalleryUpdate={updateGallery}
            onTestimonialUpdate={updateTestimonial}
            onGalleryDelete={(id) => deleteRow("umkm_gallery", id)}
            onTestimonialDelete={(id) => deleteRow("umkm_testimonials", id)}
          />
        )}
      </section>

      {selectedRequest && (
        <VendorRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onWhatsapp={handleRequestWhatsapp}
          onStatus={updateRequestStatus}
          approvedVendors={allUmkm.filter((item) => item.status === "approved")}
        />
      )}

      {selectedLeadVendor && (
        <LeadDetailModal
          vendorSummary={selectedLeadVendor}
          onClose={() => setSelectedLeadVendor(null)}
        />
      )}

      {selectedUmkm && (
        <UmkmDetailModal
          item={selectedUmkm}
          onClose={() => setSelectedUmkm(null)}
          onUpdate={updateUmkm}
          onAccountHelp={setAccountHelpUmkm}
        />
      )}
      {accountHelpUmkm && (
        <AccountHelpModal item={accountHelpUmkm} onClose={() => setAccountHelpUmkm(null)} />
      )}
    </main>
  );
}

function SectionNav({ active, onChange }) {
  const items = [
    ["overview", "Overview"],
    ["leads", "Leads"],
    ["requests", "Vendor Requests"],
    ["umkm", "Semua UMKM"],
    ["pending", "UMKM Pending"],
    ["moderation", "Moderasi Konten"],
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#064E3B]/10 bg-white p-2 shadow-soft">
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black ${active === key ? "bg-[#064E3B] text-white" : "text-[#064E3B] hover:bg-[#ECFDF5]"}`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function OverviewSection({ allUmkm, pendingUmkm, leads, requests, gallery, testimonials }) {
  const approved = allUmkm.filter((item) => item.status === "approved").length;
  const rejected = allUmkm.filter((item) => item.status === "rejected").length;
  const withoutAccount = allUmkm.filter((item) => !item.user_id).length;
  const galleryPending = gallery.filter((item) => item.status === "pending").length;
  const testimonialPending = testimonials.filter((item) => item.status === "pending").length;

  return (
    <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <div>
        <h2 className="font-display text-3xl font-bold text-[#064E3B]">Overview Operasional</h2>
        <p className="mt-1 text-sm text-[#1F2937]/60">Ringkasan cepat untuk melihat kesehatan marketplace RuteBarokah.</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Total UMKM" value={allUmkm.length} />
        <SummaryCard label="UMKM Pending" value={pendingUmkm.length} />
        <SummaryCard label="UMKM Approved" value={approved} />
        <SummaryCard label="UMKM Rejected" value={rejected} />
        <SummaryCard label="Belum Punya Akun" value={withoutAccount} />
        <SummaryCard label="Total Leads" value={leads.length} />
        <SummaryCard label="Total Request Vendor" value={requests.length} />
        <SummaryCard label="Galeri Pending" value={galleryPending} />
        <SummaryCard label="Testimoni Pending" value={testimonialPending} />
      </div>
    </section>
  );
}

function AllUmkmPanel({ items, onDetail, onUpdate, onAccountHelp }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [account, setAccount] = useState("");
  const [sort, setSort] = useState("terbaru");

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const text = `${item.business_name || ""} ${item.owner_name || ""} ${item.owner_email || ""} ${item.registration_code || ""}`.toLowerCase();
        const accountStatus = item.user_id ? "connected" : "missing";
        return (
          text.includes(search.toLowerCase()) &&
          (status ? item.status === status : true) &&
          (category ? item.category === category : true) &&
          (location ? item.location === location : true) &&
          (account ? accountStatus === account : true)
        );
      })
      .sort((a, b) => {
        if (sort === "nama") return String(a.business_name || "").localeCompare(String(b.business_name || ""));
        if (sort === "score") return Number(b.barokah_score || 0) - Number(a.barokah_score || 0);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [items, search, status, category, location, account, sort]);

  return (
    <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#064E3B]">Semua UMKM</h2>
          <p className="mt-1 text-sm text-[#1F2937]/60">Kelola seluruh UMKM, status akun, kurasi, featured, dan public listing.</p>
          <p className="mt-2 text-sm font-semibold text-[#064E3B]">Catatan: "Belum Ada Akun" bukan error. Ini biasanya hanya untuk data lama, dummy, atau import manual.</p>
        </div>
        <span className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-black text-[#064E3B]">{filtered.length} UMKM</span>
      </div>
      <div className="mt-5 grid gap-3 rounded-2xl bg-[#FFF8E7] p-4 md:grid-cols-3 xl:grid-cols-6">
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="field py-3" placeholder="Cari nama/owner/email/ID" />
        <SelectBare value={status} onChange={setStatus} options={["", "pending", "approved", "rejected", "suspended"]} placeholder="Semua status" />
        <SelectBare value={category} onChange={setCategory} options={["", ...categories]} placeholder="Semua kategori" />
        <SelectBare value={location} onChange={setLocation} options={["", ...locations]} placeholder="Semua lokasi" />
        <SelectBare value={account} onChange={setAccount} options={["", "connected", "missing"]} placeholder="Semua akun" />
        <SelectBare value={sort} onChange={setSort} options={["terbaru", "nama", "score"]} />
      </div>
      <div className="mt-5 hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-[#064E3B]/60">
            <tr className="border-b border-[#064E3B]/10">
              <th className="py-3">Nama UMKM</th>
              <th>Email Pendaftar</th>
              <th>WhatsApp</th>
              <th>ID Pendaftaran</th>
              <th>Kategori</th>
              <th>Lokasi</th>
              <th>Status</th>
              <th>Akun</th>
              <th>Score</th>
              <th>Featured</th>
              <th>Tanggal Daftar</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map((item) => (
              <tr key={item.id} className="border-b border-[#064E3B]/8 align-top">
                <td className="py-4 font-black text-[#064E3B]">{item.business_name || "-"}</td>
                <td>{item.owner_email || "-"}</td>
                <td>{formatWhatsapp(item.whatsapp)}</td>
                <td className="font-semibold">{item.registration_code || "-"}</td>
                <td><BadgeSoft>{item.category || "-"}</BadgeSoft></td>
                <td>{item.location || "-"}</td>
                <td><StatusBadge status={item.status || "pending"} /></td>
                <td><AccountBadge connected={Boolean(item.user_id)} /></td>
                <td className="font-black">{item.barokah_score || 0}</td>
                <td>{item.is_featured ? "Ya" : "Tidak"}</td>
                <td>{formatDate(item.created_at)}</td>
                <td>
                  <RowActions item={item} onDetail={onDetail} onUpdate={onUpdate} onAccountHelp={onAccountHelp} />
                </td>
              </tr>
            )) : (
              <tr><td colSpan="12" className="py-6 text-center text-[#1F2937]/60">Tidak ada UMKM sesuai filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid gap-3 lg:hidden">
        {filtered.length ? filtered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[#064E3B]/10 bg-[#FFF8E7] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-[#064E3B]">{item.business_name || "-"}</h3>
                <p className="mt-1 text-sm text-[#1F2937]/62">{item.category || "-"} • {item.location || "-"}</p>
              </div>
              <StatusBadge status={item.status || "pending"} />
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div><p className="text-xs font-black uppercase text-[#064E3B]/55">Akun</p><AccountBadge connected={Boolean(item.user_id)} /></div>
              <div><p className="text-xs font-black uppercase text-[#064E3B]/55">Score</p><p className="font-black">{item.barokah_score || 0}</p></div>
              <div><p className="text-xs font-black uppercase text-[#064E3B]/55">Daftar</p><p className="font-semibold">{formatDate(item.created_at)}</p></div>
            </div>
            <div className="mt-4">
              <RowActions item={item} onDetail={onDetail} onUpdate={onUpdate} onAccountHelp={onAccountHelp} />
            </div>
          </article>
        )) : (
          <EmptyText text="Tidak ada UMKM sesuai filter." />
        )}
      </div>
    </section>
  );
}

function RowActions({ item, onDetail, onUpdate, onAccountHelp }) {
  const status = item.status || "pending";

  const baseButton = "rounded-lg px-3 py-2 text-sm font-bold";
  const detailButton = (
    <button type="button" onClick={() => onDetail(item)} className={`${baseButton} bg-[#064E3B] text-white`}>
      Detail
    </button>
  );
  const editButton = (
    <button type="button" onClick={() => onDetail(item)} className={`${baseButton} border border-[#064E3B]/15 text-[#064E3B]`}>
      Edit
    </button>
  );
  const accountButton = !item.user_id && (
    <button type="button" onClick={() => onAccountHelp(item)} className={`${baseButton} bg-[#FFF8E7] text-[#064E3B]`}>
      Buat / Hubungkan Akun
    </button>
  );

  if (status === "pending") {
    return (
      <div className="flex flex-wrap gap-2">
        {detailButton}
        {accountButton}
        <button type="button" onClick={() => confirm("Approve UMKM ini?") && approveUmkmFromRow(item, onUpdate)} className={`${baseButton} bg-emerald-50 text-emerald-700`}>
          Approve
        </button>
        <button type="button" onClick={() => confirm("Reject UMKM ini?") && onUpdate(item.id, { status: "rejected", rejected_at: new Date().toISOString() })} className={`${baseButton} bg-red-50 text-red-700`}>
          Reject
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex flex-wrap gap-2">
        {detailButton}
        {editButton}
        {accountButton}
        <button type="button" onClick={() => onUpdate(item.id, { status: "suspended", updated_at: new Date().toISOString() })} className={`${baseButton} bg-gray-100 text-gray-700`}>
          Suspend
        </button>
        <a href={`/vendors/${item.id}`} target="_blank" rel="noreferrer" className={`${baseButton} bg-[#FFF8E7] text-[#064E3B]`}>
          Public
        </a>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex flex-wrap gap-2">
        {detailButton}
        {accountButton}
        <button type="button" onClick={() => confirm("Re-Approve UMKM ini?") && approveUmkmFromRow(item, onUpdate)} className={`${baseButton} bg-emerald-50 text-emerald-700`}>
          Re-Approve
        </button>
        {editButton}
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="flex flex-wrap gap-2">
        {detailButton}
        {accountButton}
        <button type="button" onClick={() => confirm("Aktifkan UMKM ini kembali?") && approveUmkmFromRow(item, onUpdate)} className={`${baseButton} bg-emerald-50 text-emerald-700`}>
          Activate
        </button>
        {editButton}
      </div>
    );
  }

  return <div className="flex flex-wrap gap-2">{detailButton}{accountButton}{editButton}</div>;
}

function LeadsPanel({ leads, onDetail }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [period, setPeriod] = useState("Semua");
  const [sort, setSort] = useState("Total klik terbanyak");

  const periodLeads = useMemo(() => leads.filter((lead) => matchesPeriod(getLeadDate(lead), period)), [leads, period]);
  const summaries = useMemo(() => aggregateLeads(periodLeads), [periodLeads]);

  const filteredSummaries = useMemo(() => {
    return summaries
      .filter((item) => {
        const text = `${item.vendor.business_name || ""}`.toLowerCase();
        const matchSearch = text.includes(search.toLowerCase());
        const matchCategory = category ? item.vendor.category === category : true;
        const matchLocation = location ? item.vendor.location === location : true;
        return matchSearch && matchCategory && matchLocation;
      })
      .sort((a, b) => {
        if (sort === "Klik hari ini terbanyak") return b.clicksToday - a.clicksToday;
        if (sort === "Terakhir diklik terbaru") return new Date(b.lastClickedAt || 0) - new Date(a.lastClickedAt || 0);
        return b.totalClicks - a.totalClicks;
      });
  }, [summaries, search, category, location, sort]);

  const categorySummary = useMemo(() => aggregateCategories(periodLeads), [periodLeads]);
  const summary = useMemo(() => {
    const today = new Date().toDateString();
    const topVendor = summaries[0];
    const topCategory = categorySummary[0];
    return {
      total: periodLeads.length,
      today: periodLeads.filter((lead) => {
        const date = getLeadDate(lead);
        return date ? new Date(date).toDateString() === today : false;
      }).length,
      topVendor: topVendor ? `${topVendor.vendor.business_name} (${topVendor.totalClicks})` : "-",
      topCategory: topCategory ? `${topCategory.category} (${topCategory.totalClicks})` : "-",
    };
  }, [periodLeads, summaries, categorySummary]);

  return (
    <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#064E3B]">Leads WhatsApp</h2>
          <p className="mt-1 text-sm text-[#1F2937]/60">Tampilan utama berupa agregasi per UMKM, log mentah hanya muncul di detail.</p>
        </div>
        <StatusBadge status="website" label="Aggregated First" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total Leads" value={summary.total} />
        <SummaryCard label="Leads Hari Ini" value={summary.today} />
        <SummaryCard label="Vendor Paling Banyak Diklik" value={summary.topVendor} />
        <SummaryCard label="Kategori Paling Banyak Diklik" value={summary.topCategory} />
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-[#FFF8E7] p-4 md:grid-cols-5">
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="field py-3" placeholder="Cari nama UMKM" />
        <SelectBare value={category} onChange={setCategory} options={["", ...categories]} placeholder="Semua kategori" />
        <SelectBare value={location} onChange={setLocation} options={["", ...locations]} placeholder="Semua lokasi" />
        <SelectBare value={period} onChange={setPeriod} options={periods} />
        <SelectBare value={sort} onChange={setSort} options={leadSorts} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-[#064E3B]/60">
            <tr className="border-b border-[#064E3B]/10">
              <th className="py-3">Nama UMKM</th>
              <th>Kategori</th>
              <th>Lokasi</th>
              <th>Total Klik</th>
              <th>Klik Hari Ini</th>
              <th>Terakhir Diklik</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSummaries.length ? filteredSummaries.map((item) => (
              <tr key={item.umkmId} className="border-b border-[#064E3B]/8">
                <td className="py-4 font-black text-[#064E3B]">{item.vendor.business_name}</td>
                <td><BadgeSoft>{item.vendor.category || "-"}</BadgeSoft></td>
                <td>{item.vendor.location || "-"}</td>
                <td className="font-black">{item.totalClicks}</td>
                <td className="font-black">{item.clicksToday}</td>
                <td>{formatDateTime(item.lastClickedAt)}</td>
                <td>
                  <button type="button" onClick={() => onDetail(item)} className="rounded-xl bg-[#064E3B] px-4 py-2 font-bold text-white">
                    Detail
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="py-6 text-center text-[#1F2937]/60">Belum ada leads sesuai filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl border border-[#064E3B]/10 bg-[#F7FBF4] p-4">
        <h3 className="font-display text-2xl font-bold text-[#064E3B]">Ringkasan Kategori</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {categorySummary.length ? categorySummary.map((item) => (
            <div key={item.category} className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="font-black text-[#064E3B]">{item.category}</p>
              <p className="mt-1 text-sm text-[#1F2937]/65">{item.totalClicks} klik • {item.vendorCount} vendor</p>
              <p className="mt-2 text-xs font-semibold text-[#1F2937]/58">Vendor teratas: {item.topVendor}</p>
            </div>
          )) : <p className="text-sm text-[#1F2937]/60">Belum ada ringkasan kategori.</p>}
        </div>
      </div>
    </section>
  );
}

function VendorRequestsPanel({ requests, onDetail, onWhatsapp, onStatus }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sort, setSort] = useState("Request terbaru");

  const filteredRequests = useMemo(() => {
    const now = startOfDay(new Date());
    return requests
      .filter((item) => {
        const text = `${item.requester_name || ""} ${item.organization_name || ""}`.toLowerCase();
        const eventDate = item.event_date ? startOfDay(new Date(item.event_date)) : null;
        const matchDate =
          dateFilter === "all" ||
          (dateFilter === "upcoming" && eventDate && eventDate >= now) ||
          (dateFilter === "past" && eventDate && eventDate < now);
        return (
          text.includes(search.toLowerCase()) &&
          (status ? item.status === status : true) &&
          (type ? item.requester_type === type : true) &&
          (category ? item.need_category === category : true) &&
          (location ? item.location === location : true) &&
          matchDate
        );
      })
      .sort((a, b) => {
        if (sort === "Tanggal acara terdekat") return new Date(a.event_date || "2999-01-01") - new Date(b.event_date || "2999-01-01");
        if (sort === "Pax terbesar") return Number(b.pax || 0) - Number(a.pax || 0);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [requests, search, status, type, category, location, dateFilter, sort]);

  return (
    <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#064E3B]">Vendor Requests</h2>
          <p className="mt-1 text-sm text-[#1F2937]/60">Filter request untuk alur manual matching travel, KBIH, masjid, dan jamaah.</p>
        </div>
        <span className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-black text-[#064E3B]">{filteredRequests.length} request</span>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-[#FFF8E7] p-4 md:grid-cols-4 lg:grid-cols-7">
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="field py-3" placeholder="Cari requester/organisasi" />
        <SelectBare value={status} onChange={setStatus} options={["", ...requestStatuses]} placeholder="Semua status" />
        <SelectBare value={type} onChange={setType} options={["", ...requesterTypes]} placeholder="Semua tipe" />
        <SelectBare value={category} onChange={setCategory} options={["", ...categories]} placeholder="Semua kategori" />
        <SelectBare value={location} onChange={setLocation} options={["", ...locations]} placeholder="Semua lokasi" />
        <SelectBare value={dateFilter} onChange={setDateFilter} options={["all", "upcoming", "past"]} />
        <SelectBare value={sort} onChange={setSort} options={requestSorts} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-[#064E3B]/60">
            <tr className="border-b border-[#064E3B]/10">
              <th className="py-3">Requester</th>
              <th>Organisasi</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Lokasi</th>
              <th>Tanggal Acara</th>
              <th>Pax</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length ? filteredRequests.map((item) => (
              <tr key={item.id} className="border-b border-[#064E3B]/8 align-top">
                <td className="py-4 font-black text-[#064E3B]">{item.requester_name || "-"}</td>
                <td>{item.organization_name || "-"}</td>
                <td>{item.requester_type || "-"}</td>
                <td><BadgeSoft>{item.need_category || "-"}</BadgeSoft></td>
                <td>{item.location || "-"}</td>
                <td>{formatDate(item.event_date)}</td>
                <td>{item.pax || 0}</td>
                <td><StatusBadge status={item.status || "new"} /></td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onDetail(item)} className="rounded-lg border border-[#064E3B]/15 px-3 py-2 font-bold text-[#064E3B]">Detail</button>
                    <button type="button" onClick={() => onWhatsapp(item)} className="rounded-lg bg-[#064E3B] px-3 py-2 font-bold text-white">WhatsApp</button>
                    <select value={item.status || "new"} onChange={(event) => onStatus(item.id, event.target.value)} className="rounded-lg border border-[#064E3B]/15 bg-white px-2 py-2 font-semibold">
                      {requestStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" className="py-6 text-center text-[#1F2937]/60">Belum ada request sesuai filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VendorRequestModal({ request, onClose, onWhatsapp, onStatus, approvedVendors = [] }) {
  const [matchedUmkmId, setMatchedUmkmId] = useState("");
  const recommendations = approvedVendors
    .filter((vendor) => {
      const matchCategory = request.need_category ? vendor.category === request.need_category : true;
      const matchLocation = request.location ? vendor.location === request.location : true;
      return matchCategory || matchLocation;
    })
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#001B14]/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-premium md:p-7">
        <ModalHeader eyebrow="Detail Vendor Request" title={request.requester_name || "Pemohon"} onClose={onClose} />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <DetailItem label="Nama Requester" value={request.requester_name} />
          <DetailItem label="Organisasi" value={request.organization_name} />
          <DetailItem label="Tipe Requester" value={request.requester_type} />
          <DetailItem label="Kategori Kebutuhan" value={request.need_category} />
          <DetailItem label="Lokasi" value={request.location} icon={MapPin} />
          <DetailItem label="Tanggal Event" value={formatDate(request.event_date)} icon={CalendarDays} />
          <DetailItem label="Jumlah Pax" value={request.pax ? `${request.pax} pax` : "-"} icon={UsersRound} />
          <DetailItem label="WhatsApp" value={formatWhatsapp(request.whatsapp)} strong />
          <DetailItem label="Status" value={request.status || "new"} strong />
          <DetailItem label="Tanggal Masuk" value={formatDateTime(request.created_at)} />
          <div className="rounded-2xl bg-[#FFF8E7] p-4 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#064E3B]/60">Catatan</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#1F2937]/72">{request.notes || "-"}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr]">
          <button type="button" onClick={() => onWhatsapp(request)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064E3B] px-5 py-3.5 font-bold text-white hover:bg-[#043c2e]">
            <MessageCircle size={18} />
            Hubungi via WhatsApp
          </button>
          <a href={`https://wa.me/${normalizeWhatsapp(request.whatsapp || "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#064E3B]/15 bg-white px-5 py-3.5 font-bold text-[#064E3B] hover:bg-[#ECFDF5]">
            <ExternalLink size={18} />
            Buka Nomor Saja
          </a>
        </div>
        <div className="mt-5 rounded-2xl bg-[#FFF8E7] p-4">
          <h4 className="font-display text-2xl font-bold text-[#064E3B]">Matched UMKM</h4>
          <p className="mt-1 text-sm text-[#1F2937]/62">Pilih UMKM approved yang cocok. Untuk MVP, pilihan ini membantu operasional dan tombol akan menandai request sebagai matched.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <select value={matchedUmkmId} onChange={(event) => setMatchedUmkmId(event.target.value)} className="field py-3">
              <option value="">Pilih UMKM approved</option>
              {approvedVendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.business_name} - {vendor.category} - {vendor.location}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => matchedUmkmId && onStatus(request.id, "matched")}
              className="rounded-xl bg-[#064E3B] px-5 py-3 font-black text-white disabled:opacity-50"
              disabled={!matchedUmkmId}
            >
              Tandai Matched
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {recommendations.length ? recommendations.map((vendor) => (
              <div key={vendor.id} className="rounded-xl bg-white p-3 text-sm">
                <span className="font-black text-[#064E3B]">{vendor.business_name}</span>
                <span className="text-[#1F2937]/60"> • {vendor.category || "-"} • {vendor.location || "-"}</span>
              </div>
            )) : <p className="text-sm text-[#1F2937]/60">Belum ada rekomendasi berdasarkan kategori/lokasi.</p>}
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {requestStatuses.filter((status) => status !== "new").map((status) => (
            <button key={status} type="button" onClick={() => onStatus(request.id, status)} className="rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm font-black capitalize text-[#064E3B] hover:bg-[#D9F7EA]">
              Mark as {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadDetailModal({ vendorSummary, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#001B14]/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-premium md:p-7">
        <ModalHeader eyebrow="Detail Aktivitas Lead" title={vendorSummary.vendor.business_name} onClose={onClose} />
        <div className="mt-5 grid gap-3">
          {vendorSummary.logs.length ? vendorSummary.logs.map((lead) => (
            <div key={lead.id} className="grid gap-3 rounded-2xl bg-[#FFF8E7] p-4 md:grid-cols-5">
              <DetailMini label="Clicked At" value={formatDateTime(getLeadDate(lead))} />
              <DetailMini label="Source" value={lead.source || "-"} />
              <DetailMini label="User Type" value={lead.user_type || "-"} />
              <DetailMini label="Page Source" value={lead.page_source || "-"} />
              <DetailMini label="Action Type" value={lead.action_type || "-"} />
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-[#064E3B]/20 bg-[#ECFDF5] p-6 text-center font-semibold text-[#064E3B]">
              Belum ada aktivitas detail untuk vendor ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModerationPanel({ vendors, gallery, testimonials, onGalleryUpdate, onTestimonialUpdate, onGalleryDelete, onTestimonialDelete }) {
  return (
    <section className="rounded-[24px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <h2 className="font-display text-3xl font-bold text-[#064E3B]">Moderasi Galeri & Testimoni</h2>
        <p className="mt-1 text-sm text-[#1F2937]/60">Admin dapat approve, reject, edit, atau delete konten yang diajukan UMKM.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <GalleryModeration items={gallery} vendors={vendors} onUpdate={onGalleryUpdate} onDelete={onGalleryDelete} />
        <TestimonialModeration items={testimonials} vendors={vendors} onUpdate={onTestimonialUpdate} onDelete={onTestimonialDelete} />
      </div>
    </section>
  );
}

function GalleryModeration({ items, vendors, onUpdate, onDelete }) {
  const [status, setStatus] = useState("pending");
  const [vendorId, setVendorId] = useState("");
  const filtered = items.filter((item) => (status === "all" || item.status === status) && (vendorId ? item.umkm_id === vendorId : true));

  return (
    <div className="rounded-[22px] bg-[#FFF8E7] p-4">
      <ModerationHeader icon={Image} title="Galeri Pending" status={status} setStatus={setStatus} vendorId={vendorId} setVendorId={setVendorId} vendors={vendors} />
      <div className="mt-4 grid gap-3">
        {filtered.length ? filtered.map((item) => (
          <GalleryModerationCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
        )) : <EmptyText text="Tidak ada galeri sesuai filter." />}
      </div>
    </div>
  );
}

function GalleryModerationCard({ item, onUpdate, onDelete }) {
  const [caption, setCaption] = useState(item.caption || "");
  const [sortOrder, setSortOrder] = useState(item.sort_order || 0);
  const [active, setActive] = useState(Boolean(item.is_active));
  const [showDetail, setShowDetail] = useState(false);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <img src={item.image_url} alt={item.caption || "Galeri UMKM"} className="h-40 w-full rounded-xl object-cover" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-black text-[#064E3B]">{item.vendor?.business_name || "UMKM"}</p>
        <StatusBadge status={item.status} />
      </div>
      {showDetail && (
        <div className="mt-3 rounded-xl bg-[#FFF8E7] p-3 text-sm leading-6 text-[#1F2937]/68">
          <p><span className="font-bold">Caption:</span> {item.caption || "-"}</p>
          <p><span className="font-bold">Sort order:</span> {item.sort_order || 0}</p>
          <p><span className="font-bold">Aktif:</span> {item.is_active ? "Ya" : "Tidak"}</p>
          <p><span className="font-bold">Created:</span> {formatDateTime(item.created_at)}</p>
        </div>
      )}
      <div className="mt-3 grid gap-2">
        <input value={caption} onChange={(event) => setCaption(event.target.value)} className="field py-3" placeholder="Caption" />
        <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="field py-3" placeholder="Sort order" />
        <label className="flex items-center gap-2 text-sm font-semibold text-[#064E3B]">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Aktif tampil publik
        </label>
      </div>
      <ModerationActions
        onDetail={() => setShowDetail((value) => !value)}
        onSave={() => onUpdate(item.id, { caption, sort_order: Number(sortOrder || 0), is_active: active })}
        onApprove={() => onUpdate(item.id, { status: "approved", caption, sort_order: Number(sortOrder || 0), is_active: active })}
        onReject={() => onUpdate(item.id, { status: "rejected" })}
        onDelete={() => onDelete(item.id)}
      />
    </article>
  );
}

function TestimonialModeration({ items, vendors, onUpdate, onDelete }) {
  const [status, setStatus] = useState("pending");
  const [vendorId, setVendorId] = useState("");
  const filtered = items.filter((item) => (status === "all" || item.status === status) && (vendorId ? item.umkm_id === vendorId : true));

  return (
    <div className="rounded-[22px] bg-[#FFF8E7] p-4">
      <ModerationHeader icon={Star} title="Testimoni Pending" status={status} setStatus={setStatus} vendorId={vendorId} setVendorId={setVendorId} vendors={vendors} />
      <div className="mt-4 grid gap-3">
        {filtered.length ? filtered.map((item) => (
          <TestimonialModerationCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
        )) : <EmptyText text="Tidak ada testimoni sesuai filter." />}
      </div>
    </div>
  );
}

function TestimonialModerationCard({ item, onUpdate, onDelete }) {
  const [customerName, setCustomerName] = useState(item.customer_name || "");
  const [customerType, setCustomerType] = useState(item.customer_type || "");
  const [rating, setRating] = useState(item.rating || 5);
  const [testimonial, setTestimonial] = useState(item.testimonial || "");
  const [showDetail, setShowDetail] = useState(false);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black text-[#064E3B]">{item.vendor?.business_name || "UMKM"}</p>
        <StatusBadge status={item.status} />
      </div>
      {showDetail && (
        <div className="mt-3 rounded-xl bg-[#FFF8E7] p-3 text-sm leading-6 text-[#1F2937]/68">
          <p><span className="font-bold">Customer:</span> {item.customer_name || "-"}</p>
          <p><span className="font-bold">Type:</span> {item.customer_type || "-"}</p>
          <p><span className="font-bold">Rating:</span> {item.rating || 0}/5</p>
          <p><span className="font-bold">Created:</span> {formatDateTime(item.created_at)}</p>
        </div>
      )}
      <div className="mt-3 grid gap-2">
        <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="field py-3" placeholder="Nama pelanggan" />
        <input value={customerType} onChange={(event) => setCustomerType(event.target.value)} className="field py-3" placeholder="Tipe pelanggan" />
        <input type="number" min="1" max="5" value={rating} onChange={(event) => setRating(event.target.value)} className="field py-3" />
        <textarea value={testimonial} onChange={(event) => setTestimonial(event.target.value)} rows={4} className="field resize-none" />
      </div>
      <ModerationActions
        onDetail={() => setShowDetail((value) => !value)}
        onSave={() => onUpdate(item.id, { customer_name: customerName, customer_type: customerType, rating: Number(rating || 5), testimonial })}
        onApprove={() => onUpdate(item.id, { status: "approved", customer_name: customerName, customer_type: customerType, rating: Number(rating || 5), testimonial })}
        onReject={() => onUpdate(item.id, { status: "rejected" })}
        onDelete={() => onDelete(item.id)}
      />
    </article>
  );
}

function AdminUmkmCard({ item, onUpdate, onDetail }) {
  const [score, setScore] = useState(item.barokah_score || 0);
  const [badges, setBadges] = useState(splitBadges(item.badges).join(", "));
  const [featured, setFeatured] = useState(Boolean(item.is_featured));
  const [verificationNote, setVerificationNote] = useState(item.verification_note || "");

  function approveUmkm() {
    if (!confirm("Approve UMKM ini?")) return;
    approveUmkmFromRow({ ...item, barokah_score: score, badges, verification_note: verificationNote, is_featured: featured }, onUpdate);
  }

  function rejectUmkm() {
    if (!confirm("Reject UMKM ini?")) return;
    onUpdate(item.id, {
      status: "rejected",
      rejected_at: new Date().toISOString(),
      verification_note: verificationNote || "Pendaftaran belum dapat disetujui. Silakan lengkapi atau perbaiki data usaha.",
    });
  }

  return (
    <div className="rounded-3xl border border-[#D6A84F]/20 bg-[#FFF8E7] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-[#064E3B]">{item.business_name}</h3>
          <p className="mt-1 text-sm text-[#1F2937]/65">{item.category} • {item.location}</p>
          <p className="mt-2 text-sm leading-6 text-[#1F2937]/65">{item.description}</p>
        </div>
        <div className="flex gap-2">
          {onDetail && <button type="button" onClick={() => onDetail(item)} className="rounded-xl border border-[#064E3B]/15 bg-white px-4 py-2 text-sm font-bold text-[#064E3B]">Detail</button>}
          <button type="button" onClick={approveUmkm} className="rounded-xl bg-[#064E3B] px-4 py-2 text-sm font-bold text-white">Approve</button>
          <button type="button" onClick={rejectUmkm} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Reject</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr_auto]">
        <label className="label">Score<input type="number" value={score} onChange={(event) => setScore(event.target.value)} className="field" /></label>
        <label className="label">Badges<input value={badges} onChange={(event) => setBadges(event.target.value)} className="field" placeholder="Terverifikasi, Halal, Cepat" /></label>
        <label className="flex items-center gap-2 self-end rounded-2xl bg-white px-4 py-3 font-semibold text-[#064E3B]">
          <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
          Featured
        </label>
      </div>
      <label className="label mt-3">
        Catatan Verifikasi
        <textarea
          value={verificationNote}
          onChange={(event) => setVerificationNote(event.target.value)}
          rows={3}
          className="field resize-none"
          placeholder="Catatan untuk UMKM, terutama jika ditolak."
        />
      </label>
    </div>
  );
}

function UmkmDetailModal({ item, onClose, onUpdate, onAccountHelp }) {
  const [score, setScore] = useState(item.barokah_score || 0);
  const [badges, setBadges] = useState(splitBadges(item.badges).join(", "));
  const [featured, setFeatured] = useState(Boolean(item.is_featured));
  const [note, setNote] = useState(item.verification_note || "");

  function saveChanges(extra = {}) {
    onUpdate(item.id, {
      barokah_score: Number(score || 0),
      badges: splitBadges(badges),
      is_featured: featured,
      verification_note: note || null,
      ...extra,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#001B14]/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-premium md:p-7">
        <ModalHeader eyebrow="Detail UMKM" title={item.business_name || "UMKM"} onClose={onClose} />
        <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl bg-[#FFF8E7] p-4">
            {item.image_url ? (
              <img src={item.image_url} alt={item.business_name || "Logo UMKM"} className="h-48 w-full rounded-xl object-cover" />
            ) : (
              <div className="grid h-48 place-items-center rounded-xl bg-[#ECFDF5] font-black text-[#064E3B]">Tidak ada logo</div>
            )}
            <div className="mt-4 grid gap-2">
              <StatusBadge status={item.status || "pending"} />
              <AccountBadge connected={Boolean(item.user_id)} />
              <p className="rounded-2xl bg-white p-3 text-xs font-semibold leading-5 text-[#1F2937]/65">
                {item.user_id
                  ? "Akun dashboard UMKM sudah terhubung."
                  : "Email pendaftar sudah tersimpan, tetapi akun dashboard UMKM belum terhubung. Ini biasanya data lama, dummy, atau import manual."}
              </p>
              <p className="text-xs font-semibold text-[#1F2937]/60">User ID: {item.user_id || "-"}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Nama usaha" value={item.business_name} />
            <DetailItem label="Nama pemilik" value={item.owner_name} />
            <DetailItem label="Email Pendaftar" value={item.owner_email} />
            <DetailItem label="Email Login Dashboard" value={item.user_id ? item.owner_email : "-"} />
            <DetailItem label="WhatsApp" value={formatWhatsapp(item.whatsapp)} />
            <DetailItem label="Registration code" value={item.registration_code} />
            <DetailItem label="Kategori" value={item.category} />
            <DetailItem label="Subkategori" value={item.subcategory} />
            <DetailItem label="Lokasi" value={item.location} />
            <DetailItem label="Alamat" value={item.address} />
            <DetailItem label="Kapasitas minimum" value={item.capacity_min ? `${item.capacity_min} pax` : "-"} />
            <DetailItem label="Kapasitas maksimum" value={item.capacity_max ? `${item.capacity_max} pax` : "-"} />
            <DetailItem label="Harga mulai" value={item.price_start ? `Rp ${Number(item.price_start).toLocaleString("id-ID")}` : "-"} />
            <DetailItem label="Barokah Score" value={`${item.barokah_score || 0}/100`} />
            <DetailItem label="Badges" value={splitBadges(item.badges).join(", ") || "-"} />
            <DetailItem label="Featured" value={item.is_featured ? "Ya" : "Tidak"} />
            <DetailItem label="Status akun" value={item.user_id ? "Akun Terhubung" : "Belum Ada Akun"} />
            <DetailItem label="Created at" value={formatDateTime(item.created_at)} />
            <DetailItem label="Approved at" value={formatDateTime(item.approved_at)} />
            <DetailItem label="Rejected at" value={formatDateTime(item.rejected_at)} />
            <div className="rounded-2xl bg-[#FFF8E7] p-4 md:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#064E3B]/60">Deskripsi</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#1F2937]/72">{item.description || "-"}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-2xl bg-[#FFF8E7] p-4 md:grid-cols-[140px_1fr_auto]">
          <label className="label">Barokah Score<input type="number" value={score} onChange={(event) => setScore(event.target.value)} className="field" /></label>
          <label className="label">Badges<input value={badges} onChange={(event) => setBadges(event.target.value)} className="field" /></label>
          <label className="flex items-center gap-2 self-end rounded-2xl bg-white px-4 py-3 font-semibold text-[#064E3B]">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
            Featured
          </label>
          <label className="label md:col-span-3">
            Catatan verifikasi
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="field resize-none" />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => saveChanges()} className="rounded-xl border border-[#064E3B]/15 px-5 py-3 font-black text-[#064E3B]">Simpan perubahan</button>
          {item.status !== "approved" && (
            <button type="button" onClick={() => confirm("Approve UMKM ini?") && approveUmkmFromRow({ ...item, barokah_score: score, badges, verification_note: note, is_featured: featured }, onUpdate)} className="rounded-xl bg-[#064E3B] px-5 py-3 font-black text-white">
              {item.status === "rejected" || item.status === "suspended" ? "Re-Approve" : "Approve"}
            </button>
          )}
          {item.status !== "rejected" && (
            <button type="button" onClick={() => confirm("Reject UMKM ini?") && saveChanges({ status: "rejected", rejected_at: new Date().toISOString() })} className="rounded-xl bg-red-50 px-5 py-3 font-black text-red-700">Reject</button>
          )}
          {item.status === "approved" && (
            <button type="button" onClick={() => saveChanges({ status: "suspended" })} className="rounded-xl bg-gray-100 px-5 py-3 font-black text-gray-700">Suspend</button>
          )}
          <a href={`/vendors/${item.id}`} target="_blank" rel="noreferrer" className="rounded-xl bg-[#FFF8E7] px-5 py-3 font-black text-[#064E3B]">
            Lihat Public
          </a>
          {!item.user_id && (
            <button type="button" onClick={() => onAccountHelp(item)} className="rounded-xl bg-[#ECFDF5] px-5 py-3 font-black text-[#064E3B]">
              Buat / Hubungkan Akun UMKM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function approveUmkmFromRow(item, onUpdate) {
  const normalizedScore = Number(item.barokah_score || 0);

  onUpdate(item.id, {
    status: "approved",
    approved_at: new Date().toISOString(),
    verification_note: item.verification_note || null,
    barokah_score: normalizedScore > 0 ? normalizedScore : 85,
    badges: ["Terkurasi", "Menunggu Review Lanjutan"],
    is_featured: Boolean(item.is_featured),
  });
}

function aggregateLeads(leads) {
  const today = new Date().toDateString();
  const groups = new Map();

  leads.forEach((lead) => {
    const key = lead.umkm_id || "unknown";
    const vendor = lead.vendor || { business_name: "Vendor belum terhubung", category: "-", location: "-" };
    const date = getLeadDate(lead);
    const current = groups.get(key) || { umkmId: key, vendor, totalClicks: 0, clicksToday: 0, lastClickedAt: null, logs: [] };
    current.totalClicks += 1;
    current.logs.push(lead);
    if (date && new Date(date).toDateString() === today) current.clicksToday += 1;
    if (!current.lastClickedAt || new Date(date || 0) > new Date(current.lastClickedAt || 0)) current.lastClickedAt = date;
    groups.set(key, current);
  });

  return [...groups.values()].sort((a, b) => b.totalClicks - a.totalClicks);
}

function aggregateCategories(leads) {
  const groups = new Map();
  aggregateLeads(leads).forEach((summary) => {
    const category = summary.vendor.category || "Tanpa kategori";
    const current = groups.get(category) || { category, totalClicks: 0, vendors: [] };
    current.totalClicks += summary.totalClicks;
    current.vendors.push(summary);
    groups.set(category, current);
  });

  return [...groups.values()]
    .map((item) => {
      const topVendor = item.vendors.sort((a, b) => b.totalClicks - a.totalClicks)[0];
      return {
        category: item.category,
        totalClicks: item.totalClicks,
        vendorCount: item.vendors.length,
        topVendor: topVendor?.vendor.business_name || "-",
      };
    })
    .sort((a, b) => b.totalClicks - a.totalClicks);
}

function ModerationHeader({ icon: Icon, title, status, setStatus, vendorId, setVendorId, vendors }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-display text-2xl font-bold text-[#064E3B]"><Icon size={22} /> {title}</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SelectBare value={status} onChange={setStatus} options={moderationStatuses} />
        <select value={vendorId} onChange={(event) => setVendorId(event.target.value)} className="field py-3">
          <option value="">Semua UMKM</option>
          {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.business_name}</option>)}
        </select>
      </div>
    </div>
  );
}

function ModerationActions({ onDetail, onSave, onApprove, onReject, onDelete }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
      <button type="button" onClick={onDetail} className="rounded-xl bg-[#ECFDF5] px-3 py-2 text-sm font-black text-[#064E3B]">Detail</button>
      <button type="button" onClick={onSave} className="rounded-xl border border-[#064E3B]/15 px-3 py-2 text-sm font-black text-[#064E3B]">Simpan</button>
      <button type="button" onClick={onApprove} className="rounded-xl bg-[#064E3B] px-3 py-2 text-sm font-black text-white">Approve</button>
      <button type="button" onClick={onReject} className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-black text-amber-800">Reject</button>
      <button type="button" onClick={onDelete} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700">Delete</button>
    </div>
  );
}

function SelectBare({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="field py-3">
      {options.map((option) => (
        <option key={option || placeholder} value={option}>{option || placeholder || "Semua"}</option>
      ))}
    </select>
  );
}

function ModalHeader({ eyebrow, title, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#D6A84F]">{eyebrow}</p>
        <h3 className="mt-2 font-display text-3xl font-bold text-[#064E3B]">{title}</h3>
      </div>
      <button type="button" onClick={onClose} className="rounded-full border border-[#064E3B]/10 p-2 text-[#064E3B] hover:bg-[#ECFDF5]">
        <X size={20} />
      </button>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, strong }) {
  return (
    <div className="rounded-2xl bg-[#FFF8E7] p-4">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#064E3B]/60">{Icon && <Icon size={15} />}{label}</p>
      <p className={`mt-2 text-sm leading-6 ${strong ? "font-black text-[#064E3B]" : "font-semibold text-[#1F2937]/72"}`}>{value || "-"}</p>
    </div>
  );
}

function DetailMini({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.13em] text-[#064E3B]/55">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1F2937]/72">{value || "-"}</p>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#ECFDF5] p-4">
      <p className="text-xs font-black uppercase tracking-[0.13em] text-[#064E3B]/58">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-[#064E3B]">{value}</p>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const styles = {
    new: "bg-amber-100 text-amber-800",
    contacted: "bg-blue-100 text-blue-800",
    matched: "bg-emerald-100 text-emerald-800",
    closed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-800",
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    suspended: "bg-gray-100 text-gray-700",
    website: "bg-[#ECFDF5] text-[#064E3B]",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles[status] || styles.pending}`}>{label || status || "pending"}</span>;
}

function AccountBadge({ connected }) {
  return connected ? (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Akun Terhubung</span>
  ) : (
    <span
      className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
      title="Belum Ada Akun bukan error. Ini biasanya hanya untuk data lama, dummy, atau import manual."
    >
      Belum Ada Akun
    </span>
  );
}

function AccountHelpModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#001B14]/70 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-premium md:p-7">
        <ModalHeader eyebrow="Akun Dashboard UMKM" title="Buat / Hubungkan Akun UMKM" onClose={onClose} />
        <div className="mt-5 rounded-2xl bg-[#FFF8E7] p-5 text-sm leading-7 text-[#1F2937]/72">
          <p className="font-black text-[#064E3B]">{item.business_name || "UMKM"}</p>
          <p>Email Pendaftar: <span className="font-bold">{item.owner_email || "-"}</span></p>
          <p>ID Pendaftaran: <span className="font-bold">{item.registration_code || "-"}</span></p>
        </div>
        <div className="mt-5 grid gap-3 text-sm leading-7 text-[#1F2937]/72">
          <p className="rounded-2xl bg-[#ECFDF5] p-4 font-semibold text-[#064E3B]">
            Untuk data lama/dummy yang belum memiliki `user_id`, buat user di Supabase Authentication dengan email pendaftar, lalu hubungkan `user_id` ke UMKM ini.
          </p>
          <p>
            Jika nanti dibuat otomatis, prosesnya harus melalui server route/admin API yang aman. Jangan gunakan service_role key di frontend.
          </p>
        </div>
        <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-[#064E3B] px-5 py-3 font-black text-white">
          Mengerti
        </button>
      </div>
    </div>
  );
}

function BadgeSoft({ children }) {
  return <span className="inline-flex rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-black text-[#064E3B]">{children}</span>;
}

function EmptyText({ text }) {
  return <p className="rounded-2xl border border-dashed border-[#064E3B]/15 bg-white p-5 text-center text-sm font-semibold text-[#064E3B]">{text}</p>;
}

function getLeadDate(lead) {
  return lead.clicked_at || lead.created_at;
}

function matchesPeriod(value, period) {
  if (period === "Semua") return true;
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const today = startOfDay(now);
  if (period === "Hari ini") return startOfDay(date).getTime() === today.getTime();
  const days = period === "7 hari terakhir" ? 7 : 30;
  const since = new Date(today);
  since.setDate(since.getDate() - (days - 1));
  return date >= since;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatWhatsapp(value) {
  const normalized = normalizeWhatsapp(value || "");
  return normalized ? `+${normalized}` : "-";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
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
