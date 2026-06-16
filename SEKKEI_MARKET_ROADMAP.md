# Sekkei Market Leadership Roadmap 2026

Updated: 15 June 2026  
Status: Live on WordPress.org  
Positioning: Workflow OS for Elementor  
Version path: v1.1 stability -> v2.0 pro-ready ecosystem

## Overall Progress

- [ ] Phase 1: Trust, polish, and retention (v1.1)
- [x] Phase 2: Smarter section planner (v1.2)
- [ ] Phase 3: Design system cockpit (v1.3)
- [ ] Phase 4: Audit and pre-publish QA (v1.4)
- [ ] Phase 5: Agency collaboration (v1.5)
- [ ] Phase 6: Ecosystem and monetization-ready (v2.0)

Progress: 0/6 phases complete.

## Core Thesis

Sekkei should not become another Elementor widget pack. Essential Addons, ElementsKit, Royal Addons, Happy Addons, Premium Addons, and similar plugins compete on widgets, templates, theme builders, WooCommerce builders, and visual effects.

Sekkei should own a different category:

> A lightweight production workflow cockpit for Elementor freelancers and agencies.

Sekkei wins by helping users plan, QA, document, export, and hand off Elementor projects. The crowded market is widgets. The open market is workflow memory.

## Sekkei's 3 Winning Angles

### 1. No Frontend Bloat

Sekkei should remain editor/admin-only. No frontend widgets, no frontend CSS injection, no visitor-side scripts. This is a major advantage against large addon packs.

Promise:

> Install Sekkei without slowing the live site.

### 2. Pre-Publish Audit

This is the easiest sales sentence:

> Before publishing an Elementor page, run Sekkei.

The audit feature is easy to explain, easy to demo, and solves a real freelancer pain: finding placeholder text, empty links, missing image alt, empty containers, heading problems, and handoff issues before the client sees them.

### 3. Agency Workflow Memory

Section planner, checklist, notes, CSS snippets, export, and revision history together become project memory. This is where agencies will eventually pay: SOP templates, client reports, approvals, and handoff.

## Competitor Landscape

| Competitor | Scale / strength | What they do well | Gap Sekkei should own |
|---|---|---|---|
| Essential Addons | 110+ elements, 2M+ installs | Widgets, WooCommerce, template cloud, element control | They build elements; Sekkei plans, audits, and hands off the whole build |
| ElementsKit | 110+ elements, 1M+ installs | Header/footer, mega menu, custom widget builder, cross-domain copy | They are broad and heavy; Sekkei stays fast and workflow-specific |
| Happy Addons | 143+ widgets/features, 500+ blocks | Theme builder, templates, display conditions | Own production process: checklist, notes, section planner, export, sign-off |
| Royal Addons | 100+ addons, 600k+ installs | Builder ecosystem, WooCommerce coverage, kits | Avoid builder bloat; become the companion workflow layer |
| Premium Addons | 700k+ installs | Strong widget collection, template ecosystem, multilingual reach | Differentiate with agency QA, scope tracking, reusable project systems |
| YellowPencil / Visual CSS | Visual CSS editing | Frontend visual CSS customization | Safer Elementor-specific CSS snippets, selector hints, and audit workflow |
| Elementor Pro | Core builder, dominant ecosystem | Native editing, Theme Builder, WooCommerce, AI direction | Complement Elementor with planning, QA, handoff, and documentation |

## Phase 1: Trust, Polish & Retention (v1.1)

Goal: make first use feel polished, safe, and useful. Phase 1 must make users understand Sekkei in one session.

### Current Phase 1 Status

- [x] First-run onboarding: v1.1 includes a welcome/onboarding card and guided setup actions.
- [x] Empty states rewrite: planner, palette, fonts, notes, audit, export, and CSS snippets now have clearer next actions.
- [ ] Partial - Performance budget: editor asset preload, icon/font warmup, and data-health timing note are in place; formal timed benchmark still needs capture.
- [x] Crash-safe localStorage: local recovery backup, corrupt-load recovery, Restore Backup, and detailed JSON import validation summary are implemented.
- [ ] Partial - WP.org growth pack: FAQ polish, support snippets, demo video script, and QA checklist are done; screenshots/SVN assets still pending.
- [ ] Screenshot-8: Project Notes screenshot is still missing and needs WP.org/SVN update.

### Phase 1 Remaining Work

1. Finish remaining visual screenshot/SVN assets
   - Screenshot-8 is intentionally deferred
   - Re-capture other screenshots only if v1.1 UI changes need it

2. Measure and document performance budget
   - Panel warm open target: under 500ms after assets are cached
   - Confirm no frontend asset loading
   - Check editor console/network for avoidable warnings
   - Add a simple internal performance note to the release checklist

3. Import validation report
   - Done: schema version, unsupported fields, sanitized/dropped counts, project name, item counts
   - Remaining: test with malformed/oversized real files before release

4. WP.org growth pack
   - Done: FAQ around data storage, backup/restore, frontend performance, Elementor Pro requirement
   - Done: support reply snippets
   - Done: short demo video script: Plan -> Check -> Audit -> Export
   - Pending: screenshot/SVN asset updates

5. QA before closing v1.1
   - Test in Elementor editor desktop
   - Test standalone admin tool
   - Test mobile/narrow panel width
   - Test JSON export/import with valid and invalid files
   - Test backup restore after several saves
   - Confirm icons load quickly in panel and standalone tool

## Phase 2: Smarter Section Planner (v1.2)

- [ ] Two-way Elementor sync: rename/reorder in Sekkei should reflect in Elementor containers where technically safe.
- [ ] Section health badges: missing title, duplicate class, empty container, no CTA warning.
- [ ] Page outline export: client approval-friendly section outline.
- [ ] Reusable section presets: hero, feature, pricing, FAQ, testimonial, footer patterns.
- [ ] Section dependencies: waiting for copy, image, client approval, development.

## Phase 3: Design System Cockpit (v1.3)

- [ ] Global design tokens: color roles, typography scale, spacing, radius, shadow tokens.
- [ ] Contrast checker: WCAG-style foreground/background hints for saved palettes.
- [ ] Font pairing upgrade: Bengali/Arabic/Latin presets, line-height and weight recommendations.
- [ ] CSS snippet library: save by project, selector, device, and risk level.
- [ ] Elementor selector helper: safe class names from selected section/container.

## Phase 4: Audit & Pre-Publish QA (v1.4)

- [ ] Deep page audit: placeholder copy, empty links, missing alt, heading order, oversized images.
- [ ] Responsive QA checklist: desktop/tablet/mobile per-section pass/fail notes.
- [ ] Accessibility hints: button labels, link text, heading sequence, contrast warnings.
- [ ] SEO handoff checklist: title, meta, H1, image alt, internal links, schema notes.
- [ ] Audit report export: client-friendly HTML/TXT pass/fail summary report.

## Phase 5: Agency Collaboration (v1.5)

- [ ] Project status board: Draft -> Design -> Review -> Revision -> Approved -> Published.
- [ ] Client feedback mode: exportable comment list without exposing WordPress admin.
- [ ] Revision log: date, author, change summary, client request, final status.
- [ ] Templateable SOPs: reusable checklist templates for landing page, Woo page, blog template.
- [ ] Multi-project dashboard: progress, blockers, last updated, export/import.

## Phase 6: Ecosystem & Monetization Ready (v2.0)

- [ ] Optional cloud sync: keep free local mode; add opt-in account sync later.
- [ ] Team workspace: owner, designer, developer, client reviewer roles.
- [ ] Optional AI assistant: section plan, checklist, CSS starter, audit explanation.
- [ ] Workflow template marketplace: sell workflow templates, not design templates.
- [ ] Freemium boundary finalize: free core workflow; Pro team, cloud, white-label, advanced audits.

## Current Feature Upgrade Plan

| Current feature | Upgrade | Why it matters |
|---|---|---|
| Section Planner | Health badges, statuses, dependencies, selected Elementor mapping | This should become the flagship feature |
| Design Checklist | Checklist templates, pass/fail notes, reusable SOPs | Agencies need repeatable process |
| Color Palette | Contrast checks, color roles, CSS variable export | Turns palette into design-system value |
| Font Pairing | Multilingual presets, hierarchy preview, CSS variables | Strong niche for Bengali and agency use |
| CSS Generator | Selector helper, risk warning, responsive snippets | Safer custom CSS is a real painkiller |
| Project Notes | Starter templates, revision log, feedback buckets, approval status | Turns Sekkei into project memory |
| Pre-Publish Audit | DOM scan, accessibility/SEO/responsive checks, exportable report | Best marketing hook |
| Export | HTML/TXT/PDF-style client report, schema-versioned JSON, import preview | Builds trust and agency usefulness |

## 90-Day Execution Plan

| Window | Ship | Success metric |
|---|---|---|
| Days 1-15 | Onboarding, empty states, screenshots, WP.org page polish, one demo video | Better activation-to-first-action rate; first 5 reviews |
| Days 16-30 | Section health badges, reusable section presets, import recovery polish | Users can explain Sekkei in one sentence |
| Days 31-60 | Deep audit v1, responsive QA, report export | “Run audit before publish” becomes primary CTA |
| Days 61-90 | Design tokens, contrast checker, client handoff report | Freelancers use it across multiple projects |

## User-First Priority Framework

### Fast Win

The user should get value within 60 seconds:

- Open Elementor editor
- Click Sekkei
- See section planner synced or ready
- Add or review sections
- Run checklist/audit
- Export notes or JSON

### Daily Habit

Sekkei should become a daily work habit by saving:

- Project structure
- QA progress
- Notes and client feedback
- Reusable snippets
- Handoff data

### Pro Upgrade Trigger

Pro should trigger the sentence:

> I need this for my agency.

That means report branding, SOP templates, advanced audits, revision history, and client approval workflows.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Elementor adds similar native planning/AI tools | High | Focus on workflow memory, SOP, client handoff, and audit reports |
| localStorage-only data | Medium | Make export/import and backup/restore obvious; Pro can add optional cloud sync |
| Solo developer bottleneck | Medium | Finish Phase 1 before Phase 2; avoid scope creep |
| WP.org guideline issues | High | Keep free plugin useful; keep Pro code separate; avoid site-wide nags |
| Elementor Pro dependency concerns | Low | Continue using free Elementor hooks only; document no Pro requirement |
| Market awareness | Medium | Build in public, short demos, fast support replies |

## Pro Version Strategy

### Product Structure

Keep `Sekkei` on WordPress.org as the free core plugin. Sell `Sekkei Pro` as a separate add-on plugin from your own site. Free stays genuinely useful; Pro adds agency-grade reporting, advanced audits, SOP templates, and collaboration.

### Free vs Pro Boundary

| Area | Free Sekkei | Sekkei Pro |
|---|---|---|
| Section Planner | Manual sections, Elementor sync, basic presets | Advanced section health, dependencies, reusable agency templates, bulk actions |
| Checklist | Built-in checklist and custom items | SOP checklist library, per-project checklist templates, pass/fail evidence notes |
| Audit | Basic pre-publish scan | Deep audit: accessibility, SEO, responsive, image weight, broken/empty links |
| Export | TXT/JSON export | White-label HTML/PDF client reports, agency branding, audit history |
| CSS | Basic generator and saved snippets | Selector helper, responsive packs, risk scoring, reusable code library |
| Design System | Color palette and font pairs | Contrast checker, design tokens, CSS variables, Elementor global style mapping notes |
| Projects | Local multi-project storage | Status dashboard, blockers, revision log, approval workflow |
| Collaboration | Local notes | Client feedback mode, team roles, shared review links if cloud exists |
| AI | None or prompt templates | Optional assistant for section plans, checklists, CSS starters, audit explanations |

### Sekkei Pro MVP Checklist

- [ ] Separate Pro plugin: `sekkei-pro` add-on with license/update system outside WordPress.org.
- [ ] White-label report export: HTML/PDF client report with agency logo and project summary.
- [ ] Advanced audit checks: accessibility, SEO, responsive status, image weight, broken links.
- [ ] Agency SOP templates: reusable checklist templates for landing pages, Woo pages, blog templates.
- [ ] Client approval workflow: Draft -> Review -> Revision -> Approved -> Published with revision log.

### Best First Pro Feature

White-label client report export. It is easy to understand, easy to demo, and agencies will pay for it faster than abstract settings.

### Best Sales Hook

> Before publishing, run Sekkei Pro and send a clean client report.

### Pricing Start

| Plan | Price idea | Best for | Include |
|---|---:|---|---|
| Free | $0 | Everyone | Core planner, checklist, notes, basic audit, basic export/import |
| Pro Solo | $39/year | Freelancers | Advanced audit, report export, SOP templates, design tokens |
| Pro Agency | $79/year | Small agencies | White-label reports, multi-project dashboard, client feedback, revision log |
| Founder Lifetime | $99-$149 once | Early users | Limited-time founder offer |

## Growth & Marketing Actions

- [ ] Build in public: weekly short clips, changelogs, screenshots, real Elementor use cases.
- [ ] Bengali + agency niche first: own the Bangla-friendly Elementor workflow angle before going broad.
- [ ] Support fast response: reply quickly on WordPress.org support to build trust.
- [ ] Demo video plan: 60-90 seconds showing Plan -> Checklist -> Audit -> Export.
- [ ] Landing page SEO: title around “Sekkei - Elementor Workflow Toolkit | Free WordPress Plugin”.
- [ ] Elementor community: share practical workflow tips, not only plugin promotions.

## Immediate Next Actions for Phase 1

1. Run the v1.1 QA checklist on Elementor editor and standalone admin tool.
2. Test valid, invalid, and oversized JSON imports.
3. Capture a simple warm-open timing note if needed.
4. Decide whether to update WP.org screenshots now or ship code first.
5. Screenshot-8 for Project Notes remains intentionally deferred.

## Research Sources

- Essential Addons: https://wordpress.org/plugins/essential-addons-for-elementor-lite/
- ElementsKit: https://wordpress.org/plugins/elementskit-lite/
- Premium Addons: https://wordpress.org/plugins/premium-addons-for-elementor/
- Royal Addons: https://wordpress.org/plugins/royal-elementor-addons/
- Happy Addons: https://wordpress.org/plugins/happy-elementor-addons/
- Unlimited Elements: https://wordpress.org/plugins/unlimited-elements-for-elementor/
- The Plus Addons: https://wordpress.org/plugins/the-plus-addons-for-elementor-page-builder/
- Visual CSS Style Editor / YellowPencil: https://wordpress.org/plugins/yellow-pencil-visual-theme-customizer/
- Elementor market context: https://www.techradar.com/reviews/elementor