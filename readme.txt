=== Sekkei - Section Planner & Workflow Toolkit for Elementor ===
Contributors: itsmanzur
Tags: elementor, page builder, elementor addons, workflow, css generator
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.7.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Elementor workflow toolkit - plan sections, run audits, manage client feedback, sync design tokens, and hand off projects — right beside your canvas.

== Description ==

**Sekkei** (設計, Japanese for "design/planning") is the all-in-one workflow companion built specifically for Elementor developers and agencies. It integrates directly into the Elementor editor as a draggable floating panel, or works as a standalone tool from your WordPress dashboard.

Stop switching between apps and browser tabs — plan, audit, collaborate, and hand off everything in one place, right next to your Elementor canvas.

= Key Features =

**Section Planner** — Plan your page structure before building. Add sections with names, types, CSS classes, notes, dependencies, and health warnings. Sync Elementor containers, export a clean page outline for client approval, and track responsive QA status (desktop/tablet/mobile) per section.

**Design Checklist** — Never miss a step. 30+ checklist items across 5 categories with accordion collapse. Load SOP templates for Landing Pages, WooCommerce, or Blog layouts. Add custom items and groups. Track progress with a live progress bar.

**Color Palette** — Save and organize brand colors. Group colors by palette (Brand, Dark Mode, etc.). Assign roles like Primary, Accent, Background. Copy hex codes, CSS variables, or push colors directly to Elementor Global Colors.

**Font Pairing** — Curated font pairings including Bengali and Arabic presets. Filter by style: editorial, modern, minimal, bold. Copy CSS, Google Fonts links, or CSS Custom Properties. Save custom pairings with weight/line-height recommendations.

**Design Tokens** — Generate CSS custom property tokens for typography scale, spacing, border radius, and box shadows. Copy as a `:root {}` block into your stylesheet. Sync tokens directly to Elementor Global Styles (writes to Elementor Kit).

**CSS Generator** — Generate Elementor-ready CSS snippets from 6 presets. Categorize by device target and risk level. Auto-fill from your Section Planner. Save and reuse snippets. Elementor selector helper for quick CSS targeting.

**Pre-Publish Audit** — Scan your Elementor page before publishing. Detect placeholder text, broken links, missing or weak image alt tags, heading sequence issues, oversized images, SEO title/meta length, and accessibility gaps. View audit history (last 5 scans). Export a full audit report as .txt.

**Agency Cockpit** — Kanban-style project pipeline board (Draft → Design → Review → Revision → Approved → Published). Track blockers, project metadata, and last updated dates.

**Client Feedback** — Collect section-level client comments. Export a shareable HTML feedback page for clients (no WordPress access needed). Import feedback JSON back to sync client comments.

**Revision Log** — Track every change and client request with a dated revision log. Full audit trail for billing and scope management.

**White-Label Handoff Reports** — Generate a branded, printable HTML client handoff report with your agency logo, custom title, accent color, project details, planner structure, checklists, and audit summary.

**Project Notes** — Client feedback, revision history, TODOs — all in one place. Quick insert tags and date stamps.

**Export & Backup** — Export your project as formatted text or JSON. Sync to WordPress database (stored in user metadata, max 3MB). Restore from database backup. Auto-backup reminder every 15 saves or 7 days.

= How It Works =

1. **In Elementor Editor**: A floating "Sekkei" button appears. Click or drag it anywhere on screen. Use `Ctrl+Shift+P` to toggle. Drag the panel header to undock it as a floating window — just like Divi or Elementor Navigator. Double-click the header to redock.

2. **In WordPress Admin**: Navigate to Sekkei → Open Tool for a full-screen experience.

3. **Keyboard Shortcuts**: `Ctrl+Shift+P` to toggle panel. `Escape` to close. `Alt+1` to `Alt+9` and `Alt+0` for instant tab switching.

4. **Data Storage**: All data is saved in your browser's localStorage — no server requests, no database load, instant performance. Optional database sync available in Export panel.

= 100% Free & Unlocked =

Sekkei is 100% free and open-source under GPL-2.0+. Every feature is included with no paywalls, subscriptions, or license keys.

== Installation ==

1. Upload the `sekkei` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Open any page with Elementor editor — look for the floating "Sekkei" button
4. Or navigate to Sekkei → Open Tool in the WordPress admin menu

== Frequently Asked Questions ==

= Does this require Elementor Pro? =

No! Sekkei works with the free version of Elementor. No Pro API is used.

= Where is my data saved? =

All data is saved in your browser's localStorage by default — no server requests, instant performance. You can optionally sync to the WordPress database from the Export panel (stored securely in user metadata).

= Can I export my data? =

Yes! Use the Export panel to download your project as a .txt file for client handover, as JSON for backup/import, or generate a white-label HTML handoff report for clients.

= Will this slow down my site? =

No. Sekkei only loads in the Elementor editor and WordPress admin — never on the frontend. Zero impact on site performance or page speed.

= Does Sekkei load anything on my live frontend? =

No. Sekkei is designed for the WordPress admin and Elementor editor only. It does not add frontend widgets, frontend scripts, or frontend styles to visitor-facing pages.

= What happens if my browser storage gets corrupted? =

Sekkei keeps a local recovery backup before every save. If the main data cannot be loaded, Sekkei attempts to recover from the backup. You can also restore from a database backup or imported JSON via the Export panel.

= Is JSON import safe? =

Sekkei validates imported JSON, normalizes project data, limits large imports, and shows an import summary before adding the project. Prototype pollution is guarded against during parsing.

= What should I do before publishing an Elementor page? =

Open Sekkei, review the Section Planner, complete the Design Checklist, run the Pre-Publish Audit, then export your notes or generate a white-label handoff report for your client.

= Does it work with other page builders? =

Sekkei is designed for Elementor workflows, but the standalone tool (Admin → Open Tool) can be used for planning any website project.

= Can I drag the floating button and panel? =

Yes! Both the floating trigger button and the panel itself are draggable. Drag the panel header to undock it as a floating window anywhere on screen. Double-click to reset to default position. Positions are saved in localStorage.

= What is the Elementor Global Styles sync? =

From the Design Tokens panel, you can sync your design tokens and color palette directly to Elementor's active Kit — writing CSS custom properties to Elementor's global settings and flushing the CSS cache automatically.

== Screenshots ==

1. Section Planner — Plan and organize your page sections with drag-and-drop, health warnings, and responsive QA status
2. Design Checklist — Track your progress with categorized checkpoints and SOP templates
3. Color Palette — Save and organize brand colors with groups, roles, and CSS variable export
4. Font Pairing — Curated font combinations including Bengali and Arabic with live preview
5. CSS Generator — Generate Elementor-ready CSS snippets with device and risk categorization
6. Pre-Publish Audit — Scan for accessibility, SEO, and layout issues before going live
7. Agency Cockpit — Kanban pipeline board for project management and client collaboration
8. Export & Handoff — White-label client reports, database backup, and JSON export

== Changelog ==

= 1.7.0 =
* UI polish: color-coded section type borders, Kanban status color accents, SaaS card elevation and hover effects
* Fixed WCAG contrast checker badges unreadable in light mode
* Fixed 999-day backup reminder showing for new users with no prior backup
* Enhanced audit engine: inherited background contrast scanner, noopener security check, social media placeholder link detection
* Reduced Tabler Icons font from 832KB to 10KB with expanded 55-icon subset
* Added Elementor Global Styles database sync (writes design tokens directly to Elementor Kit via AJAX)
* Added White-label Client Handoff HTML report with agency logo, custom title, and accent color
* Enhanced pre-publish audit with generic/weak alt text detection
* Added Cloud Workspace panel (coming soon — API keys not yet active)

= 1.6.1 =
* Added draggable floating trigger button (FAB) with position memory and double-click reset
* Added draggable floating panel window (Divi-style undocking) with position memory and double-click redock
* Added Alt+1 to Alt+9 and Alt+0 keyboard shortcuts for instant panel navigation
* Fixed iframe focus trap — Ctrl+Shift+P and Escape now bubble correctly from panel to editor
* Added CSS Variables export button in Font Pairing panel

= 1.6.0 =
* Added Global Error Boundary for JS catch resilience and emergency auto-save
* Added auto-retry save logic with exponential backoff on localStorage quota/issues
* Added auto-backup local download reminder (every 15 saves or 7 days)
* Added Cross-Tab localStorage Synchronization to prevent stale states
* Added secure WP Database Backup/Restore (Sync to DB / Restore from DB) stored in user metadata
* Added CSS Custom Variables export button in Color Palette cockpit
* Added accordion expand/collapse logic to Design Checklist groups with completion progress indicators
* Added Layout Scan Audit History card tracking the latest 5 scan scores
* Introduced Terser and CSSnano minification build pipeline reducing editor load size by ~40%
* Fixed legacy Elementor version compatibility check (requires 3.0.0+)
* Fixed a syntax error in client feedback interactive HTML sheet export
* Generated WordPress POT translation templates inside the /languages directory

= 1.5.0 =
* Added Agency Cockpit with Kanban project pipeline board
* Added Client Feedback panel with shareable HTML export and JSON import
* Added Revision Log for tracking changes and client requests
* Added SOP templates for landing page, WooCommerce, and blog workflows
* Added custom SOP save and append support

= 1.4.0 =
* Added deep page audit: heading sequence, oversized images, SEO title/meta length, accessibility checks
* Added Responsive QA status tracking per section (desktop/tablet/mobile pass/fail)
* Added SEO & Handoff checklist category
* Added audit report export (.txt)

= 1.3.0 =
* Added Design Tokens panel for typography scale, spacing, radius, and shadow CSS variables
* Added WCAG contrast checker for saved brand colors
* Added Arabic font pairing presets with weight/line-height recommendations
* Added CSS snippet library with device target and risk level filtering
* Added Elementor selector helper for quick CSS targeting

= 1.2.0 =
* Added smarter Section Planner health warnings for titles, duplicate CSS classes, empty linked containers, dependencies, and CTA coverage
* Added reusable section presets for landing, service, WooCommerce, and blog page planning
* Added client-ready page outline copy export
* Improved Elementor structure sync with safer linking and nested container rename support

= 1.1.1 =
* Fixed onboarding welcome card not appearing on first install
* Removed redundant font preload tags causing browser console warnings

= 1.1.0 =
* Added first-run onboarding with guided setup actions
* Improved empty states across planner, palette, fonts, notes, audit, export, and CSS snippets
* Added local recovery backup, Restore Backup, and a safer JSON import validation summary
* Preloaded editor panel fonts and icon assets for faster first open
* Added data health and performance status in the Export panel

= 1.0.0 =
* Initial release
* Section Planner with drag-and-drop and quick templates
* Design Checklist with 5 categories and 30+ items
* Color Palette with groups and roles
* Font Pairing with 10 curated pairs including Bengali
* CSS Generator with 6 presets
* Project Notes with quick insert tags
* Export to text and JSON
* Multiple project support
* Elementor editor integration (floating button + sliding panel)
* WordPress admin full-screen tool page
* Settings page for panel configuration

== Upgrade Notice ==

= 1.7.0 =
* UI polish: color-coded section type borders, Kanban status color accents, SaaS card elevation and hover effects
* Fixed WCAG contrast checker badges unreadable in light mode
* Fixed 999-day backup reminder showing for new users with no prior backup
* Enhanced audit engine: inherited background contrast scanner, noopener security check, social media placeholder link detection
* Reduced Tabler Icons font from 832KB to 10KB with expanded 55-icon subset
Adds Elementor Global Styles sync, white-label client handoff reports, enhanced alt text audit, and Cloud Workspace panel.

= 1.6.1 =
Adds draggable FAB and panel (Divi-style), Alt+1–9 keyboard shortcuts, iframe focus fix, and font CSS variable export.

= 1.6.0 =
Adds error boundary, cross-tab sync, database backup, minification pipeline, checklist accordion, audit history, and i18n support.

= 1.5.0 =
Adds Agency Cockpit (Kanban board), Client Feedback panel (with shareable HTML and JSON sync), Revision Log tracker, and templateable/custom SOP checklists.

= 1.4.0 =
Adds deep page audit checks, responsive section QA status indicators, SEO/handoff checklists, and audit text report exports.

= 1.3.0 =
Adds Design Tokens panel, WCAG contrast checker, Arabic font pairs, CSS snippet library filtering, and Elementor selector helper.

= 1.2.0 =
Adds smarter Section Planner health, dependencies, reusable presets, page outline export, and safer Elementor sync.

= 1.1.0 =
Improves the first-run workflow, local data recovery, JSON import safety, and editor panel asset loading.

= 1.0.0 =
Initial release of Sekkei - the Elementor Workflow Companion.

== Third-Party Libraries ==

Sekkei uses the following third-party libraries, included in the plugin package:

= Tabler Icons =
* Version: Latest stable
* License: MIT License
* License URI: https://opensource.org/licenses/MIT
* Source: https://tabler.io/icons
* Location: assets/vendor/tabler-icons/
* Purpose: Icon set used inside the standalone tool interface (assets/tool/index.html)

= Syne (Font) =
* Version: Latest stable
* License: SIL Open Font License 1.1
* License URI: https://scripts.sil.org/OFL
* Source: https://fonts.google.com/specimen/Syne
* Location: assets/vendor/fonts/syne-700.woff2
* Purpose: Display/heading font in the standalone tool interface

= DM Sans (Font) =
* Version: Latest stable
* License: SIL Open Font License 1.1
* License URI: https://scripts.sil.org/OFL
* Source: https://fonts.google.com/specimen/DM+Sans
* Location: assets/vendor/fonts/dm-sans-400.woff2, dm-sans-500.woff2
* Purpose: UI body font in the standalone tool interface

= DM Mono (Font) =
* Version: Latest stable
* License: SIL Open Font License 1.1
* License URI: https://scripts.sil.org/OFL
* Source: https://fonts.google.com/specimen/DM+Mono
* Location: assets/vendor/fonts/dm-mono-400.woff2
* Purpose: Monospace font for CSS code output in the standalone tool interface