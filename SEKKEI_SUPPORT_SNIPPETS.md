# Sekkei Support Snippets

Use these for fast WordPress.org support replies.

## Data Storage

Sekkei stores project data in your browser localStorage. This keeps the plugin fast and avoids database load. For backup or moving to another browser, open Sekkei -> Export -> Download JSON.

## Restore Backup

Sekkei keeps one local recovery backup before saves. Open Sekkei -> Export -> Restore Backup. If the backup is available, the project data will be restored locally.

## Elementor Pro Requirement

Sekkei does not require Elementor Pro. It uses free Elementor editor hooks and works with the free Elementor plugin.

## Frontend Performance

Sekkei is admin/editor-only. It does not load widgets, scripts, or styles on visitor-facing pages.

## Import JSON

Use Sekkei -> Export -> Import JSON. Sekkei validates the file, shows a summary, and imports it as a separate project.

## Icons Loading Slowly

Ask the user to hard refresh the Elementor editor once. Sekkei preloads its local icon and font assets, and warm loads should be faster after the first open.
