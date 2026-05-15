import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("properties")
    .select("id, name, slug, base_price")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--color-brand)]">Properties</h1>
        <Link href="/dashboard/properties/new" className="btn-primary text-sm">
          New property
        </Link>
      </div>
      <div className="mt-10 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Base / night</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((p) => (
              <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/properties/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-secondary)]">{p.slug}</td>
                <td className="px-6 py-4">${Number(p.base_price).toFixed(0)}</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-[var(--color-text-muted)]">
                  No properties yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
