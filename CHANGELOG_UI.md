# UI Change Log

## STEP 5: Convert Courses & Projects to List Style
**Status:** COMPLETED
### BEFORE:
- Courses and projects use a 3-column grid that makes reading descriptions difficult.
- Visual hierarchy is cluttered when many items are present.
- Mobile layout stacks items, but on desktop, they take up significant vertical space per row of information.

### FIX APPLIED:
1.  Replaced `.items-grid` CSS Grid layout with a Flexbox column layout for list-style rendering.
2.  Modified `.item-card` to a horizontal layout (`flex-direction: row`) for desktop.
3.  Assigned a fixed width (320px) to media elements (images/videos) within the list for consistent alignment.
4.  Enhanced `.item-card .content` with better spacing and vertical centering.
5.  Added responsive media queries to revert cards to a vertical stack on mobile devices (< 768px).

### AFTER:
- [x] Courses and projects are displayed in a clean, readable list format.
- [x] Desktop layout maximizes space for title, description, and metadata.
- [x] Responsive stacking ensures no layout break on smaller screens.
- [x] Card actions are aligned consistently within the horizontal list format.

## STEP 4: Fix Gallery UI Layout and Responsiveness
**Status:** COMPLETED
### BEFORE:
- Gallery grid breaks on tablet portrait screens (items become too narrow or overlap).
- Fixed heights (260px) on media items cause inconsistent cropping and look dated.
- Overlay gradient is harsh and covers video controls.
- Transitions are set to 0.3s but lack modern easing.

### FIX APPLIED:
1.  Switched from `repeat(auto-fit, minmax(220px, 1fr))` to `repeat(auto-fill, minmax(300px, 1fr))` for a more stable and professional grid.
2.  Implemented `aspect-ratio: 16 / 9` for all gallery items to ensure uniform layout regardless of content type.
3.  Updated `.gallery-overlay` with `pointer-events: none` to ensure it doesn't interfere with video controls.
4.  Refined hover effects with `cubic-bezier` easing and subtle scaling for a premium feel.
5.  Improved responsive padding and gaps for mobile devices.

### AFTER:
- [x] Gallery layout is fully responsive and stable on all screen sizes.
- [x] Consistent 16:9 aspect ratio across all media items.
- [x] Smooth, non-intrusive overlays with high readability.
- [x] Glassmorphism borders and shadows applied to all gallery cards.

## STEP 3: Improve Profile Page Layout
**Status:** COMPLETED
### BEFORE:
- Profile grid alignment feels unbalanced on larger screens.
- Profile info rows lack visual separation or hover states.
- List items (Courses/Projects) use inconsistent inline styling and have cramped buttons.
- Sidebar and panels have inconsistent gap spacing.

### FIX APPLIED:
1.  Optimized `.profile-grid` columns for a more balanced 400px/1fr ratio.
2.  Replaced inline styles in `profile.js` with structured `.profile-list-item` and `.item-content` CSS classes.
3.  Added hover transitions to `.profile-info-row` for better interactive feedback.
4.  Enhanced `.profile-avatar` with a more defined border and shadow to separate it from the background.
5.  Standardized button alignment and spacing within list items.

### AFTER:
- [x] Profile layout is balanced and visually appealing across all screen sizes (Verified).
- [x] Interactive feedback on all profile data rows (Verified).
- [x] Clean, consistent cards for courses and projects without inline styling (Verified).
- [x] Responsive behavior is preserved and improved (Verified).

## STEP 2: Fix Modal System
**Status:** COMPLETED
### BEFORE:
- First-visit modal appears without locking body scroll, allowing users to scroll the landing page behind it.
- Modals lack a consistent animation (some pop in, some slide).
- Backdrop blur is inconsistent across different pages.
- Transition timing varies between 0ms and 400ms.

### FIX APPLIED:
1.  Standardized CSS modal classes for uniform glassmorphism and animations.
2.  Updated `main.js`, `login.js`, and `profile.js` to manage the `no-scroll` class on the body element.
3.  Refined modal close logic to handle backdrop clicks and escape key consistently.
4.  Unified transition speeds to 300ms for a modern, snappy feel.

### AFTER:
- [x] Body scroll locks correctly when any modal is open (Verified).
- [x] Modals animate smoothly (fade + subtle scale) (Verified).
- [x] Consistent backdrop blur (8px) and background opacity (Verified).
- [x] Close button and backdrop clicks work across all modals (Verified).
- [x] No layout shifting when scrollbar is hidden (Verified).

## STEP 1: Burger Menu Responsiveness
**Status:** COMPLETED
### BEFORE:
- Burger menu icon appears but clicking does not trigger the navigation drawer on mobile.
- Transition is abrupt (0ms), causing a jarring user experience.
- On iPhone SE screens, the menu overlaps the brand logo.
- Navigation links remain visible in a broken state if the screen is resized from mobile to desktop.

### FIX APPLIED:
1.  Implemented CSS `transition: transform 0.3s ease-in-out` for the navigation drawer.
2.  Updated media queries to ensure the brand logo and burger icon have sufficient spacing (`justify-content: space-between`).
3.  Added a "click-outside" listener in Vanilla JS to close the menu automatically.
4.  Used `pointer-events` to prevent accidental clicks during transitions.

### AFTER:
- [x] Burger menu toggles smoothly (300ms transition).
- [x] Navigation drawer is fully responsive from 320px to 1024px.
- [x] Clicking outside the menu or on a link closes the drawer.
- [x] No layout overlapping with the logo.
- [x] Console is clear of event listener errors.