import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Code } from "@repo/ui/code";
import {
  formatGreeting,
  getMonorepoTagline,
  getSharedFeatures,
} from "@repo/shared";

const STACK = [
  {
    title: "Next.js",
    href: "https://nextjs.org/docs",
    description: "The React framework rendering this page.",
  },
  {
    title: "Tailwind",
    href: "https://tailwindcss.com/docs",
    description: "Utility-first CSS, themed via @repo/theming.",
  },
  {
    title: "pnpm",
    href: "https://pnpm.io/workspaces",
    description: "Workspace manager wiring every @repo/* package.",
  },
  {
    title: "Bun",
    href: "https://bun.com/docs",
    description: "Runtime for the @repo/cli standalone binary.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 sm:p-20 gap-16">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-3xl w-full">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-app-accent" />
          <h1 className="text-3xl font-semibold tracking-tight">
            Innovation Monorepo
          </h1>
        </div>

        <span className="inline-flex items-center self-start rounded-full bg-app-accent-soft text-app-accent px-3 py-1 text-xs font-medium">
          docs
        </span>

        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 border-l-4 border-l-brand-purple p-6 flex flex-col gap-3 w-full">
          <strong className="text-base">{formatGreeting("docs")}</strong>
          <em className="opacity-70 text-sm">{getMonorepoTagline()}</em>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-sm leading-6">
            {getSharedFeatures().map((feature) => (
              <li key={feature.title}>
                <strong>{feature.title}:</strong> {feature.description}
              </li>
            ))}
          </ul>
        </section>

        <ol className="font-mono text-sm leading-6 list-decimal list-inside">
          <li className="mb-2">
            Edit{" "}
            <Code className="rounded bg-brand-red/10 text-brand-red px-1.5 py-0.5 font-semibold">
              packages/theming/shared.css
            </Code>{" "}
            to change tokens used by <strong>both</strong> apps.
          </li>
          <li className="mb-2">
            Edit{" "}
            <Code className="rounded bg-app-accent-soft text-app-accent px-1.5 py-0.5 font-semibold">
              packages/theming/docs.css
            </Code>{" "}
            to change tokens used by <strong>only this</strong> app.
          </li>
          <li>
            Edit <Code>packages/shared/src/index.ts</Code> to change shared
            logic.
          </li>
        </ol>

        <div className="flex gap-4 flex-wrap">
          <Button intent="primary">Primary</Button>
          <Button intent="secondary">Secondary</Button>
        </div>

        <section className="w-full flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
            Built with
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STACK.map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card title={item.title}>{item.description}</Card>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
