# Theming (Light / Dark / System)

SparesX themes via **CSS custom properties** + [`next-themes`](https://github.com/pacocoursey/next-themes).

## Architecture

1. Tokens live in `src/app/globals.css` under `:root` / `[data-theme="light"]` and `[data-theme="dark"]`.
2. `ThemeProvider` sets `data-theme` on `<html>` (`light` | `dark`), or resolves **system** from `prefers-color-scheme`.
3. Components only reference `var(--…)` — they never branch on theme.

## Usage

```tsx
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "next-themes";

// Prefer ThemeToggle UI over calling setTheme in features
<ThemeToggle />
<ThemeToggle showLabels /> // profile / more menus
```

Preference is stored in `localStorage` under `sparesx-theme`. Default: `system`.

## Adding a new theme

1. Add `[data-theme="…"] { … }` overrides for the same semantic token names.
2. Extend `ThemeToggle` options.
3. No component rewrites required.

## Rules

- Do **not** hardcode `bg-white`, `text-gray-*`, or `#000` in UI.
- Product / chat **images** stay natural (no filters).
- Glass only on nav, dropdowns, modals (tokens: `--glass-bg`, `--glass-blur`).
- Prefer `--primary-foreground` on brand fills for AA contrast in both themes.
