import { Code } from "@repo/ui/code";

export default function CodePlayground() {
  return (
    <main className="mx-auto max-w-2xl p-10 flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Code</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">Default</h2>
        <p className="text-sm">
          Install with <Code>pnpm install</Code>.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">
          With consumer className
        </h2>
        <p className="text-sm">
          Custom class merges with the base:{" "}
          <Code className="bg-brand-red/10 text-brand-red">danger zone</Code>.
        </p>
      </section>
    </main>
  );
}
