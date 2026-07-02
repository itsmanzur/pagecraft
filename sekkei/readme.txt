=== Sekkei - Section Planner & Workflow Toolkit for Elementor ===
Contributors: itsmanzur
Tags: elementor, page builder, elementor addons, workflow, css generator
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.6.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Elementor workflow toolkit - plan sections, run a design checklist, save color palettes & font pairs, and generate CSS, right beside your canvas.

== Description ==

**Sekkei** is the all-in-one workflow tool designed specifically for Elementor page builders. It integrates directly into the Elementor editor as a sliding side panel, or works as a standalone tool from your WordPress dashboard.

Stop switching between apps and browser tabs - plan, design, and organize everything in one place, right next to your Elementor canvas.

=  Key Features =

**Section Planner** - Plan your page structure before building. Add sections with names, types, CSS classes, notes, dependencies, and health warnings. Sync Elementor containers into the planner, rename linked sections safely, and export a clean page outline for client approval.

**Design Checklist** - Never miss a step. 30+ checklist items across 5 categories: Before Design, Structure, Design, Mobile, and Handover. Add custom items and groups. Track progress with a live progress bar.

**Color Palette** - Save and organize your brand colors. Group colors by palette (Brand, Dark Mode, etc.). Click any swatch to copy the hex code. Assign roles like Primary, Accent, Background.

**Font Pairing** - 10 curated font pairings (including Bengali fonts). Filter by style: editorial, modern, minimal, bold. Copy CSS and Google Fonts links. Save custom pairings.

**CSS Generator** - Generate Elementor-ready custom CSS snippets. 6 presets (Section, Container, Typography, Button, Card, Responsive). Auto-fill from your Section Planner. Save and reuse snippets.

**Project Notes** - Client feedback, revision history, TODOs  all in one place. Quick insert tags for common patterns. Date stamps and structured formatting.

**Pre-Publish Audit** - Scan your Elementor page for common issues before publishing. Detect placeholder text, broken links, missing image alt tags, and layout hierarchy issues. Locate elements with a single click.

**Export** - Export your entire project as formatted text or JSON. Download .txt for client handover. JSON backup/import for portability.

**Multiple Projects** - Manage separate projects with independent data. Switch between projects instantly.

=  How It Works =

1. **In Elementor Editor**: A floating "Sekkei" button appears. Click it to open the tool as a sliding side panel. Use keyboard shortcut `Ctrl+Shift+P` for quick access.

2. **In WordPress Admin**: Navigate to Sekkei  Open Tool for a full-screen experience.

3. **Data Storage**: All data is saved in your browser's localStorage  no server requests, no database load, instant performance.

=  100% Free & Unlocked =

Sekkei is 100% free and open-source. Every feature is included with no paywalls, subscriptions, or license keys:

* **Section Planner**: Add unlimited sections and use all pre-made workflow templates.
* **Design Checklist**: Add unlimited custom checklist items and custom item groups.
* **Color Palette**: Build and save multiple custom color palettes with roles.
* **Font Pairing**: Access all 10 curated pairs (including Bengali fonts) and customize pairings.
* **CSS Generator**: Generate, edit, and save Elementor-ready custom CSS snippets from all 6 presets.
* **Multiple Projects**: Create, name, and switch between separate design projects.
* **JSON Export**: Export and import your full workflow data in JSON format for backup or migration.

== Installation ==

1. Upload the `sekkei` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Open any page with Elementor editor - look for the "Sekkei" button
4. Or navigate to Sekkei  Open Tool in the WordPress admin menu

== Frequently Asked Questions ==

= Does this require Elementor Pro? =

No! Sekkei works with the free version of Elementor. No Pro API is used.

= Where is my data saved? =

All data is saved in your browser's localStorage. This means it persists across sessions but is specific to the browser you're using.

= Can I export my data? =

Yes! Use the Export tab to download your project as a .txt file for client handover or as JSON for backup/import.

= Will this slow down my site? =

No. Sekkei only loads in the Elementor editor and WordPress admin - never on the frontend. Zero impact on site performance.


= Does Sekkei load anything on my live frontend? =

No. Sekkei is designed for the WordPress admin and Elementor editor only. It does not add frontend widgets, frontend scripts, or frontend styles to visitor-facing pages.

= What happens if my browser storage gets corrupted? =

Sekkei keeps a local recovery backup before saves. If the main local data cannot be loaded, Sekkei attempts to recover from the backup. You can also use Export -> Restore Backup inside the tool.

= Is JSON import safe? =

Sekkei validates imported JSON, normalizes project data, limits large imports, and shows an import summary before adding the project.

= What should I do before publishing an Elementor page? =

Open Sekkei, review the Section Planner, complete the Design Checklist, run the Pre-Publish Audit, then export your notes or JSON backup for handoff.

= Does it work with other page builders? =

Sekkei is designed for Elementor workflows, but the standalone tool (Admin - Open Tool) can be used for planning any website project.

== Screenshots ==

1. Section Planner  Plan and organize your page sections with drag-and-drop
2. Design Checklist  Track your progress with categorized checkpoints
3. Color Palette  Save and organize brand colors with groups and roles
4. Font Pairing  Curated font combinations with live preview
5. CSS Generator  Generate Elementor-ready CSS snippets with presets
6. Elementor Integration  Floating button and sliding panel in the editor
7. Settings Page  Configure panel position, width, and behavior

== Changelog ==
 
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


