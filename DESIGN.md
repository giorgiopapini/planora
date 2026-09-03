# Planora Design System

Single source of truth for product UI/UX. Read this file before writing frontend code. If a decision is not covered here, add it before implementing it.

## Product direction

Planora is a light, airy, professional project-management workspace. The visual language is calm and scannable: generous whitespace, white surfaces, thin borders, restrained motion, and one green action color. It should feel modern and confident without becoming sterile or dense.

- Light mode is the default and current supported theme.
- Green is reserved for primary, positive, active, and completed states.
- Never use blue or indigo as an accent.
- Static surfaces use borders, not drop shadows.
- Information hierarchy must remain understandable without color.

## Layout and responsive behavior

- App background: `bg-page`.
- Main content is centered with a maximum width of 1440px.
- Page padding: 40px desktop, 24px tablet, 16px mobile.
- Top navigation height: 64px desktop; compact 56px mobile.
- Desktop dashboard grids use 12 columns with 24px gutters.
- Stat tiles: 4 columns desktop, 2 columns from 600–899px, 1 column below 600px.
- Two-column content cards become one column below 960px.
- Cards never create horizontal scrolling; content wraps or truncates gracefully.
- Minimum supported viewport: 320px.
- Touch targets are at least 44px on mobile and 36px on desktop.

## Color tokens

| Token            | Hex       | Usage                                      |
| ---------------- | --------- | ------------------------------------------ |
| `bg-page`        | `#F7F8FA` | Application background                     |
| `bg-surface`     | `#FFFFFF` | Cards, panels, navigation                  |
| `bg-subtle`      | `#F9FAFB` | Secondary panels and hover surfaces        |
| `bg-muted`       | `#F3F4F6` | Tracks, badges, disabled surfaces          |
| `border`         | `#E5E7EB` | Borders and dividers                       |
| `border-strong`  | `#D1D5DB` | Focus-adjacent or emphasized borders       |
| `text-primary`   | `#111827` | Headings and primary content               |
| `text-secondary` | `#6B7280` | Metadata, descriptions, breadcrumbs        |
| `text-tertiary`  | `#9CA3AF` | Placeholder and low-emphasis content       |
| `text-link`      | `#16A34A` | Inline links                               |
| `accent`         | `#16A34A` | Primary actions, active states, checkmarks |
| `accent-hover`   | `#15803D` | Accent hover/pressed state                 |
| `accent-soft`    | `#F0FDF4` | Selected and positive backgrounds          |
| `accent-border`  | `#BBF7D0` | Positive borders                           |
| `danger-soft`    | `#FEE2E2` | Destructive icon backgrounds               |
| `danger`         | `#DC2626` | Destructive actions and errors             |
| `warning-soft`   | `#FEF3C7` | Warnings only                              |
| `warning`        | `#B45309` | Warning text/icons only                    |
| `info-soft`      | `#F3F4F6` | Informational background without blue      |

### Chart tint scale

Use one green hue family for status and priority visualizations. Always include text, values, or legends so color is not the only signal.

| Token      | Hex       |
| ---------- | --------- |
| `tint-900` | `#065F46` |
| `tint-700` | `#059669` |
| `tint-500` | `#34D399` |
| `tint-300` | `#6EE7B7` |
| `tint-100` | `#D1FAE5` |
| `tint-50`  | `#F0FDF4` |

## Typography

- Primary font: Inter, loaded through `next/font/google` as `--font-inter`.
- Fallback: `Arial, Helvetica, sans-serif`; never use a technical monospace font for UI.
- Scale: 12, 13, 14, 16, 20, 28px.
- Page title: 28px / 36px, weight 600, letter-spacing -0.02em.
- Card title: 16px / 24px, weight 600.
- Stat value: 20px / 28px, weight 600.
- Body: 14px / 22px, weight 400.
- Compact metadata: 12–13px / 20px.
- Navigation: 14px / 20px, weight 500.
- Avoid all-caps labels except short eyebrow labels; use 11px, 600, 0.08em tracking.

## Spacing, radius, and elevation

Use a 4px base unit. Preferred spacing is 8, 12, 16, 24, 32, 40px.

- Card padding: 24px desktop, 16px mobile.
- Card gap: 24px.
- Inline control gap: 8px.
- Radius: 12px cards/stat tiles, 8px controls, 6px compact controls, 9999px pills.
- Static elevation: none; white surface plus `1px solid border`.
- Floating overlays/tooltips: subtle `0 8px 24px rgb(17 24 39 / 8%)`.
- Focus ring: 2px accent with 2px offset.

## Components

### Buttons

- Primary: accent background, white text, accent-hover on hover.
- Secondary: white background, border, primary text; subtle bg-subtle hover.
- Ghost: transparent; muted text; bg-muted hover.
- Danger: danger background, white text; use only for destructive actions.
- Sizes: sm 32px, md 36px, lg 44px.
- Use sentence case and a leading icon only when it improves recognition.
- Disabled buttons use muted background/text and `cursor-not-allowed`.

### Inputs and selects

- Height: 36px default, 44px large.
- White background, border, 8px radius.
- Label is always visible; helper/error text sits below.
- Placeholder uses text-tertiary.
- Focus uses accent border plus focus ring.
- Errors use danger border/text and an explicit message.

### Cards and panels

- White background, border, 12px radius, no static shadow.
- Header supports title, description, actions, and optional divider.
- Keep internal spacing generous; never compress content to fit.

### Badges and status chips

- Full pill radius, 12–13px text, 6px horizontal padding.
- Count badges use bg-muted and text-primary.
- Status badges pair text with an icon or label and must remain readable without hue.

### Tables and list rows

- Rows are at least 52px high.
- Use 16px horizontal padding and 12px vertical rhythm.
- Hover uses bg-subtle; selected rows use accent-soft and a visible accent indicator.
- Align numeric values to the right; preserve consistent column alignment.

### Avatars

- Default size 32px; compact 24px; large 40px.
- Circular, with initials fallback and accessible name.
- Avatar groups overlap by 8px and show a count badge for overflow.

### Progress and charts

- Progress tracks use bg-muted and accent fill, with a visible percentage label.
- Segmented bars have rounded outer ends and no gaps.
- Bar charts have rounded top corners, accessible labels, and a white bordered tooltip.
- Use reduced motion for chart appearance when requested.

### Navigation and breadcrumbs

- Nav items are text-secondary, active text-primary with a 2px accent bottom border.
- Icons are outline-style, 16–20px, and aria-hidden when paired with text.
- Breadcrumbs are 13px, text-secondary, slash-separated, with no underline.
- Mobile navigation collapses to a menu trigger and preserves the current page label.

### Feedback, overlays, and empty states

- Toasts are concise, actionable, and dismissible; never rely on color alone.
- Dialogs trap focus, close on Escape, and have explicit title and description.
- Centered creation dialogs use a bordered white surface over a subdued page overlay; forms provide Cancel and a clear primary action.
- Tooltips appear after a short hover/focus delay; no slide or bounce.
- Empty states explain what is missing and provide one clear next action.
- Loading uses neutral skeletons matching final geometry.
- Errors explain recovery and offer retry where possible.

## Interaction and motion

- Hover/focus transitions: 120ms ease-out.
- Tooltip fade: 100ms.
- Dialog fade: 160ms; no bounce.
- Respect `prefers-reduced-motion: reduce`; remove non-essential transitions.
- Buttons and controls provide immediate pressed/disabled feedback.
- Keyboard focus must be visible at all times.

## Accessibility

- Target WCAG 2.2 AA.
- Use semantic HTML and a logical heading hierarchy.
- Every form control has a label; icon-only controls have an accessible name.
- Keyboard navigation must cover navigation, menus, dialogs, tabs, charts, and lists.
- Do not communicate status with color alone.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text/UI boundaries.
- Provide screen-reader summaries for charts and data tables when visual data is complex.
- Support 200% zoom and reflow without loss of function.
- Respect reduced motion and high-contrast user preferences.

## Content and data rules

- Numbers use comma grouping: `1,250`.
- Percentages use whole numbers unless precision changes the decision.
- Dates use `MMM d, yyyy`; relative time is used only in activity feeds.
- Long names wrap to two lines before truncating with a title tooltip.
- Missing avatars use initials.
- Zero states say what zero means, rather than showing an unexplained `0`.
- Destructive actions require clear labels and confirmation when irreversible.

## Implementation rules

- Tailwind CSS v4 theme tokens live in `app/globals.css` using `@theme inline`.
- Reusable primitives live in `components/ui/` and accept `className` overrides.
- Prefer semantic variants and composition over page-specific utility duplication.
- Use CSS variables for tokens; never hard-code a new color inline.
- Add design decisions here before adding one-off frontend styling.
- Supported browsers are current Chrome, Edge, Firefox, and Safari releases.
