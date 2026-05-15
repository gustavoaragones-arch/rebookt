"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPropertyAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const base_price = Number(formData.get("base_price"));
  const cleaning_fee = Number(formData.get("cleaning_fee") || 0);
  const description = String(formData.get("description") ?? "").trim() || null;
  const imagesRaw = String(formData.get("images") ?? "").trim();
  const images = imagesRaw
    ? imagesRaw
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (!name || !slug || !Number.isFinite(base_price) || base_price <= 0) {
    redirect("/dashboard/properties/new?error=invalid");
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({
      user_id: user.id,
      name,
      slug,
      description,
      base_price,
      cleaning_fee: Number.isFinite(cleaning_fee) ? cleaning_fee : 0,
      images,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/dashboard/properties/new?error=save");
  }

  revalidatePath("/dashboard/properties");
  redirect(`/dashboard/properties/${data.id}`);
}
