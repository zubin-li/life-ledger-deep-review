# Accessibility & Cross-Browser Smoke-Check Guide

> **Time estimate:** ~15 minutes  
> **Purpose:** Verify keyboard access, screen-reader labels, theme behavior, responsive layout, and reduced-motion support across browsers before submitting a pull request.

## Privacy reminder

Use **fictional data only** during testing. Never attach real journal entries, calendar details, email addresses, access tokens, or personal photos to issues, screenshots, or test fixtures.

---

## Required checks

Complete every check in this section before marking a PR ready for review.

### 1. Keyboard navigation

| Page | Action | Pass condition |
|------|--------|----------------|
| Today | Press <kbd>Tab</kbd> through all interactive controls | Focus ring is visible on every button, link, and input in document order |
| Today | Press <kbd>Enter</kbd> / <kbd>Space</kbd> on the primary action button | The action fires (e.g., habit toggled, reflection saved) |
| Week | Press <kbd>Tab</kbd> into the weekly summary | All day cells are reachable; pressing <kbd>Enter</kbd> selects a day |
| Review | Open a modal dialog with keyboard | Focus moves into the dialog; <kbd>Escape</kbd> closes it and returns focus to the trigger |
| Review | With a modal open, press <kbd>Tab</kbd> repeatedly | Focus stays trapped inside the dialog and does not reach background content |
| Habit Settings | Navigate the settings list | Every toggle, input, and save button is reachable and operable with keyboard alone |
| Backup / Restore | Activate the backup or restore action | File picker opens or confirmation dialog appears via keyboard |

### 2. Screen-reader labels

| Element | Pass condition |
|---------|----------------|
| Icon-only buttons (close, settings gear, navigation arrows) | Each has a non-empty accessible name (via `aria-label`, `aria-labelledby`, or visually hidden text) |
| Habit toggle controls | State change is announced (e.g., "checked" / "unchecked") |
| Navigation landmarks | Page has identifiable `<main>`, `<nav>`, and `<header>` regions |

### 3. Theme support

| Theme | Pass condition |
|-------|----------------|
| Light | Text and interactive elements have sufficient contrast; no invisible controls |
| Dark | Background, text, and borders render correctly; no white flashes on load |
| System (auto) | Switching the OS theme preference updates the app without a reload |

### 4. Reduced motion

| Setting | Pass condition |
|---------|----------------|
| `prefers-reduced-motion: reduce` enabled in OS or browser | Animations (transitions, carousel slides, loading spinners) are either removed or replaced with an instant/crossfade alternative |

### 5. Responsive layout

| Viewport | Pass condition |
|----------|----------------|
| 320 px wide (portrait) | No horizontal scrollbar; all text is readable; touch targets are at least 44 × 44 px |
| 390 px wide (portrait) | Layout matches the 320 px check; content uses available width without clipping |
| Desktop (≥ 1024 px) | Sidebar, main content, and any detail panels render side by side where intended |

---

## Optional platform checks

These are recommended when the change touches layout, fonts, input handling, or theme CSS.

| Browser / platform | Notes |
|--------------------|-------|
| Safari on macOS | Check VoiceOver with <kbd>⌘ F5</kbd>; verify focus styles and modal trapping |
| Safari on iOS | Test touch targets and swipe navigation; confirm no zoom-blocking `<meta>` tag |
| Chrome on Android | Test with TalkBack if available; verify dark/light theme and responsive layout |
| Firefox (desktop) | Verify `:focus-visible` styles and reduced-motion behavior |

---

## Quick reference: flows to cover

1. **Today** — planning view, habit toggles, reflection input
2. **Week** — weekly summary, day selection
3. **Review** — daily / monthly review, modal dialogs
4. **Habit Settings** — create, edit, reorder, delete habits
5. **Backup / Restore** — export data, import from file
6. **One modal flow** — any dialog (e.g., confirm delete, edit habit) for focus-trap and escape behavior

---

## Language coverage

Run each flow at least once with **English**, and spot-check at least one flow in **Simplified Chinese** and **German** to confirm that labels, button text, and dialog content are not clipped or misaligned.
