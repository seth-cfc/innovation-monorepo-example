# playground

Isolated sandbox for `@repo/ui` components. Each component gets its own route under `app/<slug>/page.tsx`.

```bash
pnpm --filter playground dev   # http://localhost:3002
```

Add a new component:

1. Create `app/<slug>/page.tsx` with the variants you want to render.
2. Add an entry to the `ENTRIES` array in `app/page.tsx`.

Imports go through the public `@repo/ui/<component>` subpath like any other consumer — the playground catches regressions in the export surface, not just the component internals.
