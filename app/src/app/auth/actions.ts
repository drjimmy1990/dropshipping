"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/* ================================================================
   AUTH SERVER ACTIONS
   Called from login/register forms. Run on the server.
   ================================================================ */

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const businessName = formData.get("businessName") as string;

  // 1. Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        business_name: businessName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // 2. Insert merchant row using admin client (bypasses RLS)
  if (data.user) {
    const adminClient = createAdminClient();
    const { error: merchantError } = await adminClient.from("merchants").insert({
      id: data.user.id,
      email,
      business_name: businessName || "My Store",
    });

    if (merchantError) {
      console.error("Merchant insert error:", merchantError);
      // Don't block — auth user was created, merchant row can be retried
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Check if user is an admin — redirect to admin panel
  let destination = "/dashboard";
  if (data.user) {
    const adminClient = createAdminClient();
    const { data: merchant } = await adminClient
      .from("merchants")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (merchant?.role === "admin") {
      destination = "/admin";
    }
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
