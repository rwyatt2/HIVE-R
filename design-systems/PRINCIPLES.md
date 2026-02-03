# 🌍 World-Class Design Principles

> **Version:** 1.0 | **Last Updated:** 2026-02-02
> 
> This document defines the foundational design principles that HIVE-R agents apply to every UI. Edit this file to customize or extend these standards.

---

## 1. Performance & Perceived Speed

| Principle | Guideline |
|-----------|-----------|
| Response Time | <100ms for clicks, <200ms for complex UI updates |
| Skeleton Screens | Show content structure immediately, fill in data |
| Optimistic UI | Update UI before server confirms (where safe) |
| Progressive Loading | Prioritize above-the-fold content |
| Time to Interactive | Target <3.5s on mobile, <1.5s on desktop |
| Bundle Size | <200KB initial JavaScript, code-split aggressively |

---

## 2. Visual Hierarchy

| Principle | Guideline |
|-----------|-----------|
| 3-Level Rule | Primary (Headlines/CTAs), Secondary (Subheads), Tertiary (Body) |
| Size Contrast | Headlines 2-3x larger than body text |
| Weight Contrast | Use bold sparingly—for emphasis only |
| Color as Hierarchy | Primary color for primary actions only |
| Z-Axis | Elevation (shadows) indicates importance/focus |
| Progressive Disclosure | Show essentials first, details on demand |

---

## 3. Spatial Design & Layout

| Principle | Guideline |
|-----------|-----------|
| 4px/8px Grid | All spacing snaps to multiples of 4px |
| Proximity | Related elements closer together |
| Alignment | Left-align text, center sparingly |
| Whitespace | Generous padding reduces cognitive load |
| Density Modes | Offer compact/comfortable/spacious options for power users |
| Container Widths | Max 1280px for content, 640px for reading |
| Responsive Breakpoints | 640, 768, 1024, 1280, 1536px |

---

## 4. Typography

| Principle | Guideline |
|-----------|-----------|
| Font Stack | 2 families max: Sans for UI, Mono for code |
| Base Size | 16px minimum for body text |
| Scale | Major Third (1.25) or Perfect Fourth (1.333) |
| Line Length | 50-75 characters per line |
| Line Height | 1.5x for body, 1.2x for headings |
| Measure | Limit paragraph width to ~65 characters |
| Weight Usage | Regular (400), Medium (500), Bold (700) |
| Letter Spacing | Headings can be tighter (-0.025em) |

---

## 5. Color & Theming

| Principle | Guideline |
|-----------|-----------|
| 60-30-10 Rule | 60% Neutral, 30% Primary, 10% Accent |
| Semantic Colors | Success=Green, Warning=Amber, Error=Red, Info=Blue |
| Neutrals | Use slate/gray scale, not pure black/white |
| Dark Mode | Near-black (#0F172A), not pure black (#000) |
| Contrast Ratios | 4.5:1 normal text, 3:1 large text (WCAG AA) |
| Color Blindness | Test with Deuteranopia, Protanopia, Tritanopia |
| Brand Usage | Primary color for CTAs and key actions only |
| Status Indicators | Never rely on color alone |

---

## 6. Interaction & Motion

| Principle | Guideline |
|-----------|-----------|
| Micro-interactions | 100-200ms for hovers, toggles |
| Transitions | 200-300ms for panel/modal transitions |
| Page Transitions | 300-500ms with easing |
| Easing | Use ease-out for enters, ease-in for exits |
| Spring Physics | For playful/premium feel, use spring animations |
| Reduced Motion | Respect `prefers-reduced-motion` system setting |
| Loading States | Skeleton > Spinner > Blocking |
| Hover States | Subtle feedback (darken 5-10%, slight scale) |
| Active States | Visible press feedback (darken 15-20%) |
| Focus States | 2px ring, offset, high contrast color |

---

## 7. Accessibility (A11y)

| Principle | Guideline |
|-----------|-----------|
| Keyboard Nav | All actions achievable via keyboard |
| Focus Order | Logical tab order matching visual flow |
| Focus Visible | 2px+ ring, offset, contrast 3:1 minimum |
| Skip Links | "Skip to main content" for long pages |
| Semantic HTML | Correct use of `<button>`, `<nav>`, `<main>`, `<article>` |
| ARIA Usage | Last resort—prefer native semantics |
| Alt Text | Describe function, not appearance |
| Captions | All video content captioned |
| Touch Targets | 44x44px minimum (48x48 preferred) |
| Zoom Support | Layouts functional at 200% zoom |
| Screen Reader | Test with VoiceOver/NVDA regularly |

---

## 8. Forms & Input

| Principle | Guideline |
|-----------|-----------|
| Labels | Always visible (not placeholder-only) |
| Placeholder | Example data, not instructions |
| Input Size | 44px height minimum for touch |
| Validation | Inline, on blur, with helpful messages |
| Error Messages | Specific and actionable |
| Required Fields | Mark optional, not required (fewer required) |
| Autofill | Support browser autofill attributes |
| Password Visibility | Toggle to show/hide |
| Multi-step Forms | Progress indicator, save state |
| Smart Defaults | Pre-fill with sensible defaults |

---

## 9. Error Handling & Recovery

| Principle | Guideline |
|-----------|-----------|
| Prevention | Validate before submission |
| Graceful Degradation | System errors ≠ user errors |
| Error Messages | Explain what happened AND how to fix |
| Blame the System | Never "Invalid input"—explain why |
| Recovery Path | Always provide next steps |
| Undo Support | Allow reversal of destructive actions |
| Confirmation | For destructive actions, require explicit confirm |
| Empty States | Guide users to take action |
| Offline Support | Handle network failures gracefully |

---

## 10. Navigation & Information Architecture

| Principle | Guideline |
|-----------|-----------|
| Primary Nav | 5-7 items maximum |
| Breadcrumbs | For deep hierarchies |
| Search | Prominent on content-heavy sites |
| Current Location | Always indicate where user is |
| Back Button | Respect browser history |
| Deep Linking | Every state should be URL-addressable |
| Mobile Nav | Hamburger or bottom tabs (5 max) |
| Contextual Actions | Actions near the content they affect |

---

## 11. Content & Microcopy

| Principle | Guideline |
|-----------|-----------|
| F-Pattern | Key info at top and left |
| Front-Loading | Important words first |
| Scannable | Short paragraphs, bullet points |
| Consistent Terminology | Same action = same word everywhere |
| Tone | Helpful, human, not cute |
| Button Labels | Verbs: "Save", "Send", "Create" (not "OK") |
| Confirmation Messages | Confirm what happened |
| Help Text | Available but not intrusive |

---

## 12. Mobile-Specific

| Principle | Guideline |
|-----------|-----------|
| Thumb Zones | Primary actions in bottom 1/3 of screen |
| Touch Targets | 44x44px minimum |
| Gestures | Support swipe, pull-to-refresh where expected |
| Orientation | Support both, or gracefully restrict |
| Safe Areas | Respect notches and home indicators |
| Input Types | Correct keyboard for email, phone, number |
| Performance | Test on real mid-tier devices |

---

## 13. Data Display

| Principle | Guideline |
|-----------|-----------|
| Tables | Sticky headers, horizontal scroll on mobile |
| Pagination | Show current position, total count |
| Sorting | Clear indicators, remembers state |
| Filtering | Visible active filters, easy clear |
| Empty State | Explain why empty, suggest action |
| Loading | Skeleton matching expected content |
| Truncation | Ellipsis with full text on hover/expand |
| Numbers | Right-align, consistent decimal places |

---

## 14. Internationalization (i18n)

| Principle | Guideline |
|-----------|-----------|
| Text Expansion | Allow 50% extra space for translations |
| RTL Support | Flip layouts for RTL languages |
| Date/Time | Use locale-aware formatting |
| Numbers | Locale-specific separators |
| Icons | Avoid text in icons |
| Pluralization | Handle singular/plural correctly |

---

## 15. Security UX

| Principle | Guideline |
|-----------|-----------|
| Auth Feedback | Don't reveal if username exists |
| Password Requirements | Show requirements before, not after |
| Session Expiry | Warn before timeout, offer extension |
| Sensitive Data | Mask by default, reveal on request |
| Confirm Actions | Require password for critical changes |
| 2FA | Support TOTP/WebAuthn, graceful recovery |

---

## 16. Component Patterns

| Principle | Guideline |
|-----------|-----------|
| Atomic Design | Atoms → Molecules → Organisms → Templates |
| Composition | Build from primitives, not monoliths |
| Variants | Size (sm/md/lg), State (default/hover/active/disabled) |
| Consistency | Same component for same function |
| Customization | Props over CSS overrides |
| Documentation | Usage examples for every component |

---

## How to Update

1. Edit this file directly
2. Changes take effect immediately for all agents
3. Add new sections as needed
4. Remove principles that don't apply to your context

---

*Based on: Nielsen Norman Group, Material Design, Apple HIG, Ant Design, and production experience at world-class product companies.*
