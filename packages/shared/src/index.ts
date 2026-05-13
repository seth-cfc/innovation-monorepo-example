export type AppName = "web" | "docs";

export function formatGreeting(appName: AppName, name = "team"): string {
  return `Hello, ${name}! You're looking at the "${appName}" app, powered by @repo/shared.`;
}

export function getMonorepoTagline(): string {
  return "One change in @repo/shared, every app feels it.";
}

export type MonorepoFeature = {
  title: string;
  description: string;
};

export function getSharedFeatures(): MonorepoFeature[] {
  return [
    {
      title: "Single source of truth",
      description:
        "Edit a function once in packages/shared and both apps update on the next render.",
    },
    {
      title: "Type-safe across boundaries",
      description:
        "Types flow from the package straight into web and docs, no publishing, no syncing.",
    },
    {
      title: "Refactor without fear",
      description:
        "Rename a function and TypeScript shows you every consumer in the monorepo.",
    },
  ];
}

export function getSharedTimestamp(): string {
  return new Date().toISOString();
}
