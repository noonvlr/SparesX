# SparesX Design System

Teal-branded, light-first UI kit built on CSS variables, Tailwind v4, and CVA.

## Principles

- **Tokens first** — colors, spacing, type, radius, shadow, motion, and z-index live in [`src/app/globals.css`](../../src/app/globals.css).
- **Compose from the kit** — prefer `@/components/ui/*` over one-off button/input CSS.
- **No new palette hardcodes** — avoid `bg-gray-*`, `bg-blue-*`, `bg-teal-*`, and raw hex in app UI (WhatsApp `#25D366` is the only intentional brand exception).
- **Light ships now** — `[data-theme="dark"]` token overrides are scaffolded; no theme toggle yet.

## Imports

```tsx
// Client components / interactive controls
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Server-safe class recipes for <Link>
import { buttonVariants } from "@/components/ui/button-variants";

// Layout shells
import { AuthPage, DashboardPage, MarketplacePage, AdminPage } from "@/components/layout";

// Feedback
import { LoadingState, ErrorState, EmptyState } from "@/components/feedback";
```

Prefer **path imports** over the `@/components/ui` barrel in Server Components.

## Folder map

| Path | Role |
|------|------|
| `src/app/globals.css` | Design tokens + base utilities |
| `src/components/ui/` | Primitives (Button, Input, Card, Modal, …) |
| `src/components/forms/` | Form re-exports (Field, Select, …) |
| `src/components/feedback/` | Empty / Error / Loading |
| `src/components/layout/` | Page shells |

## Docs in this folder

- [tokens.md](./tokens.md) — token reference + migration cheat sheet
- [theming.md](./theming.md) — light / dark / system architecture
- [button.md](./button.md)
- [input.md](./input.md)
- [field.md](./field.md)
- [select.md](./select.md)
- [card.md](./card.md)
- [modal.md](./modal.md)
- [alert.md](./alert.md)
- [spinner.md](./spinner.md)
- [icon-button.md](./icon-button.md)
- [table.md](./table.md)
- [layout.md](./layout.md)
- [feedback.md](./feedback.md)

## Accessibility baselines

- Focus rings use `--focus-ring` / brand outline.
- Modal: Escape closes, focus trap, restore focus on close, `aria-modal`.
- `prefers-reduced-motion` disables decorative transitions (see globals + Motion helpers).
- Loading / toast surfaces expose `role="status"` / `aria-live`.
