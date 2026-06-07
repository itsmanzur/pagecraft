# PageCraft — Elementor Workflow Companion

PageCraft is the ultimate workflow companion utility for Elementor. It integrates directly into the Elementor editor canvas as a sliding panel (or works as a standalone tool in the WordPress admin panel) to group layout planning, checklists, typography, color palettes, custom CSS, and designer notes in one central dashboard.

## 🎯 Key Features

- **Section Planner**: Plan your page structure. Add sections with names, types, CSS classes, and notes. Drag-and-drop to reorder, use quick templates, and sync names in real-time with Elementor sections.
- **Design Checklist**: 30+ default best-practice design and developer checks. Add custom items and track progress with a visual progress bar.
- **Color Palette**: Organize and store your brand palettes. Group colors by roles (Primary, Accent, BG) and push them to Elementor's Global Kit with a single click.
- **Font Pairing**: Curated typography pairs (including Bengali fonts). Copy CSS import statements and Google Fonts links, or push them directly to Elementor Kit.
- **CSS Generator**: Generate clean layout and utility snippets from presets. Save snippets into a custom library.
- **Project Notes**: Manage feedback, logs, and client specs. Insert time-stamps and tag labels instantly.
- **Pre-Publish Auditor**: Scans the active Elementor canvas preview DOM to find empty links, missing image alt text, placeholder text, and empty containers. Instantly highlights and scrolls to any flagged issue.
- **Client Handover Widget**: Configure a white-labeled support portal widget directly inside the WordPress dashboard home.

## 🛠️ Installation & Setup

1. Download or clone this repository to your WordPress plugins directory: `wp-content/plugins/pagecraft`
2. Activate the plugin from the WordPress Plugins dashboard.
3. Access **PageCraft** under the top-level admin menu or open any page in Elementor editor to launch the panel (keyboard shortcut: `Ctrl+Shift+P`).

## ⚡ Tech Stack & Architecture

- **Backend**: Clean WordPress PHP APIs, using transient/option caches, strict data sanitization, and WPCS-compliant secure hooks.
- **Frontend Panel**: Structured in HTML5 and CSS, styled with a high-end dark design matching Elementor's editor aesthetics.
- **Vanilla JavaScript**: 100% jQuery-free lightweight JS implementation utilizing standard postMessage window communication to establish safe, two-way element sync and highlight locator events.
- **Self-Hosted Assets**: Self-hosts Tabler Icons to eliminate external CDN latency and network requests.

## 📄 License

This project is licensed under the GPL-2.0+ License.
