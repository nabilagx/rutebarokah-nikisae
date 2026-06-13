import { supabase } from "@/lib/supabaseClient";

export function getDashboardTarget(role) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "umkm") return "/dashboard/umkm";
  return "";
}

export async function getAuthProfile() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const session = sessionData?.session || null;

  if (sessionError) {
    console.error("getSession error:", sessionError);
  }

  if (!session?.user) {
    return { session: null, user: null, profile: null, role: "", dashboardTarget: "" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", session.user.id)
    .single();

  if (profileError) {
    console.error("profiles lookup error:", profileError);
  }

  const role = profile?.role || "";
  const dashboardTarget = getDashboardTarget(role);

  console.log("session user:", session.user.email);
  console.log("profile:", profile);
  console.log("role:", role);
  console.log("dashboard target:", dashboardTarget);

  return { session, user: session.user, profile, role, dashboardTarget, error: profileError };
}
