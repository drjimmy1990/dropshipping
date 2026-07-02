import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "./AdminShell";

/**
 * Server-side admin gate (MED-1). A non-admin is redirected before any admin
 * page or its data renders — the previous client-only useEffect check let the
 * page (and its RLS-scoped fetches) load first.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: me } = await supabase
    .from("merchants")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
