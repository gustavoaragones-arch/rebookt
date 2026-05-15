import Link from "next/link";
import { createPropertyAction } from "./actions";

export default function NewPropertyPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div>
      <Link href="/dashboard/properties" className="text-sm text-[var(--color-text-secondary)] hover:underline">
        ← Properties
      </Link>
      <h1 className="mt-6 font-display text-3xl text-[var(--color-brand)]">New property</h1>
      {searchParams.error && (
        <p className="mt-4 text-sm text-[var(--color-error)]">Could not save. Check slug uniqueness and values.</p>
      )}
      <form action={createPropertyAction} className="card mt-8 max-w-xl space-y-6">
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Name
          <input className="input mt-2" name="name" required />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Slug (URL)
          <input className="input mt-2" name="slug" required placeholder="beach-house" />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Base price / night (USD)
          <input className="input mt-2" name="base_price" type="number" min={1} step="0.01" required />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Cleaning fee (USD)
          <input className="input mt-2" name="cleaning_fee" type="number" min={0} step="0.01" defaultValue={0} />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Description
          <textarea className="input mt-2 min-h-[100px]" name="description" />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Image URLs (one per line)
          <textarea className="input mt-2 min-h-[80px] font-mono text-xs" name="images" placeholder="https://..." />
        </label>
        <button type="submit" className="btn-primary">
          Create property
        </button>
      </form>
    </div>
  );
}
