"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  UsersRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import ProtectedNotice from "@/components/mvp/ProtectedNotice.jsx";
import { normalizeWhatsapp, splitBadges, whatsappUrl } from "@/lib/formatters";

const requestStatuses = ["contacted", "matched", "closed", "cancelled"];

export default function AdminDashboardPage() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUmkm, setPendingUmkm] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
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
    const [umkmResult, requestResult] = await Promise.all([
      supabase
        .from("umkm_profiles")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("vendor_requests")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const leadResult = await supabase
      .from("leads")
      .select("*, umkm_profiles(business_name, category, location)")
      .order("clicked_at", { ascending: false })
      .limit(50);

    let leadData = leadResult.data || [];

    if (leadResult.error) {
      console.error("Gagal mengambil leads dengan join:", leadResult.error);
      const fallbackResult = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      leadData = fallbackResult.data || [];
      const umkmIds = [...new Set(leadData.map((lead) => lead.umkm_id).filter(Boolean))];

      if (umkmIds.length) {
        const { data: vendors } = await supabase
          .from("umkm_profiles")
          .select("id, business_name, category, location")
          .in("id", umkmIds);
        const vendorMap = new Map((vendors || []).map((vendor) => [vendor.id, vendor]));
        leadData = leadData.map((lead) => ({
          ...lead,
          umkm_profiles: vendorMap.get(lead.umkm_id) || null,
        }));
      }
    }

    setPendingUmkm(umkmResult.data || []);
    setRequests(requestResult.data || []);
    setLeads(leadData);
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

  const leadSummary = useMemo(() => {
    const today = new Date().toDateString();
    const vendorClicks = leads.reduce((acc, lead) => {
      const vendor = getLeadVendor(lead).business_name || "Vendor belum terhubung";
      acc[vendor] = (acc[vendor] || 0) + 1;
      return acc;
    }, {});
    const topVendor = Object.entries(vendorClicks).sort((a, b) => b[1] - a[1])[0];

    return {
      total: leads.length,
      today: leads.filter((lead) => {
        const date = lead.clicked_at || lead.created_at;
        return date ? new Date(date).toDateString() === today : false;
      }).length,
      topVendor: topVendor ? `${topVendor[0]} (${topVendor[1]} klik)` : "-",
    };
  }, [leads]);

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
    <main className="mx-auto w-[min(1240px,calc(100%-32px))] py-10">
      <div className="mb-8 overflow-hidden rounded-[24px] bg-[#064E3B] p-7 text-white shadow-premium islamic-grid">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">Dashboard Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Validasi UMKM, request vendor, dan leads.</h1>
        <p className="mt-3 text-white/70">Gunakan dashboard ini untuk demo kurasi dan manual matching RuteBarokah.</p>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-[#ECFDF5] p-4 text-sm font-semibold text-[#064E3B]">
          {message}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
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

        <div className="grid gap-6">
          <VendorRequestsPanel
            requests={requests}
            onDetail={setSelectedRequest}
            onWhatsapp={handleRequestWhatsapp}
          />
          <LeadsPanel leads={leads} summary={leadSummary} />
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
    </main>
  );
}

function VendorRequestsPanel({ requests, onDetail, onWhatsapp }) {
  return (
    <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#064E3B]">Vendor Requests</h2>
          <p className="mt-1 text-sm text-[#1F2937]/60">Request travel, KBIH, komunitas, dan keluarga jamaah untuk dicocokkan manual.</p>
        </div>
        <span className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-black text-[#064E3B]">{requests.length} request</span>
      </div>

      <div className="mt-5 grid gap-3">
        {requests.length ? requests.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[#064E3B]/10 bg-[#FFF8E7] p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="grid gap-3 md:grid-cols-2">
                <RequestField label="Nama" value={item.requester_name} />
                <RequestField label="Organisasi" value={item.organization_name} />
                <RequestField label="Tipe" value={item.requester_type} />
                <RequestField label="Kebutuhan" value={item.need_category} />
                <RequestField label="Lokasi" value={item.location} />
                <RequestField label="Tanggal" value={formatDate(item.event_date)} />
                <RequestField label="Pax" value={item.pax ? `${item.pax} pax` : "-"} />
                <RequestField label="WhatsApp" value={formatWhatsapp(item.whatsapp)} strong />
                <RequestField label="Status" value={item.status || "new"} strong />
                <RequestField label="Masuk" value={formatDateTime(item.created_at)} />
              </div>
              <div className="flex flex-col gap-2 lg:w-44">
                <button
                  type="button"
                  onClick={() => onDetail(item)}
                  className="rounded-xl border border-[#064E3B]/15 bg-white px-4 py-3 font-bold text-[#064E3B] hover:bg-[#ECFDF5]"
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => onWhatsapp(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064E3B] px-4 py-3 font-bold text-white hover:bg-[#043c2e]"
                >
                  <MessageCircle size={18} />
                  Hubungi WhatsApp
                </button>
              </div>
            </div>
          </article>
        )) : (
          <p className="text-sm text-[#1F2937]/60">Belum ada vendor request.</p>
        )}
      </div>
    </div>
  );
}

function VendorRequestModal({ request, onClose, onWhatsapp, onStatus }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#001B14]/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-premium md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#D6A84F]">Detail Vendor Request</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-[#064E3B]">{request.requester_name || "Pemohon"}</h3>
            <p className="mt-1 text-[#1F2937]/62">{request.organization_name || request.requester_type || "Tanpa organisasi"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[#064E3B]/10 p-2 text-[#064E3B] hover:bg-[#ECFDF5]">
            <X size={20} />
          </button>
        </div>

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
          <button
            type="button"
            onClick={() => onWhatsapp(request)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064E3B] px-5 py-3.5 font-bold text-white hover:bg-[#043c2e]"
          >
            <MessageCircle size={18} />
            Hubungi via WhatsApp
          </button>
          <a
            href={`https://wa.me/${normalizeWhatsapp(request.whatsapp || "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#064E3B]/15 bg-white px-5 py-3.5 font-bold text-[#064E3B] hover:bg-[#ECFDF5]"
          >
            <ExternalLink size={18} />
            Buka Nomor Saja
          </a>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {requestStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatus(request.id, status)}
              className="rounded-xl bg-[#ECFDF5] px-4 py-3 text-sm font-black capitalize text-[#064E3B] hover:bg-[#D9F7EA]"
            >
              Ubah ke {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadsPanel({ leads, summary }) {
  return (
    <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <h2 className="font-display text-2xl font-bold text-[#064E3B]">Leads WhatsApp</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SummaryCard label="Total Leads" value={summary.total} />
        <SummaryCard label="Leads Hari Ini" value={summary.today} />
        <SummaryCard label="Vendor Paling Sering Diklik" value={summary.topVendor} />
      </div>

      <div className="mt-5 grid gap-3">
        {leads.length ? leads.map((lead) => {
          const vendor = getLeadVendor(lead);
          return (
            <article key={lead.id} className="rounded-2xl border border-[#064E3B]/10 bg-[#FFF8E7] p-4">
              <div className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr]">
                <RequestField label="UMKM" value={vendor.business_name || "Vendor belum terhubung"} strong />
                <RequestField label="Kategori" value={vendor.category || "-"} />
                <RequestField label="Lokasi" value={vendor.location || "-"} />
                <RequestField label="Source" value={lead.source || "-"} />
                <RequestField label="User Type" value={lead.user_type || "-"} />
                <RequestField label="Clicked At" value={formatDateTime(lead.clicked_at || lead.created_at)} />
              </div>
            </article>
          );
        }) : (
          <p className="text-sm text-[#1F2937]/60">Belum ada leads.</p>
        )}
      </div>
    </div>
  );
}

function AdminUmkmCard({ item, onUpdate }) {
  const [score, setScore] = useState(item.barokah_score || 0);
  const [badges, setBadges] = useState(splitBadges(item.badges).join(", "));
  const [featured, setFeatured] = useState(Boolean(item.is_featured));

  return (
    <div className="rounded-3xl border border-[#D6A84F]/20 bg-[#FFF8E7] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-[#064E3B]">{item.business_name}</h3>
          <p className="mt-1 text-sm text-[#1F2937]/65">{item.category} • {item.location}</p>
          <p className="mt-2 text-sm leading-6 text-[#1F2937]/65">{item.description}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onUpdate(item.id, { status: "approved", barokah_score: Number(score), badges: splitBadges(badges), is_featured: featured })} className="rounded-xl bg-[#064E3B] px-4 py-2 text-sm font-bold text-white">
            Approve
          </button>
          <button type="button" onClick={() => onUpdate(item.id, { status: "rejected" })} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
            Reject
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr_auto]">
        <label className="label">
          Score
          <input type="number" value={score} onChange={(event) => setScore(event.target.value)} className="field" />
        </label>
        <label className="label">
          Badges
          <input value={badges} onChange={(event) => setBadges(event.target.value)} className="field" placeholder="Terverifikasi, Halal, Cepat" />
        </label>
        <label className="flex items-center gap-2 self-end rounded-2xl bg-white px-4 py-3 font-semibold text-[#064E3B]">
          <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
          Featured
        </label>
      </div>
    </div>
  );
}

function RequestField({ label, value, strong }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.13em] text-[#064E3B]/55">{label}</p>
      <p className={`mt-1 text-sm leading-5 ${strong ? "font-black text-[#064E3B]" : "font-semibold text-[#1F2937]/72"}`}>{value || "-"}</p>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, strong }) {
  return (
    <div className="rounded-2xl bg-[#FFF8E7] p-4">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#064E3B]/60">
        {Icon && <Icon size={15} />}
        {label}
      </p>
      <p className={`mt-2 text-sm leading-6 ${strong ? "font-black text-[#064E3B]" : "font-semibold text-[#1F2937]/72"}`}>{value || "-"}</p>
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

function getLeadVendor(lead) {
  if (Array.isArray(lead.umkm_profiles)) return lead.umkm_profiles[0] || {};
  return lead.umkm_profiles || {};
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
