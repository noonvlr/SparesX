# Modal

**Import:** `@/components/ui/Modal` (client)

## Props

`open`, `onClose`, `title`, `sheet` (mobile bottom sheet, default true), `footer`, `children`

## A11y

- `role="dialog"` + `aria-modal`
- Escape closes
- Focus trap (Tab / Shift+Tab)
- Restores focus to previously focused element
- Backdrop labeled for screen readers

## Don’t

Don’t rebuild custom overlays with `fixed inset-0` when Modal covers the need.
