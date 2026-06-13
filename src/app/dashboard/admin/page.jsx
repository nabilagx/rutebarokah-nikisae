"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { normalizeWhatsapp, splitBadges, whatsappUrl } from "@/lib/formatters";

const requestStatuses = ["new", "contacted", "matched", "closed", "cancelled"];
const requesterTypes = ["travel", "kbih", "masjid", "keluarga_jamaah", "jamaah", "lainnya"];
const periods = ["Semua", "Hari ini", "7 hari terakhir", "30 hari terakhir"];
const leadSorts = ["Total klik terbanyak", "Klik hari ini terbanyak", "Terakhir diklik terbaru"];
const requestSorts = ["Request terbaru", "Tanggal acara terdekat", "Pax terbesar"];
const moderationStatuses = ["all", "pending", "approved", "rejected"];

export default function AdminDashboardPage() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUmkm, setPendingUmkm] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leads, setLeads] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedLeadVendor, setSelectedLeadVendor] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
      setChecking(false);
    }

    init();
  }, []);

  async function loadDashboardData() {
    const [umkmResult, vendorResult, requestResult, galleryResult, testimonialResult] = await Promise.all([
      supabase
        .from("umkm_profiles")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("umkm_profiles")
        .select("id, business_name, category, location")
        .order("business_name", { ascending: true }),
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

    const vendorList = vendorResult.data || [];
    const vendorMap = new Map(vendorList.map((vendor) => [vendor.id, vendor]));
    const leadData = await fetchLeadsWithFallback();

    setPendingUmkm(umkmResult.data || []);
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
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">Dashboard Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Operasional matching RuteBarokah.</h1>
        <p className="mt-3 text-white/70">Pantau lead, kelola request vendor, validasi UMKM, dan moderasi galeri/testimoni.</p>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-[#ECFDF5] p-4 text-sm font-semibold text-[#064E3B]">
          {message}
        </div>
      )}

      <section className="grid gap-6">
        <LeadsPanel leads={leads} onDetail={setSelectedLeadVendor} />
        <VendorRequestsPanel
          requests={requests}
          onDetail={setSelectedRequest}
          onWhatsapp={handleRequestWhatsapp}
          onStatus={updateRequestStatus}
        />
        <ModerationPanel
          vendors={vendors}
          gallery={gallery}
          testimonials={testimonials}
          onGalleryUpdate={updateGallery}
          onTestimonialUpdate={updateTestimonial}
          onGalleryDelete={(id) => deleteRow("umkm_gallery", id)}
          onTestimonialDelete={(id) => deleteRow("umkm_testimonials", id)}
        />
        <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
          <h2 className="font-display text-2xl font-bold text-[#064E3B]">UMKM Pending</h2>
          <div className="mt-5 grid gap-4">
            {pendingUmkm.length ? pendingUmkm.map((item) => (
              <AdminUmkmCard key={item.id} item={item} onUpdate={updateUmkm} />
            )) : (
              <p className="text-sm text-[#1F2937]/60">Belum ada UMKM pending.</p>
            )}
          </div>
        </div>
      </section>

      {selectedRequest && (
        <VendorRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onWhatsapp={handleRequestWhatsapp}
          onStatus={updateRequestStatus}
        />
      )}

      {selectedLeadVendor && (
        <LeadDetailModal
          vendorSummary={selectedLeadVendor}
          onClose={() => setSelectedLeadVendor(null)}
        />
      )}
    </main>
  );
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

function VendorRequestModal({ request, onClose, onWhatsapp, onStatus }) {
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

  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <img src={item.image_url} alt={item.caption || "Galeri UMKM"} className="h-40 w-full rounded-xl object-cover" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-black text-[#064E3B]">{item.vendor?.business_name || "UMKM"}</p>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-3 grid gap-2">
        <input value={caption} onChange={(event) => setCaption(event.target.value)} className="field py-3" placeholder="Caption" />
        <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="field py-3" placeholder="Sort order" />
        <label className="flex items-center gap-2 text-sm font-semibold text-[#064E3B]">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Aktif tampil publik
        </label>
      </div>
      <ModerationActions
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

  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black text-[#064E3B]">{item.vendor?.business_name || "UMKM"}</p>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-3 grid gap-2">
        <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="field py-3" placeholder="Nama pelanggan" />
        <input value={customerType} onChange={(event) => setCustomerType(event.target.value)} className="field py-3" placeholder="Tipe pelanggan" />
        <input type="number" min="1" max="5" value={rating} onChange={(event) => setRating(event.target.value)} className="field py-3" />
        <textarea value={testimonial} onChange={(event) => setTestimonial(event.target.value)} rows={4} className="field resize-none" />
      </div>
      <ModerationActions
        onSave={() => onUpdate(item.id, { customer_name: customerName, customer_type: customerType, rating: Number(rating || 5), testimonial })}
        onApprove={() => onUpdate(item.id, { status: "approved", customer_name: customerName, customer_type: customerType, rating: Number(rating || 5), testimonial })}
        onReject={() => onUpdate(item.id, { status: "rejected" })}
        onDelete={() => onDelete(item.id)}
      />
    </article>
  );
}

function AdminUmkmCard({ item, onUpdate }) {
  const [score, setScore] = useState(item.barokah_score || 0);
  const [badges, setBadges] = useState(splitBadges(item.badges).join(", "));
  const [featured, setFeatured] = useState(Boolean(item.is_featured));
  const [verificationNote, setVerificationNote] = useState(item.verification_note || "");

  function approveUmkm() {
    const normalizedScore = Number(score || 0);
    const parsedBadges = splitBadges(badges);
    onUpdate(item.id, {
      status: "approved",
      approved_at: new Date().toISOString(),
      verification_note: verificationNote || null,
      barokah_score: normalizedScore > 0 ? normalizedScore : 85,
      badges: parsedBadges.length ? parsedBadges : ["Terkurasi", "Menunggu Review Lanjutan"],
      is_featured: featured,
    });
  }

  function rejectUmkm() {
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

function ModerationActions({ onSave, onApprove, onReject, onDelete }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
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
    website: "bg-[#ECFDF5] text-[#064E3B]",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles[status] || styles.pending}`}>{label || status || "pending"}</span>;
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
