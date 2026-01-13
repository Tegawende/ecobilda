# Ecobilda Design System & Style Guide

This document serves as the **single source of truth** for the visual design and UI components of the Ecobilda platform. It is intended to be used by developers and AI assistants to ensure consistency across all pages.

> [!IMPORTANT]
> **Component Library**: We use **Mantine v7** as our primary component library. Use Mantine components (Button, TextInput, Select, Modal, RangeSlider, etc.) whenever possible for consistency and accessibility.

> [!IMPORTANT]
> **Design Consistency Rule**: Before creating or adding new graphic elements or components on any page:
> 1.  **Check if a Mantine component exists** for the use case.
> 2.  **Check THIS DOCUMENT** (Rules & Components sections).
> 3.  **If not defined here**, check if a similar element exists on the **Home Page** or **Registration Page** and use it as inspiration.
> 4.  **Do not invent** new styles if a defining pattern is already established.

## 1. Core Colors
Defined in `index.css` / Tailwind Config.

| Name | Variable | Hex (Approx) | Usage |
|------|----------|--------------|-------|
| **Eco Primary** | `--color-eco-primary` | `#70A771` | Main buttons, active states, brand highlights. |
| **Eco Primary Dark** | `--color-eco-primaryDark` | *Darker Green* | Hover states for primary buttons. |
| **Eco Secondary** | `--color-eco-secondary` | *Teal/Blue* | Secondary actions, "Open" badges. |
| **Eco Terracotta** | `--color-eco-terracotta` | `#c9696b` | Accents, icons (MapPin, Calendar), "Workshop" badges. |
| **Eco Cream** | `--color-eco-cream` | `#F6F5F1` | Backgrounds, soft sections. |

**Neutral Palette**:
*   Backgrounds: `bg-stone-50` (Light gray/warm), `bg-white`.
*   Text: `text-gray-900` (Headings/Primary), `text-gray-600` (Body/Secondary), `text-gray-500` (Placeholders/Meta).

## 2. Typography

*   **Font Family**:
    *   **Headings**: `font-display` (e.g., Outfit). Bold (`font-bold`) or Semibold.
    *   **Body**: `font-sans` (e.g., Inter/Roboto).
*   **Sizes**:
    *   Section Titles: `text-3xl sm:text-4xl font-bold tracking-tight`.
    *   Card Titles: `text-xl font-bold`.
    *   Input Text: `text-base` (default) or `text-sm`.
    *   Button Text: `text-sm font-semibold`.

## 3. Components (Crucial)

### A. Inputs (Search & Forms)
**Style**: Airbnb-inspired. Clean, deeply rounded, strong focus state.

*   **Container**: `w-full relative`.
*   **Base Classes**:
    ```tsx
    w-full py-3 rounded-xl border border-gray-400 
    text-gray-900 placeholder-gray-500 shadow-sm transition-all
    outline-none
    ```
*   **State: Default**: `border-gray-400`
*   **State: Focus (Selected)**: `focus:border-black focus:ring-2 focus:ring-black`. (**Crucial**: Black 2px ring).
*   **Layout Rules**:
    *   **Name Fields**: Place First Name and Last Name on the same row (`grid grid-cols-2 gap-2`).
    *   **Spacing**: `gap-5` between form groups.
*   **Padding**:
    *   Standard: `px-4`.
    *   With Icon (Left): `pl-10` (Icon absolute at `left-3`).
*   **Icons**: `text-gray-500` (default) or `text-eco-terracotta` (for accents).

### B. Buttons (Navbar & Actions)
**Style**: Pill-shaped, elevated, floating effect.

*   **Shape**: `rounded-full`.
*   **Dimensions**: `px-6 py-2.5 text-sm font-semibold`. (Larger buttons may use `py-3`).
*   **Shadows**: `shadow-lg hover:-translate-y-0.5 transition-all duration-300`.
*   **Variants**:
    *   **Primary (Solid)**:
        ```tsx
        bg-eco-primary text-white hover:bg-eco-primaryDark border border-transparent
        shadow-eco-primary/20
        ```
    *   **Ghost / Transparent (On Image)**:
        ```tsx
        bg-white/75 backdrop-blur text-eco-primary hover:bg-white border border-transparent
        ```
    *   **Outline**: `border border-gray-200 hover:border-eco-primary text-gray-700`.

### C. Cards (Projects)
**Style**: Soft branding, "floating" on hover.

*   **Container**: `bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-float transition-all duration-300 border border-gray-100`.
*   **Images**: `object-cover group-hover:scale-105 transition-transform duration-500`.
*   **Content Padding**: `p-6`.

### D. Badges & status
**Style**: Pill, small, uppercase, bold.

*   **Classes**: `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm`.
*   **Colors**:
    *   **Open** (Main): `bg-green-600 text-white` (Standard Green).
    *   **Completed / Full**: `bg-gray-500 text-white`.
    *   **Construction (Type)**: `bg-white/90 text-eco-primary`.
    *   **Workshop (Type)**: `bg-white/90 text-eco-terracotta`.

## 4. UI Patterns

### Navigation (Page Scroll)
*   **Scroll Reset**: All pages must use `<ScrollToTop />` to ensure view starts at (0,0).

### Animations
*   **Hover**: Use `hover:-translate-y-0.5` or `hover:scale-105` for interactive cards/buttons.
*   **Transitions**: `transition-all duration-300`.

---
*Reference this document for all future UI implementations.*
