import { Button } from "@repo/ui/button";

export default function ButtonPlayground() {
  return (
    <main className="mx-auto max-w-2xl p-10 flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Button</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">Intent</h2>
        <div className="flex gap-3 flex-wrap">
          <Button intent="primary">Primary</Button>
          <Button intent="secondary">Secondary</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">Size</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider opacity-60">
          Disabled
        </h2>
        <div className="flex gap-3 flex-wrap">
          <Button intent="primary" disabled>
            Disabled
          </Button>
          <Button intent="secondary" disabled>
            Disabled
          </Button>
        </div>
      </section>
    </main>
  );
}
