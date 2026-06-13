"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Lock, Mail, ShieldCheck, Star, Store, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BrandLogo from "@/components/mvp/BrandLogo";

const LOGIN_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Al_Qibla.jpg/1280px-Al_Qibla.jpg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentUser(user);
      setCurrentRole(profile?.role || "");
    }

    checkExistingSession();
  }, []);

  const currentDashboard = currentRole === "admin" ? "/dashboard/admin" : "/dashboard/umkm";

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile?.role) {
      console.error("Login profile lookup error:", profileError);
      setError("Profil akun belum tersedia. Silakan hubungi admin.");
      setLoading(false);
      return;
    }

    const target = profile.role === "admin" ? "/dashboard/admin" : "/dashboard/umkm";
    console.log("Login debug:", {
      email: data.user?.email,
      role: profile.role,
      redirectTarget: target,
    });

    router.push(target);
    router.refresh();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentRole("");
    router.refresh();
  }

  return (
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#FFF8E7]">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[#064E3B] lg:block" />
      <div className="absolute inset-y-0 left-0 w-32 ornament-bg opacity-60" />
      <section className="section-shell relative grid min-h-[calc(100vh-76px)] items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <LoginVisual />
        <div className="relative z-10">
          <form onSubmit={handleLogin} className="mx-auto w-full max-w-xl rounded-[34px] bg-white p-7 shadow-premium md:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center gap-3">
                <BrandLogo className="h-14 w-14" />
                <span className="font-display text-3xl font-bold text-[#064E3B]">RuteBarokah</span>
              </div>
              <h1 className="font-display text-4xl font-bold text-[#064E3B] md:text-5xl">Masuk ke Akun Anda</h1>
              <p className="mx-auto mt-3 max-w-sm leading-7 text-[#1F2937]/62">
                Akses vendor halal terpercaya untuk kebutuhan perjalanan ibadah.
              </p>
              <p className="mx-auto mt-3 max-w-md rounded-2xl bg-[#FFF8E7] p-3 text-sm font-semibold leading-6 text-[#064E3B]">
                Jika Anda sedang masuk dengan akun lain, silakan logout terlebih dahulu.
              </p>
            </div>

            {currentUser && (
              <div className="mb-6 rounded-3xl border border-[#D6A84F]/25 bg-[#FFF8E7] p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#D6A84F]">Session Aktif</p>
                <h2 className="mt-2 text-xl font-black text-[#064E3B]">Anda sudah login sebagai {currentUser.email}</h2>
                <p className="mt-1 text-sm font-semibold text-[#1F2937]/62">Role: {currentRole || "belum terbaca"}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link href={currentDashboard} className="rounded-xl bg-[#064E3B] px-5 py-3 text-center font-bold text-white">
                    Masuk ke Dashboard
                  </Link>
                  <button type="button" onClick={handleLogout} className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700">
                    Logout dan ganti akun
                  </button>
                </div>
              </div>
            )}

            <label className="label">
              Email
              <span className="flex items-center gap-3 rounded-xl border border-[#1F2937]/14 px-4 py-3.5">
                <Mail size={21} className="text-[#1F2937]/55" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Masukkan email Anda"
                  className="w-full bg-transparent outline-none"
                  required
                />
              </span>
            </label>
            <label className="label mt-5">
              Kata Sandi
              <span className="flex items-center gap-3 rounded-xl border border-[#1F2937]/14 px-4 py-3.5">
                <Lock size={21} className="text-[#1F2937]/55" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan kata sandi Anda"
                  className="w-full bg-transparent outline-none"
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[#1F2937]/55">
                  <Eye size={20} />
                </button>
              </span>
            </label>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#1F2937]/70">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-[#08734F]" />
                Ingat saya
              </label>
              <button type="button" className="font-bold text-[#08734F]">Lupa kata sandi?</button>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#064E3B] px-6 py-4 font-bold text-white shadow-soft transition hover:bg-[#043c2e] disabled:opacity-60"
            >
              <Lock size={19} />
              {loading ? "Memeriksa Akun..." : "Masuk"}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-[#064E3B]/20 bg-white px-6 py-4 font-bold text-[#1F2937]"
            >
              <span className="font-black text-[#4285F4]">G</span>
              Masuk dengan Google
            </button>

            <div className="my-6 flex items-center gap-4 text-sm text-[#1F2937]/50">
              <span className="h-px flex-1 bg-[#1F2937]/12" />
              atau
              <span className="h-px flex-1 bg-[#1F2937]/12" />
            </div>
            <p className="text-center text-[#1F2937]/68">
              Belum punya akun? <Link href="/join-umkm" className="font-black text-[#08734F]">Daftar UMKM</Link>
            </p>
            <div className="mt-8 grid gap-3 rounded-2xl border border-[#D6A84F]/35 bg-[#FFF8E7]/60 p-4 sm:grid-cols-3">
              <Trust icon={Store} title="Vendor" desc="Terkurasi" />
              <Trust icon={Star} title="Barokah" desc="Score" gold />
              <Trust icon={ShieldCheck} title="Aman &" desc="Terpercaya" />
            </div>
          </form>
        </div>
      </section>
      <div className="relative bg-[#064E3B] py-5 text-white">
        <div className="section-shell flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 text-white/78"><ShieldCheck size={18} /> RuteBarokah berkomitmen menghadirkan ekosistem halal yang aman, nyaman, dan penuh keberkahan.</p>
          <p className="flex items-center gap-2 text-white/78"><Lock size={18} /> Privasi Terjamin. Data Aman.</p>
        </div>
      </div>
    </main>
  );
}

function LoginVisual() {
  return (
    <div className="relative hidden min-h-[680px] lg:block">
      <div className="absolute inset-0 overflow-hidden rounded-[34px]">
        <img src={LOGIN_IMAGE} alt="Ka'bah dan jamaah" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,231,.88)_0%,rgba(255,248,231,.45)_45%,rgba(6,78,59,.2)_100%)]" />
      </div>
      <div className="absolute left-10 top-16 max-w-xl">
        <h2 className="font-display text-5xl font-bold leading-tight text-[#064E3B]">
          Platform UMKM Halal #1 untuk Ekosistem Ibadah
        </h2>
        <p className="mt-5 max-w-md text-lg leading-8 text-[#1F2937]/72">
          Menghubungkan UMKM halal dengan jamaah, biro perjalanan, dan komunitas masjid untuk pengalaman ibadah yang lebih mudah, aman, dan penuh keberkahan.
        </p>
        <div className="mt-6 h-1 w-20 rounded-full bg-[#D6A84F]" />
      </div>
      <div className="absolute bottom-12 left-12 right-12 grid grid-cols-3 gap-4">
        {["Vendor Terkurasi", "Barokah Score", "Aman & Terpercaya"].map((item) => (
          <div key={item} className="rounded-2xl bg-white/82 p-4 text-center font-bold text-[#064E3B] shadow-soft backdrop-blur">
            {item}
          </div>
        ))}
      </div>
      <div className="absolute right-10 top-64 rounded-[22px] border-4 border-[#D6A84F] bg-[#064E3B] px-5 py-5 text-center text-[#D6A84F] shadow-premium">
        <UserCheck className="mx-auto mb-2" size={38} />
        <p className="text-sm font-black leading-4">HALAL<br />TERPERCAYA</p>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, title, desc, gold }) {
  return (
    <div className="flex items-center justify-center gap-3 text-[#064E3B]">
      <span className={`grid h-11 w-11 place-items-center rounded-full ${gold ? "bg-[#D6A84F]/20 text-[#B8871F]" : "bg-[#ECFDF5] text-[#08734F]"}`}>
        <Icon size={22} />
      </span>
      <span className="text-left text-sm font-bold leading-5">{title}<br />{desc}</span>
    </div>
  );
}
