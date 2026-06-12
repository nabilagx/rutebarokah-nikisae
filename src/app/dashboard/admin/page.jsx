"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import LoadingState from "@/components/mvp/LoadingState.jsx";
import ProtectedNotice from "@/components/mvp/ProtectedNotice.jsx";
import { splitBadges } from "@/lib/formatters";

export default function AdminDashboardPage() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingUmkm, setPendingUmkm] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leads, setLeads] = useState([]);
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
    const [umkmResult, requestResult, leadResult] = await Promise.all([
      supabase
        .from("umkm_profiles")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("vendor_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    setPendingUmkm(umkmResult.data || []);
    setRequests(requestResult.data || []);
    setLeads(leadResult.data || []);
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
    <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-10">
      <div className="mb-8 overflow-hidden rounded-[24px] bg-[#064E3B] p-7 text-white shadow-premium islamic-grid">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D6A84F]">Dashboard Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Validasi UMKM, request vendor, dan leads.</h1>
        <p className="mt-3 text-white/70">Gunakan dashboard ini untuk demo kurasi awal RuteBarokah.</p>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-[#ECFDF5] p-4 text-sm font-semibold text-[#064E3B]">
          {message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
          <Panel title="Vendor Requests" items={requests} render={(item) => (
            <>
              <p className="font-bold text-[#064E3B]">{item.requester_name || "Pemohon"}</p>
              <p className="text-sm text-[#1F2937]/65">{item.need_category} • {item.location} • {item.pax || 0} pax</p>
              <p className="mt-1 text-xs text-[#1F2937]/55">{item.organization_name || item.requester_type}</p>
            </>
          )} />
          <Panel title="Leads Terbaru" items={leads} render={(item) => (
            <>
              <p className="font-bold text-[#064E3B]">{item.source || "Lead WhatsApp"}</p>
              <p className="text-sm text-[#1F2937]/65">UMKM ID: {item.umkm_id || "-"}</p>
              <p className="mt-1 text-xs text-[#1F2937]/55">{item.whatsapp || item.message || "-"}</p>
            </>
          )} />
        </div>
      </section>
    </main>
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

function Panel({ title, items, render }) {
  return (
          <div className="rounded-[22px] border border-[#064E3B]/10 bg-white p-5 shadow-soft">
      <h2 className="font-display text-2xl font-bold text-[#064E3B]">{title}</h2>
      <div className="mt-5 grid gap-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-[#FFF8E7] p-4">
            {render(item)}
          </div>
        )) : (
          <p className="text-sm text-[#1F2937]/60">Belum ada data.</p>
        )}
      </div>
    </div>
  );
}
