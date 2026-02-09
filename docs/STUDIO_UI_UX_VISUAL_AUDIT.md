# Studio UI, UX & Visual Audit (ARCHIVED)

> **Note**: This audit was conducted to guide the "Neural Glass" redesign (Feb 2026). All critical issues have been resolved. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for current standards.

**Scope:** HIVE-R Studio (layout shell, top nav, side nav, chat panel, graph area).  
**Principles:** 4px grid, visual hierarchy (3 levels), token-first, sufficient breathing room, no overlap.

---

## 1. UI Audit

### 1.1 Layout & structure
| Issue | Location | Finding |
|-------|----------|--------|
| **Content hugs viewport** | Layout shell | Outer padding `p-3 md:p-4` is too small; content touches screen edges. |
| **Main area padding** | Layout shell | `p-6 md:p-8` only when `!noScroll`; Studio uses `noScroll` and inner `p-4 md:p-6` — inconsistent and tight. |
| **No safe area** | Global | No consistent “content inset” (e.g. 24px/32px) from chrome; nav and content feel cramped. |
| **Chat vs graph ratio** | App.tsx | Fixed `w-[400px]` + `flex-1` is fine; gap and padding between panels is small (`gap-6`, `p-4 md:p-6`). |

### 1.2 Spacing system
| Issue | Finding |
|-------|--------|
| **Inconsistent scale** | Mix of `3`, `4`, `5`, `6` (Tailwind units) without a 4px-grid rule; design system specifies 4px rhythm. |
| **Tight internal padding** | Headers use `px-5 py-3`; nav items `px-4 gap-4`; buttons `pl-2 pr-4` — all below comfortable minimum. |
| **Section spacing** | Side nav “Platform” / “Sessions” use `mb-3` / `mb-4`; divider `my-6`; no consistent section rhythm. |

### 1.3 Overlap & clipping
| Issue | Location | Cause |
|-------|----------|--------|
| **Notification badge over icon** | Top nav Bell | Badge `top-2 right-2` on a 40px icon button; badge can overlap icon or sit on edge. |
| **Profile text + avatar** | Top nav | `gap-3` between avatar and “Founder”; no `min-width` on button; text can touch avatar. |
| **Active indicator over label** | Side nav | Honey bar `right-0` with no inset; label can run under the bar when truncated. |
| **Send button in input** | ChatPanel | Button `right-1.5 top-1.5` with input `pr-14`; tight and can feel overlapped. |
| **Sparkles button** | Graph card | `top-4 right-4` with no inset from card edge; hugs corner. |

### 1.4 Alignment & touch targets
| Issue | Finding |
|-------|--------|
| **Nav item height** | `h-12` is good; horizontal padding and icon–text gap are tight. |
| **Icon buttons** | Many `h-10 w-10`; ensure 44px min for touch. |
| **Section headings** | “Platform” / “Sessions” aligned with nav items but little space above/below. |

---

## 2. UX Audit

### 2.1 Hierarchy & clarity
| Issue | Finding |
|-------|--------|
| **Primary action** | Chat input and Send are clear; Sparkles (Plugins) in graph is secondary but looks like a primary CTA due to position. |
| **Section identity** | Side nav sections (Platform vs Sessions) need more separation (space + typography). |
| **Empty states** | “No sessions yet” and chat welcome are clear; could use more vertical spacing. |

### 2.2 Consistency
| Issue | Finding |
|-------|--------|
| **Studio vs rest of app** | Studio uses `void-*`, `starlight-*`, `electric-violet`; layout uses `hive-*` — two vocabularies. |
| **Padding patterns** | Some areas use `p-4`, others `p-5`/`p-6` with no rule (e.g. “cards get p-6”, “bars get px-6 py-4”). |

### 2.3 Feedback & affordances
| Issue | Finding |
|-------|--------|
| **Loading** | Typing indicator and “Processing...” are present; panel could have a clearer loading state. |
| **Buttons** | Ghost/outline variants are distinguishable; icon-only buttons need titles (already present). |

---

## 3. Visual Audit

### 3.1 Typography
| Issue | Finding |
|-------|--------|
| **Scale** | Mix of `text-xs`, `text-sm`, `text-base`, `text-xl` without a single scale (e.g. body, body-sm, caption, h4). |
| **Weights** | `font-medium` / `font-semibold` used; hierarchy could be clearer (e.g. section = caption, item = medium). |

### 3.2 Color
| Issue | Finding |
|-------|--------|
| **Undefined tokens** | `void-*`, `starlight-*`, `electric-violet`, `plasma-green`, `reactor-core`, `honey-glow` used in Studio but not defined in `tailwind.config.ts` — may not compile or can be inconsistent. |
| **Design system** | `hive-*` is the single source of truth; Studio should use hive-* (or tokens must be added). |
| **Borders** | Mix of `border-white/5`, `border-hive-border-subtle`, `border-white/10` — pick one system. |

### 3.3 Borders, shadows, depth
| Issue | Finding |
|-------|--------|
| **Cards** | `border-white/5` + `shadow-2xl` + `glass` — consistent; internal padding of cards varies. |
| **Panels** | Chat and graph cards have good separation; internal spacing is what makes it feel “thrown together.” |

---

## 4. Summary of required fixes

1. **Spacing**
   - Apply a consistent 4px-based spacing scale (e.g. 8, 12, 16, 24, 32px).
   - Increase shell padding (e.g. 24px / 32px).
   - Increase top nav horizontal padding and right-block margin.
   - Increase side nav logo, nav, and footer padding; add section spacing.
   - Increase ChatPanel header, message area, and input padding; increase graph card inset for Sparkles.

2. **Overlap & clipping**
   - Position notification badge with inset so it never overlaps the Bell icon; consider smaller badge or different position.
   - Ensure profile button has enough gap and min-width so “Founder” doesn’t touch avatar.
   - Give nav item active bar an inset so label doesn’t run under it.
   - Give chat send button and graph Sparkles button clear insets (e.g. 20–24px from edges).

3. **Tokens & consistency**
   - Add missing color tokens to Tailwind (void, starlight, electric-violet, plasma-green, etc.) or replace Studio usage with hive-*.
   - Use one border system (e.g. hive-border-subtle / light) across Studio and layout.

4. **Layout**
   - Main content: consistent inner padding when `noScroll` (e.g. p-6 md:p-8).
   - Chat header: use a single padding token (e.g. px-6 py-4) and gap between icon and title.
   - Side nav: clear spacing between logo, Platform, divider, Sessions, and footer.

5. **Visual hierarchy**
   - Section labels: consistent size/weight and margin (e.g. caption + mb-4).
   - Card internals: use CardHeader/CardContent padding (e.g. p-6) where applicable.

---

## 5. Implementation checklist

- [x] Add void, starlight, electric-violet, plasma-green (and related) to `tailwind.config.ts` for Studio components that still use them.
- [x] Layout shell: increase outer padding (`p-4 md:p-6`), gap (`gap-4 md:gap-6`), and main content padding (`lg:p-10`).
- [x] Top nav: horizontal padding `px-5 md:px-8`; notification badge `top-1.5 right-1.5` with `min-w-10` on button; profile `pl-3 pr-5 gap-3.5` and right-block `gap-4 ml-4`.
- [x] Side nav: logo `px-6 py-4`; main nav `py-6 px-5 pr-6`; section headings `mb-4 px-1`; nav items `pl-5 pr-6 gap-5`; active bar `right-2` inset; footer `p-4`, Sign Out `px-4 mr-4`.
- [x] ChatPanel: header `px-6 py-4` and `gap-4`; message area `p-5`; input area `p-5`; send button `right-2 top-2`; input `pr-[3.25rem]`.
- [x] Graph card: Sparkles/controls `top-5 right-5` and `gap-3`; Builder overlay `bottom-10 left-10`.
- [x] Studio Chat and graph card normalized to hive-* tokens where appropriate; modals use `bg-card` and `border-hive-border-subtle`.
