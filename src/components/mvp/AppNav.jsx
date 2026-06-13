"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Search, X } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { supabase } from "@/lib/supabaseClient";

const links = [
  ["Vendor", "/vendors"],
  ["Daftar UMKM", "/join-umkm"],
  ["Request Vendor", "/request-vendor"],
];

export default function AppNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user || null;
      if (!active) return;
      setSessionUser(user);

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (active) setRole(profile?.role || "");
      } else {
        setRole("");
      }
    }

    loadAuth();
    const { data: listener } = supabase.auth.onAuthStateChange(() => loadAuth());

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const dashboardHref = role === "admin" ? "/dashboard/admin" : "/dashboard/umkm";

  async function handleLogout() {
    await supabase.auth.signOut();
    setSessionUser(null);
    setRole("");
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#064E3B]/10 bg-white/90 backdrop-blur-xl">
      <nav className="section-shell flex h-[76px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo className="h-12 w-12" />
          <span className="font-display text-[28px] font-bold leading-none text-[#064E3B]">
            RuteBarokah
          </span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-semibold text-[#1F2937]/72 hover:text-[#064E3B]">
              {label}
            </Link>
          ))}
          {sessionUser ? (
            <AuthControls user={sessionUser} role={role} dashboardHref={dashboardHref} onLogout={handleLogout} />
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-[#1F2937]/72 hover:text-[#064E3B]">
                Login
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center gap-2 rounded-xl bg-[#064E3B] px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-[#043c2e]"
              >
                Cari Vendor <Search size={16} />
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Buka menu"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-[#D6A84F]/30 bg-white p-3 text-[#064E3B] md:hidden"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
      {open && (
        <div className="section-shell pb-4 md:hidden">
          <div className="grid gap-1 rounded-3xl border border-[#D6A84F]/25 bg-white p-3 shadow-soft">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 font-semibold text-[#1F2937]/72 hover:bg-[#ECFDF5] hover:text-[#064E3B]"
              >
                {label}
              </Link>
            ))}
            {sessionUser ? (
              <div className="grid gap-2 rounded-2xl bg-[#FFF8E7] p-3">
                <p className="text-sm font-bold text-[#064E3B]">{sessionUser.email}</p>
                <RoleBadge role={role} />
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-[#064E3B] px-4 py-3 text-center font-bold text-white"
                >
                  Dashboard
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 font-semibold text-[#1F2937]/72 hover:bg-[#ECFDF5] hover:text-[#064E3B]">
                  Login
                </Link>
                <Link href="/vendors" onClick={() => setOpen(false)} className="rounded-2xl bg-[#064E3B] px-4 py-3 text-center font-bold text-white">
                  Cari Vendor
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function AuthControls({ user, role, dashboardHref, onLogout }) {
  return (
    <div className="flex items-center gap-3">
      <div className="max-w-[190px] text-right">
        <p className="truncate text-xs font-bold text-[#1F2937]/70">{user.email}</p>
        <RoleBadge role={role} />
      </div>
      <Link href={dashboardHref} className="inline-flex items-center gap-2 rounded-xl bg-[#064E3B] px-4 py-2.5 text-sm font-bold text-white shadow-soft">
        <LayoutDashboard size={16} />
        Dashboard
      </Link>
      <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700">
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className="mt-1 inline-flex rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#064E3B]">
      {role === "admin" ? "Admin" : role === "umkm" ? "UMKM" : "Akun"}
    </span>
  );
}
