# Sekkei Market Leadership Roadmap

Research date: 14 June 2026  
Goal: Make Sekkei the lightweight production workflow cockpit for Elementor freelancers and agencies.

## Overall Progress

- [ ] Phase 1: Trust, polish, and retention
- [ ] Phase 2: Smarter section planner
- [ ] Phase 3: Design system cockpit
- [ ] Phase 4: Audit and pre-publish QA
- [ ] Phase 5: Agency collaboration
- [ ] Phase 6: Ecosystem and monetization-ready

Progress: 0/6 phases complete.

## Positioning

Sekkei should not compete as another Elementor widget pack. The winning position is:

> Sekkei is the Elementor workflow OS: plan the page, track design work, generate safe CSS, audit before publish, and export client-ready handoff notes.

The big Elementor addon market is already crowded by plugins that win on widgets, templates, theme builders, WooCommerce builders, and visual effects. Sekkei can win by being fast, focused, and useful beside any Elementor stack.

## Competitor Snapshot

| Competitor | What they have | What Sekkei should do differently |
|---|---|---|
| Essential Addons | 110+ elements, 6,500+ templates, 2M+ active installs, WooCommerce widgets, element control | Own planning, QA, handoff, and project memory instead of widgets |
| ElementsKit | 110+ elements, 20+ modules, 1000+ templates, header/footer, mega menu, custom widget builder, 1M+ installs | Stay lighter and workflow-specific |
| Premium Addons | 700k+ installs, strong widget/template ecosystem | Differentiate with agency process and pre-publish audit |
| Royal Addons | 100+ addons, 150+ kits, theme/woo/popup/form/widget builders, 600k+ installs | Avoid builder bloat; become the companion workflow layer |
| Happy Addons | 143+ widgets/features, 500+ blocks, 70+ templates, theme builder, cross-domain copy | Own section planning, checklist SOPs, and client approval |
| Unlimited Elements | 300k+ installs, large widget catalog | Generate structure, QA, and project reports rather than more widgets |
| The Plus Addons | 120+ widgets/extensions, 1000+ templates, 100k+ installs | Win with lower complexity and clearer workflow value |
| Visual CSS Style Editor / YellowPencil | Visual CSS editing, 40k+ installs | Offer safer Elementor-specific CSS snippets and selector guidance |
| Elementor / Elementor Pro | Native builder, widgets, kits, Theme Builder, WooCommerce, forms, popups, AI direction | Complement Elementor with planning, QA, handoff, documentation |

## Phase 1: Trust, Polish, and Retention (v1.1)

- [ ] First-run onboarding: 3-step guided tour for panel, section planner, audit, export.
- [ ] Empty states rewrite: every tab shows the next useful action.
- [ ] Performance budget: panel opens under 500ms after warm load; no frontend assets.
- [ ] Crash-safe localStorage: auto-backup, corrupt data recovery, import validation report.
- [ ] WP.org growth pack: better screenshots, FAQ, keywords, support snippets, short demo video.

## Phase 2: Smarter Section Planner (v1.2)

- [ ] Two-way Elementor sync for section/container rename, order, and type mapping.
- [ ] Section health badges: missing title, duplicate class, empty container, no mobile note, no CTA.
- [ ] Page outline export for client approval.
- [ ] Reusable section presets: hero, feature, pricing, FAQ, testimonial, footer.
- [ ] Section dependencies: waiting for copy, image, client approval, development.

## Phase 3: Design System Cockpit (v1.3)

- [ ] Global design tokens: color roles, typography scale, spacing scale, radius, shadows.
- [ ] Contrast checker for saved palette roles.
- [ ] Font pairing upgrade with industry filters and multilingual presets.
- [ ] CSS snippet library by project, selector, device, and risk level.
- [ ] Elementor selector helper for selected section/container.

## Phase 4: Audit and Pre-Publish QA (v1.4)

- [ ] Deep page audit: placeholder copy, empty links, missing alt, heading order, repeated IDs, oversized images.
- [ ] Responsive QA checklist for desktop/tablet/mobile states.
- [ ] Accessibility hints: button labels, link text, heading sequence, contrast warnings.
- [ ] SEO handoff checklist: title, meta, H1, image alt, internal links, schema notes.
- [ ] Audit report export: PDF/HTML/TXT style client-friendly report.

## Phase 5: Agency Collaboration (v1.5)

- [ ] Project status board: draft, design, review, revision, approved, published.
- [ ] Client feedback mode with exportable comment list.
- [ ] Revision log: date, author, change summary, client request, final status.
- [ ] Templateable SOP checklists for landing page, Woo page, blog template.
- [ ] Multi-project dashboard with progress, blockers, last updated, export/import.

## Phase 6: Ecosystem and Monetization-Ready (v2.0)

- [ ] Optional cloud sync while keeping free local mode.
- [ ] Team workspace roles: owner, designer, developer, client reviewer.
- [ ] Optional AI assist layer: section plan, checklist, CSS starter, audit explanation.
- [ ] Workflow template marketplace.
- [ ] Freemium boundary: free core workflow; pro team/cloud/white-label/advanced audits.

## Current Feature Upgrade Plan

| Current feature | Upgrade | Why |
|---|---|---|
| Section Planner | Health badges, statuses, templates, selected Elementor mapping | This should become the flagship feature |
| Design Checklist | Checklist templates, pass/fail notes, reusable SOPs | Agencies need repeatable process |
| Color Palette | Contrast checks, color roles, CSS variable export | Makes it a design-system tool |
| Font Pairing | Multilingual presets, hierarchy preview, CSS variables | Strong niche for Bengali and agency use |
| CSS Generator | Selector helper, risk warning, responsive snippets | Safer custom CSS is a real painkiller |
| Project Notes | Revision log, feedback buckets, blockers, approval status | Turns Sekkei into project memory |
| Pre-Publish Audit | DOM scan, accessibility/SEO/responsive checks, exportable report | Best marketing hook |
| Export | HTML/PDF client report, schema-versioned JSON, import preview | Builds trust and agency usefulness |

## 90-Day Execution Plan

| Window | Ship | Success metric |
|---|---|---|
| Days 1-15 | Onboarding, empty states, screenshots, WP.org page polish, one demo video | Better activation-to-first-action rate; first 5 reviews |
| Days 16-30 | Section health badges, reusable section presets, import recovery | Users can explain Sekkei in one sentence |
| Days 31-60 | Deep audit v1, responsive QA, report export | “Run audit before publish” becomes primary CTA |
| Days 61-90 | Design tokens, contrast checker, client handoff report | Freelancers use it across multiple projects |

## My Advice

1. Do not become another widget pack. That market is crowded and expensive.
2. Own one sharp promise first: “Run a Sekkei audit before publishing Elementor pages.”
3. Keep the plugin lightweight. No frontend bloat should remain a public promise.
4. Build in public: short videos, changelogs, screenshots, real Elementor use cases.
5. Win Bengali + agency niche first, then expand globally.
6. Add optional pro features later, but keep the free version genuinely useful.


## Pro Version Strategy

### Product structure

Recommended model: keep `Sekkei` on WordPress.org as the free core plugin, and sell `Sekkei Pro` as a separate add-on plugin from our own website. The Pro add-on should require the free plugin, but all premium code should live outside WordPress.org.

Why this matters:

- WordPress.org does not allow trialware or locally included locked features in directory plugins.
- WordPress.org allows paid services/add-ons when handled transparently and without admin hijacking.
- Free Sekkei must remain genuinely useful so reviews stay positive.

### Free vs Pro Boundary

| Area | Free Sekkei | Sekkei Pro |
|---|---|---|
| Section Planner | Manual sections, Elementor sync, basic presets | Advanced section health, dependencies, reusable agency templates, bulk actions |
| Checklist | Built-in checklist and custom items | SOP checklist library, per-project checklist templates, pass/fail evidence notes |
| Audit | Basic pre-publish scan | Deep audit reports: accessibility, SEO, responsive, image weight, broken/empty links |
| Export | TXT/JSON export | White-label HTML/PDF client reports, agency branding, audit history |
| CSS | Basic generator and saved snippets | Selector helper, responsive snippet packs, snippet risk scoring, reusable code library |
| Design System | Color palette and font pairs | Contrast checker, design tokens, CSS variables, Elementor global style mapping notes |
| Projects | Local multi-project storage | Project dashboard, statuses, blockers, revision log, approval workflow |
| Collaboration | Local notes | Client feedback mode, team roles, shared review links if cloud exists |
| Backup | Manual JSON export/import | Scheduled local backups, cloud sync if SaaS is added |
| AI | None or small local prompt templates | Optional AI assistant for section plan, checklist, copy prompts, audit explanation |

### Best Pro Features to Build First

1. White-label client report export
   - This is the easiest feature to charge for.
   - Agencies understand the value immediately.
   - Report can include project summary, section outline, checklist progress, audit result, pending issues, revision notes.

2. Advanced pre-publish audit
   - Main marketing promise: “Run Sekkei Pro before publishing Elementor pages.”
   - Checks: heading order, duplicate IDs/classes, empty links, missing alt, placeholder text, oversized images, responsive review status, contrast warnings.

3. Agency SOP templates
   - Landing page SOP, WooCommerce product page SOP, homepage SOP, blog template SOP, migration QA SOP.
   - Users can save their own templates and reuse them across projects.

4. Client feedback and approval workflow
   - Statuses: Draft, Internal Review, Client Review, Revision, Approved, Published.
   - Export feedback without giving the client WordPress admin access.

5. Design system export
   - Color roles, font scale, spacing scale, CSS variables, Elementor global style checklist.
   - Great for agency handoff and repeat projects.

### Pricing Recommendation

Start simple:

| Plan | Price idea | Best for | Include |
|---|---:|---|---|
| Free | ## Research Sources | Everyone | Core planner, checklist, notes, basic audit, basic export |
| Pro Solo | $39/year | Freelancers | Advanced audit, report export, SOP templates, design tokens |
| Pro Agency | $79/year | Small agencies | White-label reports, multi-project dashboard, client feedback, revision log |
| Lifetime launch deal | $99-$149 once | Early users | Limited-time founder offer to get first paying users |

Do not start with too many plans. Two paid plans are enough.

### License and Update System

- Use a separate `sekkei-pro` plugin zip.
- Free plugin detects Pro only if installed and active.
- Add a small, polite “Upgrade” tab only inside Sekkei settings/tool pages.
- No site-wide nags.
- Use a license/update provider later: Easy Digital Downloads Software Licensing, Freemius, Lemon Squeezy custom updater, or a simple custom license server.
- If using Freemius/Appsero-style telemetry, make it explicit opt-in.

### Technical Architecture

- Free plugin exposes hooks/events:
  - `sekkei_register_modules`
  - `sekkei_register_audit_checks`
  - `sekkei_register_export_formats`
  - `sekkei_register_checklist_templates`
- Pro plugin registers extra modules through those hooks.
- Shared data schema stays in free plugin.
- Pro-only data is namespaced, e.g. `sekkei_pro_*`.
- Keep all frontend output disabled by default; Sekkei should remain editor/admin-only.

### Launch Sequence

1. Free v1.1: polish, onboarding, basic audit, strong screenshots.
2. Free v1.2: section health and better Elementor sync.
3. Pro beta: white-label report + advanced audit + SOP templates.
4. Invite 20 Elementor freelancers/agencies to use it free for feedback.
5. Launch Pro with founder lifetime deal.
6. Add Agency plan only after users ask for collaboration/report branding.

### What should never be Pro-only

Keep these free forever:

- Basic section planner
- Basic checklist
- Basic notes
- Basic color/font/CSS tools
- Basic export/import
- Basic Elementor panel access

Reason: free users must feel Sekkei is complete, not crippled. Pro should feel like a professional workflow upgrade, not a ransom screen.

### Pro Positioning

Free tagline:

> Plan, check, and organize Elementor projects inside the editor.

Pro tagline:

> Turn Elementor builds into client-ready, audit-backed agency workflows.

Main sales promise:

> Before you publish, run Sekkei Pro and send a clean client report.

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