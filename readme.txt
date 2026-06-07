=== PageCraft — Workflow Toolkit & Section Planner for Elementor ===
Contributors: thereadscope
Tags: elementor, page builder, elementor addons, workflow, css generator
Requires at least: 5.8
Tested up to: 7
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Elementor workflow toolkit — plan sections, run a design checklist, save color palettes & font pairs, and generate CSS, right beside your canvas.

== Description ==

**PageCraft** is the all-in-one workflow tool designed specifically for Elementor page builders. It integrates directly into the Elementor editor as a sliding side panel, or works as a standalone tool from your WordPress dashboard.

Stop switching between apps and browser tabs — plan, design, and organize everything in one place, right next to your Elementor canvas.

= 🎯 Key Features =

**Section Planner** — Plan your page structure before building. Add sections with names, types (hero/nav/content/CTA/footer/custom), CSS classes, and notes. Drag-and-drop to reorder. Quick template to scaffold common pages.

**Design Checklist** — Never miss a step. 30+ checklist items across 5 categories: Before Design, Structure, Design, Mobile, and Handover. Add custom items and groups. Track progress with a live progress bar.

**Color Palette** — Save and organize your brand colors. Group colors by palette (Brand, Dark Mode, etc.). Click any swatch to copy the hex code. Assign roles like Primary, Accent, Background.

**Font Pairing** — 10 curated font pairings (including Bengali fonts). Filter by style: editorial, modern, minimal, bold. Copy CSS and Google Fonts links. Save custom pairings.

**CSS Generator** — Generate Elementor-ready custom CSS snippets. 6 presets (Section, Container, Typography, Button, Card, Responsive). Auto-fill from your Section Planner. Save and reuse snippets.

**Project Notes** — Client feedback, revision history, TODOs — all in one place. Quick insert tags for common patterns. Date stamps and structured formatting.

**Export** — Export your entire project as formatted text or JSON. Download .txt for client handover. JSON backup/import for portability.

**Multiple Projects** — Manage separate projects with independent data. Switch between projects instantly.

= 🔧 How It Works =

1. **In Elementor Editor**: A floating "⚡ PageCraft" button appears. Click it to open the tool as a sliding side panel. Use keyboard shortcut `Ctrl+Shift+P` for quick access.

2. **In WordPress Admin**: Navigate to PageCraft → Open Tool for a full-screen experience.

3. **Data Storage**: All data is saved in your browser's localStorage — no server requests, no database load, instant performance.

= 🚀 100% Free & Unlocked =

Unlike other tools, PageCraft is 100% free and open-source. All premium features are fully unlocked with no paywalls, subscriptions, or license keys:

* **Section Planner**: Add unlimited sections and use all pre-made workflow templates.
* **Design Checklist**: Add unlimited custom checklist items and custom item groups.
* **Color Palette**: Build and save multiple custom color palettes with roles.
* **Font Pairing**: Access all 10 curated pairs (including Bengali fonts) and customize pairings.
* **CSS Generator**: Generate, edit, and save Elementor-ready custom CSS snippets from all 6 presets.
* **Multiple Projects**: Create, name, and switch between separate design projects.
* **JSON Export**: Export and import your full workflow data in JSON format for backup or migration.

== Installation ==

1. Upload the `pagecraft` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Open any page with Elementor editor — look for the "⚡ PageCraft" button
4. Or navigate to PageCraft → Open Tool in the WordPress admin menu

== Frequently Asked Questions ==

= Does this require Elementor Pro? =

No! PageCraft works with the free version of Elementor. No Pro API is used.

= Where is my data saved? =

All data is saved in your browser's localStorage. This means it persists across sessions but is specific to the browser you're using.

= Can I export my data? =

Yes! Use the Export tab to download your project as a .txt file for client handover or as JSON for backup/import.

= Will this slow down my site? =

No. PageCraft only loads in the Elementor editor and WordPress admin — never on the frontend. Zero impact on site performance.

= Does it work with other page builders? =

PageCraft is designed for Elementor workflows, but the standalone tool (Admin → Open Tool) can be used for planning any website project.

== Screenshots ==

1. Section Planner — Plan and organize your page sections with drag-and-drop
2. Design Checklist — Track your progress with categorized checkpoints
3. Color Palette — Save and organize brand colors with groups and roles
4. Font Pairing — Curated font combinations with live preview
5. CSS Generator — Generate Elementor-ready CSS snippets with presets
6. Elementor Integration — Floating button and sliding panel in the editor
7. Settings Page — Configure panel position, width, and behavior

== Changelog ==

= 1.0.1 =
* Security: Added origin validation to postMessage event listener in Elementor editor integration
* Security: Replaced wildcard '*' postMessage target-origin with explicit window.location.origin
* Code: Removed redundant Settings API registration (dual form-processing conflict)
* Code: Moved inline admin JavaScript to external file (itspc-admin.js) via wp_enqueue_script
* Code: Moved all inline CSS blocks to external stylesheets via wp_enqueue_style
* Code: Refactored settings POST handler to use sanitize_settings() — eliminates duplicated sanitization logic
* Fix: Email field now uses sanitize_email() instead of sanitize_text_field()
* Fix: wp_get_theme() result cached to avoid duplicate calls
* Improvement: Dashboard widget CSS conditionally loaded only when widget is active

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

= 1.0.1 =
Security and code quality improvements. Recommended update for all users.

= 1.0.0 =
Initial release of PageCraft — the Elementor Workflow Companion.

== Third-Party Libraries ==

PageCraft uses the following third-party libraries, included in the plugin package:

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
* Location: assets/vendor/fonts/syne-700.woff2, syne-800.woff2
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

