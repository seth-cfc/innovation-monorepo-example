import { Card } from "@repo/ui/card";

export default function CardPlayground() {
  return (
    <main className="mx-auto max-w-2xl p-10 flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Card</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">
          With title
        </h2>
        <Card title="Plain card">
          Cards are unopinionated containers. Wrap them in whatever element owns
          navigation or interaction.
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">
          As an external link
        </h2>
        <a
          href="https://turborepo.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card title="Turborepo">High-performance build system.</Card>
        </a>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">
          Without title
        </h2>
        <Card>Body content only.</Card>
      </section>
    </main>
  );
}
