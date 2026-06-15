# Sekkei v1.1 QA Checklist

## Elementor Editor

- [ ] Open Elementor editor.
- [ ] Sekkei toggle appears.
- [ ] Panel opens and loads version 1.1.0.
- [ ] Icons render correctly after first open.
- [ ] Existing Elementor containers sync into Section Planner.
- [ ] Export tab shows data health and Restore Backup.

## Standalone Admin Tool

- [ ] Open Sekkei from WordPress admin menu.
- [ ] First-run onboarding appears on empty project.
- [ ] Empty states appear for planner, palette, fonts, notes, audit, export, and snippets.
- [ ] Notes starter templates insert text.

## Backup and Import

- [ ] Save project once and confirm recovery backup status appears.
- [ ] Restore Backup works when backup exists.
- [ ] Valid JSON import shows schema/version/count summary.
- [ ] Invalid JSON is rejected without changing current project.
- [ ] Large JSON over limit is rejected.

## Performance

- [ ] No Sekkei assets load on the public frontend.
- [ ] Panel warm open feels instant after first load.
- [ ] Browser console has no Sekkei errors.
