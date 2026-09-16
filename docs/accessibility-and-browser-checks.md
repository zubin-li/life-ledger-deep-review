# Accessibility & Cross-Browser Smoke-Check Guide

> **Time estimate:** ~15 minutes
> **Purpose:** Verify keyboard access, screen-reader labels, theme behavior, responsive layout, and reduced-motion support across browsers before submitting a pull request.

## Privacy reminder

Use **fictional data only** during testing. Never attach real journal entries, calendar details, email addresses, access tokens, or personal photos to issues, screenshots, or test fixtures.

## Setup

Run `npm install`, `npm run dev`, and `npm test`, then open the local URL printed by the development server. The time estimate starts once the app is running.

---

## Required checks

Complete every check in this section before marking a PR ready for review.

### 1. Keyboard navigation

| Page | Action | Pass condition |
|------|--------|----------------|
| Today | Press <kbd>Tab</kbd> through all interactive controls | Focus ring is visible on every button, link, and input in document order |
| Today | Press <kbd>Enter</kbd> / <kbd>Space</kbd> on the primary action button | The action fires (e.g., habit toggled, reflection saved) |
| Week | Press <kbd>Tab</kbd> through the week navigator, goal horizon, checklist, and review action | Previous/current/next week, both horizon tabs, goal controls, and the review action are reachable and work with <kbd>Enter</kbd> / <kbd>Space</kbd> |
| Review | Open a modal dialog with keyboard | Focus moves into the dialog; <kbd>Escape</kbd> closes it and returns focus to the trigger |
| Review | With a modal open, press <kbd>Tab</kbd> repeatedly | Focus stays trapped inside the dialog and does not reach background content |
| Habit Settings | Navigate the settings list | Every toggle, input, and save button is reachable and operable with keyboard alone |
| Backup / Restore | Activate the backup or restore action | File picker opens or confirmation dialog appears via keyboard |

### 2. Screen-reader labels

| Page | Action | Pass condition |
|------|--------|----------------|
| Any view or dialog | Move a screen reader to icon-only controls such as close, settings, and navigation arrows | Each control has a non-empty accessible name via `aria-label`, `aria-labelledby`, or visually hidden text |
| Today | Toggle a habit with a screen reader | The control name and changed state are announced |
| Any view | Navigate by landmarks | The main content, primary navigation, and page header are identifiable as `<main>`, `<nav>`, and `<header>` regions |

### 3. Theme support

| Page | Action | Pass condition |
|------|--------|----------------|
| Today, Week, Review, Habit Settings | Select **Light** | Text and interactive elements have sufficient contrast; no controls disappear |
| Today, Week, Review, Habit Settings | Select **Dark** and reload once | Background, text, and borders remain legible; no persistent white flash appears on load |
| Any view | Select **System**, then switch the OS color preference | The app follows the OS theme without a page reload |

### 4. Reduced motion

| Page | Action | Pass condition |
|------|--------|----------------|
| Today and Habit Settings | Enable `prefers-reduced-motion: reduce`, then change carousel pages and open a dialog | Transitions and carousel motion are removed or replaced with an instant/crossfade alternative |

### 5. Responsive layout

| Page | Action | Pass condition |
|------|--------|----------------|
| Today, Week, Review, Habit Settings | Resize to 320 px wide and scroll through each page | No horizontal scrollbar appears; text remains readable; primary touch targets are at least 44 × 44 px |
| Today, Week, Review, Habit Settings | Resize to 390 px wide and repeat the core interactions | Content uses the available width without clipping, overlap, or inaccessible controls |
| Today, Week, Review, Habit Settings | Resize to at least 1024 px wide | Sidebar, main content, and detail panels render side by side where intended |

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
