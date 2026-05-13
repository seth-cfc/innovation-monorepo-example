import Link from "next/link";

const ENTRIES = [
  { slug: "button", label: "Button" },
  { slug: "card", label: "Card" },
  { slug: "code", label: "Code" },
];

export default function PlaygroundIndex() {
  return (
    <main className="mx-auto max-w-2xl p-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          @repo/ui playground
        </h1>
        <p className="text-sm opacity-70">
          Isolated routes for every component in <code>@repo/ui</code>. Add a
          new entry to <code>app/&lt;slug&gt;/page.tsx</code> and link it here.
        </p>
      </header>

      <ul className="flex flex-col gap-1">
        {ENTRIES.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/${entry.slug}`}
              className="block rounded px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
