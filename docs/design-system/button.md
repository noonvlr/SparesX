# Button

**Import:** `@/components/ui/Button` (client) · variants `@/components/ui/button-variants` (server-safe)

## Purpose

Primary interactive control for actions and form submits.

## Variants

`primary` | `secondary` | `outline` | `ghost` | `link` | `danger` | `soft` | `success`

## Sizes

`sm` | `md` | `lg` | `icon`

## Props

- `loading` — shows spinner, disables control
- `asChild` — Radix Slot (compose with Link carefully; prefer `buttonVariants` on `<Link>`)

## Do / don’t

- **Do** use `buttonVariants` on Next `<Link>` from server components
- **Don’t** invent new teal/blue button classes on pages

## A11y

Focus-visible ring; `aria-busy` when loading; disabled when loading.
