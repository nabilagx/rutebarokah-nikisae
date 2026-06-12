"use client";

import React, { useState } from "react";
import PageHeader from "@/components/mvp/PageHeader.jsx";
import { categories, locations, requesterTypes } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";

const initialForm = {
  requester_name: "",
  organization_name: "",
  requester_type: "Travel Umrah",
  need_category: "Katering",
  location: "Makkah",
  event_date: "",
  pax: "",
  whatsapp: "",
  notes: "",
};

export default function RequestVendorPage() {
  const [form, setForm] = useState(initialForm);
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

    const payload = {
      ...form,
      pax: form.pax ? Number(form.pax) : null,
      status: "new",
    };

    const { error: insertError } = await supabase.from("vendor_requests").insert(payload);

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage("Request vendor berhasil dikirim. Tim RuteBarokah akan membantu kurasi mitra yang sesuai.");
      setForm(initialForm);
      event.target.reset();
    }

    setSubmitting(false);
  }

  return (
    <main>
      <PageHeader
        eyebrow="Request Vendor"
        title="Cari vendor halal untuk rombongan travel, KBIH, atau komunitas."
        description="Isi kebutuhan layanan, lokasi, tanggal, dan jumlah jamaah. Data masuk ke dashboard admin untuk ditindaklanjuti."
      />

      <section className="mx-auto w-[min(920px,calc(100%-32px))] pb-16">
        <form onSubmit={handleSubmit} className="rounded-[24px] border border-[#064E3B]/10 bg-white p-6 shadow-premium md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Nama Pemohon" name="requester_name" value={form.requester_name} onChange={updateField} required />
            <Input label="Nama Organisasi" name="organization_name" value={form.organization_name} onChange={updateField} />
            <Select label="Tipe Pemohon" name="requester_type" value={form.requester_type} onChange={updateField} options={requesterTypes} />
            <Select label="Kategori Kebutuhan" name="need_category" value={form.need_category} onChange={updateField} options={categories} />
            <Select label="Lokasi" name="location" value={form.location} onChange={updateField} options={locations} />
            <Input label="Tanggal Kebutuhan" name="event_date" value={form.event_date} onChange={updateField} type="date" />
            <Input label="Jumlah Jamaah/Pax" name="pax" value={form.pax} onChange={updateField} type="number" />
            <Input label="WhatsApp" name="whatsapp" value={form.whatsapp} onChange={updateField} required placeholder="62812..." />
            <label className="label md:col-span-2">
              Catatan Kebutuhan
              <textarea name="notes" value={form.notes} onChange={updateField} rows={5} className="field resize-none" />
            </label>
          </div>

          {message && <Alert type="success" message={message} />}
          {error && <Alert type="error" message={error} />}

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 w-full rounded-xl bg-[#064E3B] px-6 py-4 font-bold text-white shadow-soft transition hover:bg-[#043c2e] disabled:opacity-60"
          >
            {submitting ? "Mengirim Request..." : "Kirim Request Vendor"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="label">
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

function Alert({ type, message }) {
  return (
    <div className={`mt-5 rounded-2xl p-4 text-sm font-semibold ${type === "success" ? "bg-[#ECFDF5] text-[#064E3B]" : "bg-red-50 text-red-700"}`}>
      {message}
    </div>
  );
}
