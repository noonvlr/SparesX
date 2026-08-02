# Tokens

Source of truth: `src/app/globals.css` (`:root` + `[data-theme="dark"]` scaffold).

## Color

| Token | Use |
|-------|-----|
| `--brand` / `--brand-hover` / `--brand-soft` / `--brand-muted` | Primary actions, accents |
| `--ink` / `--ink-secondary` / `--muted` / `--ink-inverse` | Text |
| `--surface` / `--surface-2` / `--surface-3` / `--surface-elevated` / `--surface-hover` | Backgrounds |
| `--border` / `--border-strong` / `--divider` | Borders |
| `--success` / `--warning` / `--danger` / `--info` (+ `-soft`) | Semantic states |
| `--overlay` / `--glass-*` | Modals, frosted chrome |
| `--focus-ring` | Focus ring color |

## Spacing

`--space-0` … `--space-24` (2–96px, 8pt grid). Prefer Tailwind spacing that maps to the same rhythm (`p-4`, `gap-3`, …).

## Typography

CSS vars: `--text-display|heading|title|subtitle|body|caption|tiny|label|button`.

Utility classes: `.text-display`, `.text-heading`, `.text-title`, `.text-subtitle`, `.text-body`, `.text-caption`, `.text-tiny`, `.text-label`.

## Radius / shadow / motion / z

- Radius: `--radius-sm` … `--radius-xl`, `--radius-full`
- Shadow: `--shadow-sm` … `--shadow-lg`, `--shadow-dropdown`, `--shadow-modal`
- Motion: `--duration-fast|normal|slow`, `--ease-standard|emphasized`
- Z: `--z-nav`, `--z-sheet`, `--z-modal`, `--z-toast`, `--z-chat`, `--z-dropdown`, `--z-tooltip`
- Containers: `--container-sm|md|lg|xl`

## Migration cheat sheet

| Legacy | Token / kit |
|--------|-------------|
| `bg-gray-50` / `bg-slate-50` | `bg-[var(--surface-2)]` |
| `bg-white` | `bg-[var(--surface)]` |
| `bg-gray-100` | `bg-[var(--surface-3)]` |
| `text-gray-900` / `text-slate-900` | `text-[var(--ink)]` |
| `text-gray-500` / `text-slate-500` | `text-[var(--muted)]` |
| `border-gray-200` | `border-[var(--border)]` |
| `bg-teal-600` / `bg-blue-600` | `bg-[var(--brand)]` or `<Button>` |
| `text-teal-700` | `text-[var(--brand-hover)]` |
| `bg-red-50 text-red-700` | `bg-[var(--danger-soft)] text-[var(--danger)]` or `<Alert tone="danger">` |
| `bg-green-50 text-green-700` | success soft tokens or `<Badge tone="success">` |
| `focus:ring-teal-500` | `focus:ring-[var(--focus-ring)]` |
| Rainbow admin cards | `--*-soft` surfaces + `Card` |

## Dark scaffold

Set `data-theme="dark"` on a root element to activate dark token overrides. No toggle UI in v1.
