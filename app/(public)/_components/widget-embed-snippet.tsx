/** HTML embed for the booking widget — token-styled for readability (no runtime highlighter). */
export function WidgetEmbedSnippet({ appUrl }: { appUrl: string }) {
  const base = appUrl.replace(/\/$/, "");
  const src = `${base}/widget.js`;

  return (
    <figure className="mt-8">
      <figcaption className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        Embed code
      </figcaption>
      <pre
        className="overflow-x-auto rounded-md border-2 border-[var(--color-border-strong)] bg-[#171918] p-5 font-mono text-[13px] leading-relaxed text-[#E4E2DC] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        tabIndex={0}
      >
        <code className="block whitespace-pre">
          <span className="text-[#8AAFA0]">&lt;script</span>
          <span className="text-[#9A9A90]"> </span>
          <span className="text-[#A8C4E0]">src</span>
          <span className="text-[#9A9A90]">=</span>
          <span className="text-[#D4B896]">&quot;{src}&quot;</span>
          <span className="text-[#9A9A90]"> </span>
          <span className="text-[#A8C4E0]">data-property</span>
          <span className="text-[#9A9A90]">=</span>
          <span className="text-[#D4B896]">&quot;your-slug&quot;</span>
          <span className="text-[#8AAFA0]">&gt;&lt;/script&gt;</span>
        </code>
      </pre>
    </figure>
  );
}
