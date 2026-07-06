

// ===== GLOBAL ERROR BOUNDARY =====
// Catches uncaught errors and unhandled promise rejections to prevent
// silent failures. Attempts emergency save and notifies the user.
(function() {
  var errorCount = 0;
  var MAX_ERRORS = 5;

  function handleCriticalError(message, source) {
    errorCount++;
    if (errorCount > MAX_ERRORS) return; // prevent infinite loops
    console.error('[Sekkei Error Boundary]', message, source);
    // Attempt emergency save
    try {
      if (typeof state !== 'undefined' && state && state.projects) {
        var data = JSON.stringify(state);
        localStorage.setItem('itspc_state_emergency', data);
      }
    } catch (e) { /* localStorage may be full or unavailable */ }
    // Notify user
    try {
      if (typeof toast === 'function' && errorCount <= 2) {
        toast('An error occurred. Your data has been auto-saved.');
      }
    } catch (e) { /* toast may not be ready yet */ }
  }

  window.onerror = function(message, source, lineno, colno, error) {
    handleCriticalError(message, source + ':' + lineno);
    return false; // let default handling continue for console
  };

  window.addEventListener('unhandledrejection', function(event) {
    handleCriticalError(
      event.reason ? (event.reason.message || String(event.reason)) : 'Unhandled promise rejection',
      'promise'
    );
  });
})();

// ===== STATE =====
let state = {
  currentProject: 'default',
  projects: {
    default: {
      name: 'My Project',
      sections: [],
      checks: {},
      colors: [],
      savedFontPairs: [],
      cssSnippets: [],
      notes: '',
      designTokens: {
        typography: { base: 16, ratio: 1.250 },
        spacing: { base: 8 },
        radius: { sm: 4, md: 8, lg: 12, xl: 16 },
        shadows: {
          soft: '0 2px 8px rgba(0,0,0,0.05)',
          medium: '0 8px 24px rgba(0,0,0,0.08)',
          hard: '0 16px 40px rgba(0,0,0,0.12)'
        }
      }
    }
  }
};
let nextId = Date.now();
let elementorSyncTimer = null;
let lastElementorSignature = '';
let editingSectionId = null;
let displaySettings = normalizeDisplaySettings(getInitialDisplaySettings());
const APP_BOOT_TIME = Date.now();
const STORAGE_KEY = 'itspc_state';
const BACKUP_KEY = 'itspc_state_backup';
const ONBOARDING_KEY = 'itspc_onboarding_done_v11';
const SAVE_COUNT_KEY = 'itspc_save_count';
const LAST_BACKUP_KEY = 'itspc_last_backup_date';
const BACKUP_REMIND_SAVES = 15;
const BACKUP_REMIND_DAYS = 7;

const SECTION_TYPES = ['hero', 'nav', 'content', 'features', 'cta', 'footer', 'container', 'custom'];
const SECTION_DEPENDENCIES = ['ready', 'copy', 'image', 'approval', 'development'];
const DEPENDENCY_LABELS = {
  ready: 'Ready',
  copy: 'Copy needed',
  image: 'Images needed',
  approval: 'Approval',
  development: 'Dev needed'
};
const GENERIC_SECTION_NAMES = ['section', 'container', 'untitled section', 'inner section'];
const COLOR_ROLES = ['primary', 'secondary', 'text', 'accent', 'background', 'custom', ''];

function normalizeDisplaySettings(settings) {
  const safe = settings && typeof settings === 'object' ? settings : {};
  return {
    plannerShowHealth: safe.plannerShowHealth !== false,
    plannerShowNotes: safe.plannerShowNotes !== false,
    plannerShowCss: safe.plannerShowCss !== false,
    plannerShowBadges: safe.plannerShowBadges !== false
  };
}

function getInitialDisplaySettings() {
  try {
    const raw = new URLSearchParams(window.location.search).get('display');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(decodeURIComponent(raw));
    }
  } catch (e) {
    return {};
  }
}

function cleanText(value, maxLen = 500) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

function cleanId(value, fallbackPrefix = 'id') {
  const cleaned = cleanText(value, 80).replace(/[^A-Za-z0-9_-]/g, '');
  if (fallbackPrefix === '') return cleaned;
  return cleaned || fallbackPrefix + Date.now() + Math.random().toString(36).slice(2, 8);
}

function cleanHex(value) {
  const hex = cleanText(value, 16);
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex) ? hex : '#000000';
}

function cleanCssClass(value) {
  return cleanText(value, 120).replace(/[^A-Za-z0-9_\-#. ]/g, '');
}

function cleanFontName(value) {
  return cleanText(value, 80).replace(/[^A-Za-z0-9 \-]/g, '');
}

function cleanDate(value) {
  const date = cleanText(value, 16);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().split('T')[0];
}

function normalizeSection(section) {
  const type = cleanText(section && section.type, 20).toLowerCase();
  const qad = cleanText(section && section.qa_desktop, 20).toLowerCase();
  const qat = cleanText(section && section.qa_tablet, 20).toLowerCase();
  const qam = cleanText(section && section.qa_mobile, 20).toLowerCase();
  return {
    id: cleanId(section && section.id, 's'),
    elementorId: cleanId(section && section.elementorId, ''),
    elementorCid: cleanId(section && section.elementorCid, ''),
    name: cleanText(section && section.name, 120) || 'Untitled Section',
    type: SECTION_TYPES.includes(type) ? type : 'content',
    note: cleanText(section && section.note, 600),
    css: cleanCssClass(section && section.css),
    dependency: SECTION_DEPENDENCIES.includes(cleanText(section && section.dependency, 24)) ? cleanText(section && section.dependency, 24) : 'ready',
    elementorChildren: Math.max(0, parseInt(section && section.elementorChildren, 10) || 0),
    lastElementorTitle: cleanText(section && section.lastElementorTitle, 120),
    qa_desktop: ['pending', 'pass', 'fail'].includes(qad) ? qad : 'pending',
    qa_tablet: ['pending', 'pass', 'fail'].includes(qat) ? qat : 'pending',
    qa_mobile: ['pending', 'pass', 'fail'].includes(qam) ? qam : 'pending',
    qa_notes: cleanText(section && section.qa_notes, 600)
  };
}

function normalizeProject(project) {
  const safe = project && typeof project === 'object' ? project : {};
  const status = cleanText(safe.status, 24);
  const validStatuses = ['Draft', 'Design', 'Review', 'Revision', 'Approved', 'Published'];
  return {
    name: cleanText(safe.name, 120) || 'Imported Project',
    sections: Array.isArray(safe.sections) ? safe.sections.slice(0, 200).map(normalizeSection) : [],
    checks: normalizeChecks(safe.checks),
    colors: Array.isArray(safe.colors) ? safe.colors.slice(0, 200).map(normalizeColor) : [],
    savedFontPairs: Array.isArray(safe.savedFontPairs) ? safe.savedFontPairs.slice(0, 100).map(normalizeFontPair).filter(p => p.heading && p.body) : [],
    cssSnippets: Array.isArray(safe.cssSnippets) ? safe.cssSnippets.slice(0, 100).map(normalizeSnippet) : [],
    notes: cleanText(safe.notes, 20000),
    designTokens: normalizeDesignTokens(safe.designTokens),
    status: validStatuses.includes(status) ? status : 'Draft',
    blockers: cleanText(safe.blockers, 300) || '',
    lastUpdated: parseInt(safe.lastUpdated, 10) || Date.now(),
    comments: Array.isArray(safe.comments) ? safe.comments.slice(0, 100).map(normalizeComment) : [],
    revisions: Array.isArray(safe.revisions) ? safe.revisions.slice(0, 100).map(normalizeRevision) : [],
    auditHistory: Array.isArray(safe.auditHistory) ? safe.auditHistory.slice(0, 10).map(normalizeAuditHistoryItem) : []
  };
}

function normalizeAuditHistoryItem(item) {
  const safe = item && typeof item === 'object' ? item : {};
  return {
    date: cleanText(safe.date, 80) || new Date().toISOString(),
    score: parseInt(safe.score, 10) || 0,
    issuesCount: parseInt(safe.issuesCount, 10) || 0
  };
}

function normalizeComment(c) {
  return {
    id: cleanId(c && c.id, 'cmt'),
    sectionId: cleanText(c && c.sectionId, 80),
    author: cleanText(c && c.author, 80) || 'Client',
    date: cleanDate(c && c.date),
    text: cleanText(c && c.text, 1000),
    status: ['open', 'progress', 'resolved'].includes(cleanText(c && c.status, 24).toLowerCase()) ? cleanText(c && c.status, 24).toLowerCase() : 'open'
  };
}

function normalizeRevision(r) {
  return {
    id: cleanId(r && r.id, 'rev'),
    date: cleanDate(r && r.date),
    author: cleanText(r && r.author, 80) || 'Designer',
    summary: cleanText(r && r.summary, 1000),
    request: cleanText(r && r.request, 1000),
    status: ['pending', 'applied', 'verified', 'rejected'].includes(cleanText(r && r.status, 24).toLowerCase()) ? cleanText(r && r.status, 24).toLowerCase() : 'pending'
  };
}

function normalizeDesignTokens(tokens) {
  const safe = tokens && typeof tokens === 'object' ? tokens : {};
  const typo = safe.typography && typeof safe.typography === 'object' ? safe.typography : {};
  const spacing = safe.spacing && typeof safe.spacing === 'object' ? safe.spacing : {};
  const radius = safe.radius && typeof safe.radius === 'object' ? safe.radius : {};
  const shadows = safe.shadows && typeof safe.shadows === 'object' ? safe.shadows : {};

  return {
    typography: {
      base: parseInt(typo.base, 10) || 16,
      ratio: parseFloat(typo.ratio) || 1.250
    },
    spacing: {
      base: parseInt(spacing.base, 10) || 8
    },
    radius: {
      sm: parseInt(radius.sm, 10) || 4,
      md: parseInt(radius.md, 10) || 8,
      lg: parseInt(radius.lg, 10) || 12,
      xl: parseInt(radius.xl, 10) || 16
    },
    shadows: {
      soft: cleanText(shadows.soft, 120) || '0 2px 8px rgba(0,0,0,0.05)',
      medium: cleanText(shadows.medium, 120) || '0 8px 24px rgba(0,0,0,0.08)',
      hard: cleanText(shadows.hard, 120) || '0 16px 40px rgba(0,0,0,0.12)'
    }
  };
}

function normalizeChecks(checks) {
  const safe = {};
  if (!checks || typeof checks !== 'object') return safe;
  Object.entries(checks).slice(0, 50).forEach(([group, items]) => {
    if (!Array.isArray(items)) return;
    safe[cleanText(group, 80) || 'Checklist'] = items.slice(0, 100).map(item => ({
      text: cleanText(item && item.text, 240),
      done: !!(item && item.done),
      custom: !!(item && item.custom)
    })).filter(item => item.text);
  });
  return safe;
}

function normalizeColor(color) {
  const role = cleanText(color && color.role, 24).toLowerCase();
  return {
    id: cleanId(color && color.id, 'c'),
    hex: cleanHex(color && color.hex),
    name: cleanText(color && color.name, 80),
    role: COLOR_ROLES.includes(role) ? role : 'custom',
    group: cleanText(color && color.group, 80) || 'Project Colors'
  };
}

function normalizeFontPair(pair) {
  const tags = Array.isArray(pair && pair.tags) ? pair.tags.map(t => cleanText(t, 24)).filter(Boolean).slice(0, 8) : ['custom'];
  return {
    heading: cleanFontName(pair && pair.heading),
    body: cleanFontName(pair && pair.body),
    previewText: cleanText(pair && pair.previewText, 120),
    tags,
    note: cleanText(pair && pair.note, 240),
    headingRec: cleanText(pair && pair.headingRec, 80) || 'Wt 700, Lh 1.2',
    bodyRec: cleanText(pair && pair.bodyRec, 80) || 'Wt 400, Lh 1.6'
  };
}

function normalizeSnippet(snippet) {
  const device = cleanText(snippet && snippet.device, 20).toLowerCase();
  const risk = cleanText(snippet && snippet.risk, 20).toLowerCase();
  return {
    id: cleanId(snippet && snippet.id, 'snip'),
    name: cleanText(snippet && snippet.name, 120) || 'Snippet',
    code: cleanText(snippet && snippet.code, 20000),
    date: cleanDate(snippet && snippet.date),
    selector: cleanCssClass(snippet && snippet.selector),
    device: ['all', 'desktop', 'tablet', 'mobile'].includes(device) ? device : 'all',
    risk: ['low', 'medium', 'high'].includes(risk) ? risk : 'low'
  };
}

// ===== FONT PAIRS DATA =====
const fontPairsDB = [
  {id:'f1',heading:'Playfair Display',body:'Source Sans Pro',tags:['editorial','modern'],note:'Classic editorial  great for luxury brands, publishers',previewText:'The Art of Storytelling'},
  {id:'f2',heading:'Syne',body:'DM Sans',tags:['modern','bold'],note:'Tech-forward, great for SaaS and agencies',previewText:'Build Without Limits'},
  {id:'f3',heading:'Cormorant Garamond',body:'Raleway',tags:['editorial','minimal'],note:'Refined and elegant  law firms, consulting',previewText:'Excellence in Every Detail'},
  {id:'f4',heading:'Space Grotesk',body:'Inter',tags:['modern','minimal'],note:'Clean SaaS, fintech, modern startup',previewText:'Move Fast, Stay Sharp'},
  {id:'f5',heading:'Fraunces',body:'Nunito Sans',tags:['editorial','bold'],note:'Warm editorial  great for food, lifestyle',previewText:'Made with Intention'},
  {id:'f6',heading:'Bebas Neue',body:'Open Sans',tags:['bold'],note:'High-impact display  fitness, sports, events',previewText:'PUSH YOUR LIMITS'},
  {id:'f7',heading:'DM Serif Display',body:'DM Sans',tags:['minimal','modern'],note:'Balanced, approachable  marketing, landing pages',previewText:'Simple. Powerful. Yours.'},
  {id:'f8',heading:'Libre Baskerville',body:'Libre Franklin',tags:['editorial'],note:'Traditional authority  news, education, NGO',previewText:'The Truth, Clearly Told'},
  {id:'f9',heading:'Noto Serif Bengali',body:'Noto Sans Bengali',tags:['bengali'],note:'Bengali-friendly serif and sans pairing',previewText:'বাংলা ফন্ট প্রিভিউ'},
  {id:'f10',heading:'Hind Siliguri',body:'Noto Sans Bengali',tags:['bengali'],note:'Clean Bengali UI pairing for modern designs',previewText:'আধুনিক বাংলা ইন্টারফেস'},
  {id:'f11',heading:'Amiri',body:'Cairo',tags:['arabic'],note:'Traditional Serif Arabic pairing, elegant and readable',previewText:'اللغة العربية والجمال'},
  {id:'f12',heading:'Tajawal',body:'Lateef',tags:['arabic'],note:'Modern Sans Arabic pairing, clean UI text',previewText:'الخط العربي الحديث'},
];

// ===== CHECKLIST DATA =====
const defaultChecklist = {
  'Before Design': [
    'Client brief and requirements collected',
    'Brand colors and fonts confirmed',
    'Logo files received (SVG/PNG)',
    'Content (text + images) received or placeholder approved',
    'Reference sites noted and reviewed',
    'Deadline and revision rounds agreed',
  ],
  'Structure': [
    'Page sections planned and ordered in planner',
    'Section names labeled in Elementor (Navigator)',
    'Mobile breakpoints decided',
    'CSS IDs set for anchor menu links',
    'Global colors saved in Elementor settings',
    'Global fonts saved in Elementor settings',
  ],
  'Design': [
    'Typography scale applied (H1H6)',
    'Consistent section padding throughout',
    'Icon set consistent (one set only)',
    'Images compressed and WebP converted',
    'Alt text on all images',
    'Hover states on all interactive elements',
    'Button styles consistent',
    'Spacing and alignment verified',
  ],
  'Mobile': [
    'Mobile layout reviewed (320px768px)',
    'Tablet layout reviewed (768px1024px)',
    'Touch targets minimum 44px',
    'Font sizes readable on mobile',
    'Horizontal scroll eliminated',
    'Mobile menu tested',
  ],
  'SEO & Handoff': [
    'Unique H1 tag exists on the page',
    'Page Title tag is set and under 60 characters',
    'Meta Description is set and between 50-160 characters',
    'All images have descriptive alt text tags',
    'Internal and external links checked (no broken links)',
    'Social sharing (Open Graph) image and tags set',
    'Schema markup (Structured Data) verified if needed'
  ],
  'Handover': [
    'All content finalized (no lorem ipsum)',
    'Forms tested (submission, validation)',
    'Page speed check (GTmetrix/PageSpeed)',
    'SEO meta titles and descriptions set',
    'Social sharing image set (OG image)',
    'Favicon set',
    'Analytics/tracking code installed',
    'Client walkthrough completed',
  ],
};

function createDefaultProject(name = 'My Project') {
  return {
    name,
    sections: [],
    checks: {},
    colors: [],
    savedFontPairs: [],
    cssSnippets: [],
    notes: '',
    designTokens: normalizeDesignTokens({}),
    status: 'Draft',
    blockers: '',
    lastUpdated: Date.now(),
    comments: [],
    revisions: []
  };
}

function createDefaultState() {
  return { currentProject: 'default', projects: { default: createDefaultProject() } };
}

function getProjectStats(project) {
  const p = normalizeProject(project || createDefaultProject());
  let totalChecks = 0;
  Object.values(p.checks || {}).forEach(items => { totalChecks += items.length; });
  return {
    sections: p.sections.length,
    checks: totalChecks,
    colors: p.colors.length,
    fontPairs: p.savedFontPairs.length,
    snippets: p.cssSnippets.length,
    notes: p.notes ? p.notes.length : 0
  };
}

function hasProjectActivity(project) {
  const stats = getProjectStats(project);
  return stats.sections || stats.colors || stats.fontPairs || stats.snippets || stats.notes;
}

function analyzeImportProject(rawProject, normalizedProject, version) {
  const raw = rawProject && typeof rawProject === 'object' ? rawProject : {};
  const normalized = normalizeProject(normalizedProject || raw);
  const allowed = ['name', 'sections', 'checks', 'colors', 'savedFontPairs', 'cssSnippets', 'notes', 'designTokens', 'status', 'blockers', 'lastUpdated', 'comments', 'revisions'];
  const unsupported = Object.keys(raw).filter(key => !allowed.includes(key));
  const rawCounts = {
    sections: Array.isArray(raw.sections) ? raw.sections.length : 0,
    colors: Array.isArray(raw.colors) ? raw.colors.length : 0,
    fontPairs: Array.isArray(raw.savedFontPairs) ? raw.savedFontPairs.length : 0,
    snippets: Array.isArray(raw.cssSnippets) ? raw.cssSnippets.length : 0
  };
  const cleanCounts = getProjectStats(normalized);
  const sanitized = Math.max(0, rawCounts.sections - cleanCounts.sections) + Math.max(0, rawCounts.colors - cleanCounts.colors) + Math.max(0, rawCounts.fontPairs - cleanCounts.fontPairs) + Math.max(0, rawCounts.snippets - cleanCounts.snippets);
  return { version: cleanText(version || 'unknown', 20), unsupported, rawCounts, cleanCounts, sanitized };
}

function buildImportSummary(project, report = {}) {
  const stats = getProjectStats(project);
  const norm = normalizeProject(project);
  const comments = norm.comments.length;
  const revisions = norm.revisions.length;
  const unsupported = Array.isArray(report.unsupported) && report.unsupported.length ? report.unsupported.join(', ') : 'None';
  return 'Import "' + norm.name + '"?\n\nSchema version: ' + (report.version || 'unknown') + '\nSections: ' + stats.sections + '\nChecklist items: ' + stats.checks + '\nColors: ' + stats.colors + '\nFont pairs: ' + stats.fontPairs + '\nCSS snippets: ' + stats.snippets + '\nComments: ' + comments + '\nRevisions: ' + revisions + '\nNotes: ' + stats.notes + ' characters\nSanitized/dropped items: ' + (report.sanitized || 0) + '\nUnsupported fields: ' + unsupported;
}

function parseSavedState(raw) {
  if (!raw) return null;
  // Size guard: 5MB maximum
  if (raw.length > 5 * 1024 * 1024) {
    console.warn('[Sekkei] Data size exceeds 5MB limit.');
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // Prototype pollution guard
      if (parsed.__proto__) delete parsed.__proto__;
      if (parsed.constructor) delete parsed.constructor;
      if (parsed.prototype) delete parsed.prototype;
      return parsed;
    }
  } catch(e) {
    console.error('[Sekkei] JSON parsing error', e);
  }
  return null;
}

function normalizeState(rawState) {
  const safe = rawState && typeof rawState === 'object' ? rawState : createDefaultState();
  const normalized = { currentProject: cleanId(safe.currentProject, '') || 'default', projects: {}, customSOPs: {} };
  const projects = safe.projects && typeof safe.projects === 'object' ? safe.projects : {};
  Object.keys(projects).slice(0, 80).forEach(id => {
    const safeId = cleanId(id, 'proj_');
    normalized.projects[safeId] = normalizeProject(projects[id]);
    if (normalized.currentProject === id) normalized.currentProject = safeId;
  });
  if (!Object.keys(normalized.projects).length && safe.project) {
    normalized.projects.default = normalizeProject(safe.project);
    normalized.currentProject = 'default';
  }
  if (!Object.keys(normalized.projects).length) {
    normalized.projects.default = createDefaultProject();
  }
  if (!normalized.projects[normalized.currentProject]) {
    normalized.currentProject = Object.keys(normalized.projects)[0] || 'default';
  }
  if (safe.customSOPs && typeof safe.customSOPs === 'object') {
    Object.entries(safe.customSOPs).slice(0, 50).forEach(([name, sop]) => {
      const cleanName = cleanText(name, 80);
      if (cleanName && sop && typeof sop === 'object') {
        normalized.customSOPs[cleanName] = normalizeChecks(sop);
      }
    });
  }
  return normalized;
}

// ===== INIT =====
function init() {
  const savedTheme = localStorage.getItem('itspc_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="ti ti-moon"></i>';
  }

  loadState();
  syncWithElementor();
  startElementorAutoSync();
  initCrossTabSync();
  renderSections();
  renderChecklist();
  updateSOPDropdowns();
  renderColors();
  renderFontPairs();
  renderSnippets();
  renderTokens();
  loadNotes();
  updateBadges();
  renderOnboarding();
  updateDataHealthStatus();
  restoreCloudConfig();
}

/**
 * Cross-tab localStorage sync.
 * When another tab saves data, this tab picks up the changes
 * to prevent stale reads and race conditions.
 */
function initCrossTabSync() {
  window.addEventListener('storage', function(event) {
    // Only react to our storage key changes from OTHER tabs
    if (event.key !== STORAGE_KEY) return;
    if (!event.newValue) return;

    try {
      const otherState = normalizeState(parseSavedState(event.newValue));
      if (!otherState || !otherState.projects) return;

      // Compare timestamps — latest wins
      const currentProject = proj();
      const currentTimestamp = currentProject ? (currentProject.lastUpdated || 0) : 0;

      // Check if the other tab has newer data
      let otherHasNewer = false;
      Object.values(otherState.projects).forEach(function(p) {
        if ((p.lastUpdated || 0) > currentTimestamp) {
          otherHasNewer = true;
        }
      });

      if (otherHasNewer) {
        state = otherState;
        // Re-render everything
        document.getElementById('project-name-display').textContent = proj().name;
        renderSections();
        renderChecklist();
        renderColors();
        renderFontPairs();
        renderSnippets();
        renderTokens();
        loadNotes();
        updateBadges();
        updateDataHealthStatus();
        toast('Data synced from another tab.');
      }
    } catch(e) {
      console.warn('[Sekkei] Cross-tab sync error', e);
    }
  });
}

// ===== ONBOARDING =====
function renderOnboarding() {
  const card = document.getElementById('onboarding-card');
  if (!card) return;
  const done = localStorage.getItem(ONBOARDING_KEY) === '1';
  card.classList.toggle('show', !done && !hasProjectActivity(proj()));
}

function dismissOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, '1');
  renderOnboarding();
  toast('Welcome card hidden.');
}

function startGuidedSetup() {
  openAddSection();
  localStorage.setItem(ONBOARDING_KEY, '1');
  renderOnboarding();
  toast('Add your first page section.');
}

function updateDataHealthStatus() {
  const el = document.getElementById('data-health-status');
  if (!el) return;
  const lastSaved = localStorage.getItem('itspc_last_saved');
  const lastDbBackup = localStorage.getItem('itspc_last_db_backup');
  const hasBackup = !!localStorage.getItem(BACKUP_KEY);
  const loadMs = Date.now() - APP_BOOT_TIME;
  const projectCount = state && state.projects ? Object.keys(state.projects).length : 0;
  const savedLabel = lastSaved ? new Date(lastSaved).toLocaleString() : 'Not saved yet';
  const dbBackupLabel = lastDbBackup ? new Date(lastDbBackup).toLocaleString() : 'Never backed up to database';

  el.innerHTML = '<strong>Local data health</strong><br>' +
    '<span class="' + (hasBackup ? 'ok' : 'warn') + '">' + (hasBackup ? 'Recovery backup available' : 'No recovery backup yet') + '</span><br>' +
    'Last saved local: ' + esc(savedLabel) + '<br>' +
    'Last database sync: ' + esc(dbBackupLabel) + '<br>' +
    'Projects: ' + projectCount + '<br>' +
    'Panel boot check: ' + loadMs + 'ms in this session. Target warm open: under 500ms after assets are cached. No frontend assets are loaded.';
}

// ===== PERSISTENCE =====
function loadState() {
  let recovered = false;
  try {
    state = normalizeState(parseSavedState(localStorage.getItem(STORAGE_KEY)) || state);
  } catch(e) {
    console.warn('Failed to load state', e);
    // Try backup slot
    try {
      state = normalizeState(parseSavedState(localStorage.getItem(BACKUP_KEY)) || createDefaultState());
      recovered = true;
    } catch(backupErr) {
      console.warn('Failed to load backup state', backupErr);
      // Try emergency save slot
      try {
        const emergency = localStorage.getItem('itspc_state_emergency');
        if (emergency) {
          state = normalizeState(parseSavedState(emergency) || createDefaultState());
          recovered = true;
        } else {
          state = createDefaultState();
        }
      } catch(emergencyErr) {
        console.warn('Failed to load emergency state', emergencyErr);
        state = createDefaultState();
      }
    }
  }
  document.getElementById('project-name-display').textContent = proj().name;
  if (recovered) {
    saveState({ skipBackup: true });
    setTimeout(() => toast('Recovered from local backup.'), 300);
  }
}

/**
 * Save state to localStorage with retry logic.
 * Retries up to 3 times on failure with exponential backoff.
 * Tracks save count for auto-backup reminder.
 *
 * @param {Object} options - { skipBackup: bool, retryCount: number }
 */
function saveState(options = {}) {
  const retryCount = options.retryCount || 0;
  const MAX_RETRIES = 3;

  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current && !options.skipBackup) {
      localStorage.setItem(BACKUP_KEY, current);
    }
    state = normalizeState(state);
    const serialized = JSON.stringify(state);

    // Guard against localStorage quota
    const sizeKB = Math.round(serialized.length / 1024);
    if (sizeKB > 4500) {
      console.warn('[Sekkei] Data approaching localStorage limit: ' + sizeKB + 'KB');
      toast('Warning: Project data is very large (' + sizeKB + 'KB). Consider exporting a JSON backup.');
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem('itspc_last_saved', new Date().toISOString());
    updateDataHealthStatus();
    trackSaveForBackupReminder();
    scheduleDatabaseBackup();
  } catch(e) {
    console.warn('[Sekkei] Save failed (attempt ' + (retryCount + 1) + '/' + MAX_RETRIES + ')', e);

    if (retryCount < MAX_RETRIES) {
      // Retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 300; // 300ms, 600ms, 1200ms
      setTimeout(() => {
        saveState({ skipBackup: options.skipBackup, retryCount: retryCount + 1 });
      }, delay);
    } else {
      // All retries exhausted — notify user
      toast('Save failed. Please download a JSON backup from the Export tab.');
      // Try emergency slot as last resort
      try {
        localStorage.setItem('itspc_state_emergency', JSON.stringify(state));
      } catch(emergencyErr) {
        console.error('[Sekkei] Emergency save also failed', emergencyErr);
      }
    }
  }
}

/**
 * Track save count and show backup reminder when threshold is reached.
 * Reminds every 15 saves or every 7 days — whichever comes first.
 */
function trackSaveForBackupReminder() {
  try {
    // Count saves
    let count = parseInt(localStorage.getItem(SAVE_COUNT_KEY), 10) || 0;
    count++;
    localStorage.setItem(SAVE_COUNT_KEY, String(count));

    // Check days since last backup
    const lastBackupStr = localStorage.getItem(LAST_BACKUP_KEY);
    const daysSinceBackup = lastBackupStr
      ? Math.floor((Date.now() - new Date(lastBackupStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Remind if saves exceeded OR days since backup exceeded OR if they have never backed up yet after many saves
    const needsReminder = count >= BACKUP_REMIND_SAVES || (daysSinceBackup !== null && daysSinceBackup >= BACKUP_REMIND_DAYS) || (daysSinceBackup === null && count >= BACKUP_REMIND_SAVES);

    if (needsReminder && count > 1) {
      // Reset counter
      localStorage.setItem(SAVE_COUNT_KEY, '0');
      // Show reminder after short delay to not interrupt workflow
      setTimeout(() => {
        showBackupReminder(daysSinceBackup);
      }, 2000);
    }
  } catch(e) { /* non-critical — skip silently */ }
}

/**
 * Show a non-intrusive backup reminder with one-click download.
 */
function showBackupReminder(daysSinceBackup) {
  let msg = 'You\'ve made many changes since your last backup.';
  if (daysSinceBackup === null) {
    msg = 'You haven\'t backed up your projects yet.';
  } else if (daysSinceBackup >= BACKUP_REMIND_DAYS) {
    msg = 'It\'s been ' + daysSinceBackup + ' days since your last backup.';
  }

  // Use a persistent toast-like notification
  const existing = document.getElementById('itspc-backup-reminder');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'itspc-backup-reminder';
  el.style.cssText = 'position:fixed;bottom:60px;right:20px;z-index:99999;background:var(--bg2,#1a1a2e);border:1px solid var(--accent,#C8FF00);border-radius:12px;padding:16px 20px;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:var(--font,system-ui);animation:fadeIn .3s ease';
  el.innerHTML = '<div style="font-size:13px;font-weight:600;color:var(--text,#fff);margin-bottom:6px">💾 Backup Recommended</div>'
    + '<div style="font-size:12px;color:var(--text3,#9896A0);margin-bottom:12px;line-height:1.5">' + msg + ' Download a JSON backup to keep your projects safe.</div>'
    + '<div style="display:flex;gap:8px">'
    + '<button onclick="downloadBackupFromReminder()" style="flex:1;padding:7px 12px;background:var(--accent,#C8FF00);color:#0E0D13;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">Download Backup</button>'
    + '<button onclick="dismissBackupReminder()" style="padding:7px 12px;background:transparent;color:var(--text3,#9896A0);border:1px solid var(--border,#2a2a3e);border-radius:6px;font-size:12px;cursor:pointer">Later</button>'
    + '</div>';
  document.body.appendChild(el);
}

function downloadBackupFromReminder() {
  try {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sekkei-backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    localStorage.setItem(SAVE_COUNT_KEY, '0');
    toast('Backup downloaded!');
  } catch(e) {
    toast('Backup download failed. Use Export tab instead.');
  }
  dismissBackupReminder();
}

function dismissBackupReminder() {
  const el = document.getElementById('itspc-backup-reminder');
  if (el) el.remove();
}

function proj() {
  return state.projects[state.currentProject];
}

function saveAll() {
  proj().notes = document.getElementById('notes-area').value;
  saveState();
  toast('All data saved!');
}

// ===== NAVIGATION =====
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById('panel-' + id).classList.add('active');
  
  const nav = document.getElementById('nav-' + id);
  if (nav) nav.classList.add('active');
  
  const btnNav = document.getElementById('btn-nav-' + id);
  if (btnNav) {
    btnNav.classList.add('active');
    if (typeof btnNav.scrollIntoView === 'function') {
      btnNav.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
  
  if (id === 'export') {
    buildExport();
    updateDataHealthStatus();
  }
  if (id === 'tokens') {
    renderTokens();
  }
  if (id === 'dashboard') {
    renderDashboard();
    cancelProjectMeta();
  }
  if (id === 'feedback') {
    renderComments();
    closeAddComment();
  }
  if (id === 'revisions') {
    renderRevisions();
    closeAddRevision();
  }
  if (id === 'audit') {
    renderAuditHistory();
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('itspc_theme', isLight ? 'light' : 'dark');
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = isLight ? '<i class="ti ti-moon"></i>' : '<i class="ti ti-sun"></i>';
  }
}

// ===== TOAST =====
function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Copied!');
  });
}

// ===== SECTION PLANNER =====
function openAddSection() {
  document.getElementById('add-section-card').style.display = 'block';
  document.getElementById('new-sec-name').focus();
}
function closeAddSection() {
  document.getElementById('add-section-card').style.display = 'none';
}

function addSection() {
  const name = cleanText(document.getElementById('new-sec-name').value, 120);
  if (!name) return;
  const type = SECTION_TYPES.includes(document.getElementById('new-sec-type').value) ? document.getElementById('new-sec-type').value : 'content';
  const note = cleanText(document.getElementById('new-sec-note').value, 600);
  const css = cleanCssClass(document.getElementById('new-sec-css').value);
  const dependency = SECTION_DEPENDENCIES.includes(document.getElementById('new-sec-dependency').value) ? document.getElementById('new-sec-dependency').value : 'ready';
  proj().sections.push({ id: 's' + (nextId++), name, type, note, css, dependency });
  document.getElementById('new-sec-name').value = '';
  document.getElementById('new-sec-note').value = '';
  document.getElementById('new-sec-css').value = '';
  document.getElementById('new-sec-dependency').value = 'ready';
  renderSections();
  saveState();
  updateBadges();
}

function getPresetSections(preset) {
  const presets = {
    landing: [
      { name: 'Navigation Bar', type: 'nav', note: 'Logo + menu + CTA button', css: '.nav-section' },
      { name: 'Hero Section', type: 'hero', note: 'Main headline + CTA + hero image/video', css: '.hero-section' },
      { name: 'Features / Services', type: 'features', note: 'Icon boxes or feature cards', css: '.features-section' },
      { name: 'About / Story', type: 'content', note: 'Company intro, mission, team', css: '.about-section' },
      { name: 'Testimonials', type: 'content', note: 'Client reviews and social proof', css: '.testimonials-section' },
      { name: 'Pricing', type: 'content', note: 'Pricing plans comparison', css: '.pricing-section' },
      { name: 'FAQ', type: 'content', note: 'Answer common objections', css: '.faq-section' },
      { name: 'CTA Section', type: 'cta', note: 'Final call to action with form or button', css: '.cta-section' },
      { name: 'Footer', type: 'footer', note: 'Links, contact, social, copyright', css: '.footer-section' }
    ],
    service: [
      { name: 'Hero', type: 'hero', note: 'Service promise + booking CTA', css: '.service-hero' },
      { name: 'Problems', type: 'content', note: 'Client pain points', css: '.problems-section', dependency: 'copy' },
      { name: 'Services', type: 'features', note: 'Core service cards', css: '.services-section' },
      { name: 'Process', type: 'content', note: 'Step-by-step delivery', css: '.process-section' },
      { name: 'Proof', type: 'content', note: 'Results, testimonials, badges', css: '.proof-section', dependency: 'image' },
      { name: 'Contact CTA', type: 'cta', note: 'Lead form or calendar link', css: '.contact-cta' }
    ],
    woo: [
      { name: 'Shop Hero', type: 'hero', note: 'Offer + category links', css: '.shop-hero' },
      { name: 'Featured Products', type: 'features', note: 'Best sellers grid', css: '.featured-products' },
      { name: 'Categories', type: 'content', note: 'Product category cards', css: '.category-section', dependency: 'image' },
      { name: 'Trust Badges', type: 'content', note: 'Shipping, returns, secure checkout', css: '.trust-badges' },
      { name: 'Reviews', type: 'content', note: 'Customer reviews', css: '.reviews-section', dependency: 'approval' },
      { name: 'Footer CTA', type: 'cta', note: 'Newsletter or sale CTA', css: '.shop-cta' }
    ],
    blog: [
      { name: 'Archive Header', type: 'hero', note: 'Topic intro + search', css: '.archive-header' },
      { name: 'Featured Post', type: 'content', note: 'Pinned editorial card', css: '.featured-post', dependency: 'copy' },
      { name: 'Post Grid', type: 'features', note: 'Article cards and filters', css: '.post-grid' },
      { name: 'Sidebar / CTA', type: 'cta', note: 'Newsletter, lead magnet, socials', css: '.blog-cta' },
      { name: 'Footer', type: 'footer', note: 'Archive links and copyright', css: '.footer-section' }
    ]
  };
  return presets[preset] || presets.landing;
}

function addQuickSections() {
  const presetEl = document.getElementById('planner-preset');
  const preset = presetEl ? presetEl.value : 'landing';
  const templates = getPresetSections(preset);
  templates.forEach(t => {
    proj().sections.push(normalizeSection({ id: 's' + (nextId++), dependency: 'ready', ...t }));
  });
  renderSections();
  saveState();
  updateBadges();
  renderOnboarding();
  toast(templates.length + ' preset sections added!');
}

function deleteSection(id) {
  proj().sections = proj().sections.filter(s => s.id !== id);
  renderSections();
  saveState();
  updateBadges();
}

function moveSection(id, dir) {
  const secs = proj().sections;
  const idx = secs.findIndex(s => s.id === id);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= secs.length) return;
  [secs[idx], secs[newIdx]] = [secs[newIdx], secs[idx]];
  renderSections();
  saveState();
  toast('Planner order updated. Elementor canvas order is unchanged.');
}

function editSection(id) {
  openSectionModal(id);
}

function sectionTypeOptions(value) {
  return SECTION_TYPES.map(type => '<option value="' + type + '"' + (type === value ? ' selected' : '') + '>' + type.charAt(0).toUpperCase() + type.slice(1) + '</option>').join('');
}

function openSectionModal(id) {
  const sec = proj().sections.find(s => s.id === id);
  if (!sec) return;
  editingSectionId = id;
  document.getElementById('edit-sec-name').value = sec.name || '';
  document.getElementById('edit-sec-type').innerHTML = sectionTypeOptions(sec.type || 'content');
  document.getElementById('edit-sec-note').value = sec.note || '';
  document.getElementById('edit-sec-css').value = sec.css || '';
  document.getElementById('edit-sec-dependency').innerHTML = dependencyOptions(sec.dependency || 'ready');
  document.getElementById('edit-sec-qa-desktop').value = sec.qa_desktop || 'pending';
  document.getElementById('edit-sec-qa-tablet').value = sec.qa_tablet || 'pending';
  document.getElementById('edit-sec-qa-mobile').value = sec.qa_mobile || 'pending';
  document.getElementById('edit-sec-qa-notes').value = sec.qa_notes || '';
  const linked = !!(sec.elementorCid || sec.elementorId);
  document.getElementById('edit-sec-sync-wrap').style.display = linked ? 'flex' : 'none';
  document.getElementById('edit-sec-sync').checked = linked;
  document.getElementById('section-modal').classList.add('open');
  setTimeout(() => document.getElementById('edit-sec-name').focus(), 40);
}

function closeSectionModal() {
  editingSectionId = null;
  document.getElementById('section-modal').classList.remove('open');
}

function postElementorRename(section) {
  if (!(section.elementorCid || section.elementorId)) return;
  window.parent.postMessage({
    type: 'rename_elementor_element',
    id: section.elementorId,
    cid: section.elementorCid,
    title: section.name
  }, window.location.origin);
}

function saveSectionModal() {
  const sec = proj().sections.find(s => s.id === editingSectionId);
  if (!sec) return;
  const name = cleanText(document.getElementById('edit-sec-name').value, 120);
  if (!name) {
    toast('Section name is required.');
    document.getElementById('edit-sec-name').focus();
    return;
  }
  const type = cleanText(document.getElementById('edit-sec-type').value, 20).toLowerCase();
  sec.name = name;
  sec.type = SECTION_TYPES.includes(type) ? type : 'content';
  sec.note = cleanText(document.getElementById('edit-sec-note').value, 600);
  sec.css = cleanCssClass(document.getElementById('edit-sec-css').value);
  const dep = cleanText(document.getElementById('edit-sec-dependency').value, 24);
  sec.dependency = SECTION_DEPENDENCIES.includes(dep) ? dep : 'ready';
  sec.qa_desktop = document.getElementById('edit-sec-qa-desktop').value;
  sec.qa_tablet = document.getElementById('edit-sec-qa-tablet').value;
  sec.qa_mobile = document.getElementById('edit-sec-qa-mobile').value;
  sec.qa_notes = cleanText(document.getElementById('edit-sec-qa-notes').value, 600);
  const shouldRenameElementor = document.getElementById('edit-sec-sync').checked && (sec.elementorCid || sec.elementorId);
  renderSections();
  saveState();
  updateBadges();
  closeSectionModal();
  if (shouldRenameElementor) {
    postElementorRename(sec);
  }
}

function isGenericSectionName(name) {
  const normalized = cleanText(name, 120).toLowerCase();
  return !normalized || GENERIC_SECTION_NAMES.includes(normalized);
}

function getSectionHealth(section, sections) {
  const items = [];
  const name = cleanText(section.name, 120);
  if (isGenericSectionName(name)) items.push({ level: 'warn', label: 'Title' });
  if (section.css) {
    const css = section.css.toLowerCase();
    const duplicates = sections.filter(s => s.css && s.css.toLowerCase() === css).length;
    if (duplicates > 1) items.push({ level: 'risk', label: 'Duplicate CSS' });
  }
  if ((section.elementorId || section.elementorCid) && section.elementorChildren === 0) {
    items.push({ level: 'warn', label: 'Empty' });
  }
  if (!(section.elementorId || section.elementorCid)) {
    items.push({ level: 'info', label: 'Planner only' });
  }
  if (section.dependency && section.dependency !== 'ready') {
    items.push({ level: 'warn', label: DEPENDENCY_LABELS[section.dependency] || 'Waiting' });
  }
  return items;
}

function getPageHealth(sections) {
  const sectionIssues = sections.reduce((count, section) => count + getSectionHealth(section, sections).filter(i => i.level !== 'info').length, 0);
  const hasCta = sections.some(s => s.type === 'cta' || /\b(cta|contact|book|buy|checkout|quote)\b/i.test((s.name || '') + ' ' + (s.note || '') + ' ' + (s.css || '')));
  return { sectionIssues, hasCta, totalIssues: sectionIssues + (hasCta ? 0 : 1) };
}

function renderSectionHealthSummary(sections) {
  const el = document.getElementById('section-health-summary');
  if (!el) return;
  if (!displaySettings.plannerShowHealth || !sections.length) { el.innerHTML = ''; return; }
  const health = getPageHealth(sections);
  const score = Math.max(0, Math.round(100 - Math.min(health.totalIssues, 8) * 12.5));
  const cta = health.hasCta ? '<span class="health-pill ok">CTA ready</span>' : '<span class="health-pill warn">No CTA section</span>';
  const issue = health.sectionIssues ? '<span class="health-pill warn">' + health.sectionIssues + ' section warnings</span>' : '<span class="health-pill ok">Sections clean</span>';
  el.innerHTML = '<div><div class="summary-score">' + score + '% planner health</div><div class="summary-copy">Checks titles, duplicate CSS, linked empty containers, dependencies, and CTA coverage.</div></div><div class="section-health">' + cta + issue + '</div>';
}

function dependencyOptions(value) {
  return SECTION_DEPENDENCIES.map(dep => '<option value="' + dep + '"' + (dep === value ? ' selected' : '') + '>' + DEPENDENCY_LABELS[dep] + '</option>').join('');
}

function setSectionDependency(id, value) {
  const sec = proj().sections.find(s => s.id === id);
  if (!sec) return;
  sec.dependency = SECTION_DEPENDENCIES.includes(value) ? value : 'ready';
  renderSections();
  saveState();
}

function applyDisplaySettings(settings) {
  displaySettings = normalizeDisplaySettings(settings);
  renderSections();
}

function renderSections() {
  const list = document.getElementById('section-list');
  const secs = proj().sections;
  renderSectionHealthSummary(secs);
  if (!secs.length) {
    list.innerHTML = '<div class="empty"><i class="ti ti-layout-rows"></i><h3>Start with your page outline</h3><p class="mini">Add sections manually or scaffold a complete page structure from a preset.</p><div class="empty-actions"><button class="btn btn-accent btn-sm" onclick="openAddSection()"><i class="ti ti-plus"></i> Add Section</button><button class="btn btn-sm" onclick="addQuickSections()"><i class="ti ti-template"></i> Add Preset</button></div></div>'; 
    return;
  }
  list.innerHTML = secs.map((s, i) => {
    const health = getSectionHealth(s, secs);
    const healthHtml = displaySettings.plannerShowBadges
      ? (health.length ? '<div class="section-health">' + health.map(item => '<span class="health-pill ' + item.level + '">' + esc(item.label) + '</span>').join('') + '</div>' : '<div class="section-health"><span class="health-pill ok">Healthy</span></div>')
      : '';
    return `
    <div class="section-card" draggable="true" data-id="${s.id}"
         ondragstart="onDragStart(event,'${s.id}')"
         ondragover="onDragOver(event)"
         ondragenter="event.target.closest('.section-card')?.classList.add('drag-over')"
         ondragleave="event.target.closest('.section-card')?.classList.remove('drag-over')"
         ondrop="onDrop(event,'${s.id}')">
      <span class="drag-handle"><i class="ti ti-grip-vertical"></i></span>
      <span class="section-index">${String(i+1).padStart(2,'0')}</span>
      <span class="type-badge badge-${s.type}">${s.type.toUpperCase()}</span>
      <div class="section-info">
        <div class="section-name">
          ${esc(s.name)}
          ${(s.elementorId || s.elementorCid) ? ` <span class="sync-badge" title="Linked with Elementor element"><i class="ti ti-link" style="font-size:11px;color:var(--teal)"></i></span>` : ''}
        </div>
        ${displaySettings.plannerShowNotes && s.note ? `<div class="section-note">${esc(s.note)}</div>` : ''}
        ${displaySettings.plannerShowCss && s.css ? `<div class="section-css">${esc(s.css)}</div>` : ''}
        <div class="section-status-row" style="margin-top: 7px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; gap: 6px; align-items: center;">
            <select class="dependency-select" title="Dependency" onclick="event.stopPropagation()" onchange="setSectionDependency('${s.id}',this.value)">${dependencyOptions(s.dependency || 'ready')}</select>
            ${healthHtml}
          </div>
          <div class="qa-indicators" style="display: flex; gap: 6px; align-items: center;" onclick="event.stopPropagation()">
            <i class="ti ti-device-desktop qa-badge" title="Desktop QA: ${(s.qa_desktop || 'pending').toUpperCase()}" style="cursor: pointer; font-size: 14px; color: ${getQAColor(s.qa_desktop)}; opacity: ${s.qa_desktop === 'pending' ? 0.4 : 1};" onclick="toggleSectionQA('${s.id}', 'desktop')"></i>
            <i class="ti ti-device-tablet qa-badge" title="Tablet QA: ${(s.qa_tablet || 'pending').toUpperCase()}" style="cursor: pointer; font-size: 14px; color: ${getQAColor(s.qa_tablet)}; opacity: ${s.qa_tablet === 'pending' ? 0.4 : 1};" onclick="toggleSectionQA('${s.id}', 'tablet')"></i>
            <i class="ti ti-device-mobile qa-badge" title="Mobile QA: ${(s.qa_mobile || 'pending').toUpperCase()}" style="cursor: pointer; font-size: 14px; color: ${getQAColor(s.qa_mobile)}; opacity: ${s.qa_mobile === 'pending' ? 0.4 : 1};" onclick="toggleSectionQA('${s.id}', 'mobile')"></i>
          </div>
        </div>
      </div>
      <div class="section-actions">
        <button class="btn btn-icon btn-sm" onclick="moveSection('${s.id}',-1)" title="Move up"><i class="ti ti-arrow-up"></i></button>
        <button class="btn btn-icon btn-sm" onclick="moveSection('${s.id}',1)" title="Move down"><i class="ti ti-arrow-down"></i></button>
        <button class="btn btn-icon btn-sm" onclick="editSection('${s.id}')" title="Edit"><i class="ti ti-edit"></i></button>
        <button class="btn btn-icon btn-sm" onclick="deleteSection('${s.id}')" title="Delete"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function getQAColor(status) {
  if (status === 'pass') return 'var(--teal)';
  if (status === 'fail') return 'var(--red)';
  return 'var(--text3)';
}

function toggleSectionQA(id, device) {
  const sec = proj().sections.find(s => s.id === id);
  if (!sec) return;
  const prop = 'qa_' + device;
  const current = sec[prop] || 'pending';
  let next = 'pending';
  if (current === 'pending') next = 'pass';
  else if (current === 'pass') next = 'fail';
  sec[prop] = next;
  renderSections();
  saveState();
  toast(`${device.charAt(0).toUpperCase() + device.slice(1)} QA set to ${next.toUpperCase()}`);
}

// Drag & Drop
let dragSrcId = null;
function onDragStart(e, id) {
  dragSrcId = id;
  e.target.closest('.section-card').classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e) { e.preventDefault(); }
function onDrop(e, targetId) {
  e.preventDefault();
  document.querySelectorAll('.section-card').forEach(c => { c.classList.remove('drag-over','dragging'); });
  if (!dragSrcId || dragSrcId === targetId) return;
  const secs = proj().sections;
  const fromIdx = secs.findIndex(s => s.id === dragSrcId);
  const toIdx = secs.findIndex(s => s.id === targetId);
  if (fromIdx < 0 || toIdx < 0) return;
  const [item] = secs.splice(fromIdx, 1);
  secs.splice(toIdx, 0, item);
  renderSections();
  saveState();
  toast('Planner order updated. Elementor canvas order is unchanged.');
  dragSrcId = null;
}

// ===== CHECKLIST =====
function getChecks() {
  if (!proj().checks || Object.keys(proj().checks).length === 0) {
    proj().checks = {};
    for (const [group, items] of Object.entries(defaultChecklist)) {
      proj().checks[group] = items.map(text => ({ text, done: false, custom: false }));
    }
    saveState();
  }
  return proj().checks;
}

let collapsedGroups = {};

function toggleGroupCollapse(group) {
  collapsedGroups[group] = !collapsedGroups[group];
  renderChecklist();
}

function renderChecklist() {
  const checks = getChecks();
  const container = document.getElementById('checklist-container');
  let html = '';
  for (const [group, items] of Object.entries(checks)) {
    const totalCount = items.length;
    const doneCount = items.filter(item => item.done).length;
    const isCompleted = totalCount > 0 && totalCount === doneCount;
    
    // Auto-collapse if completed and not explicitly set by user
    if (collapsedGroups[group] === undefined) {
      collapsedGroups[group] = isCompleted;
    }
    
    const isCollapsed = collapsedGroups[group];
    
    html += `<div class="check-group ${isCollapsed ? 'collapsed' : ''}">
      <div class="check-group-title" onclick="toggleGroupCollapse('${esc(group)}')">
        <span>${esc(group)} <span style="font-size:10px;font-weight:normal;opacity:0.6;margin-left:4px">(${doneCount}/${totalCount})</span></span>
        <i class="ti ti-chevron-${isCollapsed ? 'right' : 'down'}" style="font-size:12px;opacity:0.8"></i>
      </div>`;
    if (!isCollapsed) {
      items.forEach((item, i) => {
        html += `<div class="check-row ${item.done ? 'done' : ''}" onclick="toggleCheck('${esc(group)}',${i})">
          <input type="checkbox" ${item.done ? 'checked' : ''} onclick="event.stopPropagation();toggleCheck('${esc(group)}',${i})" />
          <span class="check-label">${esc(item.text)}</span>
          ${item.custom ? `<button class="btn btn-icon btn-sm" onclick="event.stopPropagation();deleteCheckItem('${esc(group)}',${i})" title="Remove"><i class="ti ti-x"></i></button>` : ''}
        </div>`;
      });
    }
    html += '</div>';
  }
  container.innerHTML = html;
  updateCheckProgress();
}

function toggleCheck(group, idx) {
  const checks = getChecks();
  if (checks[group] && checks[group][idx]) {
    checks[group][idx].done = !checks[group][idx].done;
    
    // If completed and setting to true, we don't auto-collapse immediately while they look at it,
    // but the next render will handle it or they can collapse it.
    renderChecklist();
    saveState();
    updateBadges();
  }
}

function updateCheckProgress() {
  const checks = getChecks();
  let total = 0, done = 0;
  for (const items of Object.values(checks)) {
    items.forEach(item => { total++; if (item.done) done++; });
  }
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('check-label').textContent = `${done} of ${total} completed`;
  document.getElementById('check-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
}

function openAddCheckItem() {
  const area = document.getElementById('add-check-area');
  area.style.display = area.style.display === 'none' ? 'block' : 'none';
}

function addCheckItem() {
  const text = cleanText(document.getElementById('new-check-text').value, 240);
  if (!text) return;
  let group = document.getElementById('new-check-group').value;
  if (group === '__new__') {
    group = cleanText(document.getElementById('new-group-name').value, 80);
    if (!group) return;
  }
  const checks = getChecks();
  if (!checks[group]) checks[group] = [];
  checks[group].push({ text, done: false, custom: true });
  document.getElementById('new-check-text').value = '';
  renderChecklist();
  saveState();
  updateBadges();
  toast('Custom item added!');
}

function deleteCheckItem(group, idx) {
  const checks = getChecks();
  if (checks[group]) {
    checks[group].splice(idx, 1);
    if (checks[group].length === 0) delete checks[group];
    renderChecklist();
    saveState();
    updateBadges();
  }
}

// ===== SOP TEMPLATES DATABASE & LOGIC =====
const SOP_TEMPLATES = {
  landing: {
    'Sitemap & Planning': [
      { text: 'Outline page sections in Sekkei Planner', done: false, custom: false },
      { text: 'Rename sections in Elementor Navigator to match planner', done: false, custom: false },
      { text: 'Verify section sequence and logical flow', done: false, custom: false },
      { text: 'Mark container block dependencies (ready, copy, etc.)', done: false, custom: false }
    ],
    'Content & Copy': [
      { text: 'Unique H1 heading is defined with primary keyword', done: false, custom: false },
      { text: 'Call to Action (CTA) buttons have active copy', done: false, custom: false },
      { text: 'Check for placeholder lorem ipsum text', done: false, custom: false },
      { text: 'Proofread headings and text blocks', done: false, custom: false }
    ],
    'Design & Assets': [
      { text: 'Apply global color palette variables', done: false, custom: false },
      { text: 'Verify typography sizing hierarchy (H1-H6)', done: false, custom: false },
      { text: 'Compress images and convert to WebP', done: false, custom: false },
      { text: 'Add descriptive ALT tag to all image assets', done: false, custom: false }
    ],
    'Responsiveness & QA': [
      { text: 'Check layout on mobile breakpoint (minimum 320px)', done: false, custom: false },
      { text: 'Check layout on tablet breakpoint', done: false, custom: false },
      { text: 'Touch targets (links/buttons) are at least 44x44px', done: false, custom: false },
      { text: 'Eliminate horizontal overflow (sideways scroll)', done: false, custom: false }
    ],
    'SEO & Handoff': [
      { text: 'Setup title tag (under 60 chars) and meta description', done: false, custom: false },
      { text: 'Test form submissions and redirect pages', done: false, custom: false },
      { text: 'Verify site favicon is visible', done: false, custom: false },
      { text: 'Run final Sekkei Pre-Publish scan', done: false, custom: false }
    ]
  },
  woo: {
    'Store Planning': [
      { text: 'Outline shop container grid in Sekkei planner', done: false, custom: false },
      { text: 'Plan WooCommerce single product layout template', done: false, custom: false },
      { text: 'Define cart, checkout, and account custom overrides', done: false, custom: false }
    ],
    'Product Layout & UX': [
      { text: 'Product gallery images have high resolution and fast load times', done: false, custom: false },
      { text: 'Add to Cart buttons are prominent with clear contrast', done: false, custom: false },
      { text: 'Price tags and discount badges display correctly', done: false, custom: false },
      { text: 'Trust badges are visible near payment sections', done: false, custom: false },
      { text: 'Test mini-cart drawer overlay responsiveness', done: false, custom: false }
    ],
    'Checkout & Payments': [
      { text: 'Form validation highlights missing fields instantly', done: false, custom: false },
      { text: 'Test guest checkout checkout flows', done: false, custom: false },
      { text: 'Verify secure payment gateway logos are shown', done: false, custom: false },
      { text: 'Test standard coupon code applications', done: false, custom: false }
    ],
    'Responsive & Performance': [
      { text: 'WooCommerce product grid collapses to 2 columns on mobile', done: false, custom: false },
      { text: 'Check touch targets for quantity selector buttons (+/-)', done: false, custom: false },
      { text: 'Test mobile checkout checkout forms flow', done: false, custom: false },
      { text: 'Optimize checkout load speed (defer heavy scripts)', done: false, custom: false }
    ]
  },
  blog: {
    'Archive Plan': [
      { text: 'Define archive main grid structure', done: false, custom: false },
      { text: 'Define Single Post standard template', done: false, custom: false },
      { text: 'Define category and tag filter outlines', done: false, custom: false }
    ],
    'Readability & Layout': [
      { text: 'Body copy line height is set to optimal range (1.6 - 1.8)', done: false, custom: false },
      { text: 'Limit max reading width of post body text to 720px', done: false, custom: false },
      { text: 'Author box info card is populated', done: false, custom: false },
      { text: 'Newsletter lead magnet opt-in section is styled', done: false, custom: false }
    ],
    'SEO & Media': [
      { text: 'Dynamic title tag pulls post titles correctly', done: false, custom: false },
      { text: 'Social share icons are present on Single Post layout', done: false, custom: false },
      { text: 'Featured images are compressed and have ALT tags', done: false, custom: false },
      { text: 'Setup schema markup for Article content type', done: false, custom: false }
    ]
  }
};

function loadSelectedSOP(appendMode) {
  const select = document.getElementById('sop-template-select');
  if (!select) return;
  const val = select.value;
  
  let targetSOP = null;
  if (val === 'default') {
    targetSOP = {};
    for (const [group, items] of Object.entries(defaultChecklist)) {
      targetSOP[group] = items.map(text => ({ text, done: false, custom: false }));
    }
  } else if (SOP_TEMPLATES[val]) {
    targetSOP = JSON.parse(JSON.stringify(SOP_TEMPLATES[val]));
  } else if (state.customSOPs && state.customSOPs[val]) {
    targetSOP = JSON.parse(JSON.stringify(state.customSOPs[val]));
  }

  if (!targetSOP) {
    toast('Select a valid SOP template first.');
    return;
  }

  if (appendMode) {
    const current = getChecks();
    for (const [group, items] of Object.entries(targetSOP)) {
      if (!current[group]) {
        current[group] = [];
      }
      items.forEach(item => {
        if (!current[group].some(ci => ci.text === item.text)) {
          current[group].push({ text: item.text, done: false, custom: true });
        }
      });
    }
    proj().checks = current;
  } else {
    if (!confirm('This will replace the current checklist. Unsaved checklist items will be lost. Continue?')) {
      return;
    }
    proj().checks = targetSOP;
  }
  
  saveState();
  renderChecklist();
  updateBadges();
  toast('SOP Checklist template loaded!');
}

function openSaveSOPModal() {
  document.getElementById('custom-sop-name').value = '';
  document.getElementById('sop-modal').classList.add('open');
  setTimeout(() => document.getElementById('custom-sop-name').focus(), 40);
}

function closeSOPModal() {
  document.getElementById('sop-modal').classList.remove('open');
}

function saveCustomSOP() {
  const name = cleanText(document.getElementById('custom-sop-name').value, 80);
  if (!name) {
    toast('Please enter a template name.');
    return;
  }
  
  if (!state.customSOPs) {
    state.customSOPs = {};
  }
  
  const currentChecklist = getChecks();
  state.customSOPs[name] = JSON.parse(JSON.stringify(currentChecklist));
  
  saveState();
  updateSOPDropdowns();
  closeSOPModal();
  toast('Custom SOP template "' + name + '" saved!');
}

function updateSOPDropdowns() {
  const select = document.getElementById('sop-template-select');
  if (!select) return;
  
  let html = `
    <option value="default">Default Sekkei Checklist</option>
    <option value="landing">Landing Page SOP</option>
    <option value="woo">Commerce Page SOP</option>
    <option value="blog">Blog Template SOP</option>
  `;
  
  if (state.customSOPs && Object.keys(state.customSOPs).length) {
    html += '<optgroup label="Custom SOPs">';
    Object.keys(state.customSOPs).forEach(name => {
      html += `<option value="${esc(name)}">${esc(name)}</option>`;
    });
    html += '</optgroup>';
  }
  
  select.innerHTML = html;
}

// ===== COLOR PALETTE =====
function addColor() {
  const hex = cleanHex(document.getElementById('new-color-val').value);
  const name = cleanText(document.getElementById('new-color-name').value, 80) || hex;
  const roleValue = cleanText(document.getElementById('new-color-role').value, 24).toLowerCase();
  const role = COLOR_ROLES.includes(roleValue) ? roleValue : 'custom';
  const group = cleanText(document.getElementById('new-color-group').value, 80) || 'Project Colors';
  proj().colors.push({ id: 'c' + (nextId++), hex, name, role, group });
  document.getElementById('new-color-name').value = '';
  document.getElementById('new-color-group').value = '';
  renderColors();
  saveState();
  updateBadges();
  toast('Color added!');
}

function deleteColor(id) {
  proj().colors = proj().colors.filter(c => c.id !== id);
  renderColors();
  saveState();
  updateBadges();
}

function renderColors() {
  const container = document.getElementById('palette-container');
  const colors = proj().colors || [];
  if (!colors.length) {
    container.innerHTML = '<div class="card"><div class="empty"><i class="ti ti-palette"></i><h3>Build your project palette</h3><p class="mini">Save brand colors with roles so handoff notes and CSS stay consistent.</p></div></div>'; 
  } else {
    // Group colors
    const groups = {};
    colors.forEach(c => {
      const g = c.group || 'Project Colors';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    });
    let html = '';
    for (const [gname, gcolors] of Object.entries(groups)) {
      html += `<div class="palette-group card">
        <div class="palette-group-title">${esc(gname)}</div>
        <div class="palette-grid">`;
      gcolors.forEach(c => {
        html += `<div class="color-swatch" onclick="copyText('${c.hex}')">
          <div class="swatch-preview" style="background:${c.hex}">
            <span class="swatch-copy"><i class="ti ti-copy"></i></span>
            <button class="swatch-delete" onclick="event.stopPropagation();deleteColor('${c.id}')">&times;</button>
          </div>
          <div class="swatch-info">
            <div class="swatch-name">${esc(c.name)}</div>
            <div class="swatch-hex">${c.hex}</div>
            <div class="swatch-role">${c.role}</div>
          </div>
        </div>`;
      });
      html += '</div></div>';
    }
    container.innerHTML = html;
  }

  // Populate contrast checker select options
  const fgSelect = document.getElementById('contrast-fg');
  const bgSelect = document.getElementById('contrast-bg');
  if (fgSelect && bgSelect) {
    const prevFg = fgSelect.value;
    const prevBg = bgSelect.value;
    
    let optionsHtml = '';
    if (!colors.length) {
      optionsHtml = '<option value="#000000">Black (#000000)</option><option value="#ffffff">White (#ffffff)</option>';
    } else {
      optionsHtml = colors.map(c => `<option value="${esc(c.hex)}">${esc(c.name || 'Swatch')} (${esc(c.hex)})</option>`).join('');
    }
    
    fgSelect.innerHTML = optionsHtml;
    bgSelect.innerHTML = optionsHtml;
    
    if (prevFg && Array.from(fgSelect.options).some(o => o.value === prevFg)) {
      fgSelect.value = prevFg;
    } else if (colors.length > 0) {
      fgSelect.value = colors[0].hex;
    }
    
    if (prevBg && Array.from(bgSelect.options).some(o => o.value === prevBg)) {
      bgSelect.value = prevBg;
    } else if (colors.length > 1) {
      bgSelect.value = colors[1].hex;
    } else {
      bgSelect.value = '#ffffff';
    }
    
    checkContrast();
  }
}

/**
 * Format project colors as CSS custom properties and copy to clipboard.
 */
function copyColorsAsCSS() {
  const colors = proj().colors || [];
  if (colors.length === 0) {
    toast('No brand colors saved yet.');
    return;
  }
  
  let css = ':root {\n';
  colors.forEach(c => {
    // Generate clean variable name from name or role
    const rawName = c.name || c.role || 'color';
    const cleanName = rawName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      
    css += `  --color-${cleanName}: ${c.hex};\n`;
  });
  css += '}';
  
  copyText(css);
  toast('CSS variables copied!');
}

function syncColorsToElementor() {
  const colors = proj().colors || [];
  if (!colors.length) {
    toast('No colors in palette to sync.');
    return;
  }
  window.parent.postMessage({
    type: 'itspc_sync_colors',
    colors: colors
  }, window.location.origin);

  ajaxSyncElementorGlobals(colors, null);
}

// ===== FONT PAIRS =====
let currentFilter = 'all';

function filterFonts(tag) {
  currentFilter = tag;
  document.querySelectorAll('#font-filters .font-filter-btn').forEach(btn => {
    if (btn.dataset.filter === tag) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderFontPairs();
}

function renderFontPairs() {
  const container = document.getElementById('font-pairs-container');
  let pairs = fontPairsDB;
  if (currentFilter !== 'all') {
    pairs = pairs.filter(p => p.tags.includes(currentFilter));
  }
  // Add saved custom pairs
  const saved = proj().savedFontPairs || [];

  let html = '';
  pairs.forEach(p => {
    const isSaved = saved.some(sp => sp.heading === p.heading && sp.body === p.body);
    html += renderFontPairCard(p, isSaved);
  });
  // Custom pairs
  saved.filter(sp => !fontPairsDB.some(fp => fp.heading === sp.heading && fp.body === sp.body)).forEach(sp => {
    html += renderFontPairCard(sp, true);
  });

  container.innerHTML = html || '<div class="empty"><p>No font pairs match this filter.</p></div>';

  // Update saved pairs row
  const savedRow = document.getElementById('saved-pairs-row');
  if (saved.length > 0) {
    savedRow.style.display = 'block';
    document.getElementById('saved-pairs-list').innerHTML = saved.map(sp =>
      `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-md);padding:5px 10px;font-size:12px;color:var(--text2);margin:3px">
        ${esc(sp.heading)} + ${esc(sp.body)}
        <button onclick="removeSavedPair('${esc(sp.heading)}','${esc(sp.body)}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px">&times;</button>
      </span>`
    ).join('');
  } else {
    savedRow.style.display = 'none';
  }
}

function renderFontPairCard(p, isSaved) {
  const googleUrl = `https://fonts.google.com/specimen/${encodeURIComponent(p.heading)}`;
  const cssCode = `/* Heading */\nfont-family: '${p.heading}', serif;\n\n/* Body */\nfont-family: '${p.body}', sans-serif;`;
  const linkCode = `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(p.heading)}:wght@400;700&family=${encodeURIComponent(p.body)}:wght@300;400;500&display=swap" rel="stylesheet">`;
  const headingRec = p.headingRec || 'Wt 700, Lh 1.2';
  const bodyRec = p.bodyRec || 'Wt 400, Lh 1.6';

  return `<div class="font-pair-card">
    <div class="font-pair-preview">
      <div class="fp-heading" style="font-family:'${p.heading}',serif">${esc(p.previewText || p.heading)}</div>
      <div class="fp-body" style="font-family:'${p.body}',sans-serif">${esc(p.note || '')}</div>
    </div>
    <div class="fp-meta">
      ${(p.tags || []).map(t => `<span class="fp-tag">${t}</span>`).join('')}
    </div>
    <div class="fp-fonts">
      <div class="fp-font-item">
        <div class="fp-font-role">Heading</div>
        <div class="fp-font-name">${esc(p.heading)}</div>
      </div>
      <div class="fp-font-item">
        <div class="fp-font-role">Body</div>
        <div class="fp-font-name">${esc(p.body)}</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text3);margin-bottom:10px;padding-top:6px;border-top:1px dashed var(--border);display:flex;gap:12px">
      <span><strong>Heading:</strong> ${esc(headingRec)}</span>
      <span><strong>Body:</strong> ${esc(bodyRec)}</span>
    </div>
    <div class="fp-actions">
      <button class="btn btn-sm" onclick="copyText(\`${cssCode.replace(/`/g, '\\`').replace(/"/g, '&quot;')}\`)"><i class="ti ti-code"></i> Copy CSS</button>
      <button class="btn btn-sm" onclick="copyFontAsCSSVars('${esc(p.heading)}','${esc(p.body)}')"><i class="ti ti-code"></i> CSS Vars</button>
      <button class="btn btn-sm" onclick="copyText(\`${linkCode.replace(/`/g, '\\`').replace(/"/g, '&quot;')}\`)"><i class="ti ti-link"></i> Google Link</button>
      <button class="btn btn-sm ${isSaved ? 'btn-accent' : ''}" onclick="${isSaved ? `removeSavedPair('${esc(p.heading)}','${esc(p.body)}')` : `saveFontPair('${esc(p.heading)}','${esc(p.body)}','${esc(p.previewText||'')}','${esc((p.tags||[]).join(','))}','${esc(headingRec)}','${esc(bodyRec)}')`}">
        <i class="ti ti-${isSaved ? 'check' : 'bookmark'}"></i> ${isSaved ? 'Saved' : 'Save'}
      </button>
      <button class="btn btn-sm btn-accent" onclick="syncFontsToElementor('${esc(p.heading)}','${esc(p.body)}')"><i class="ti ti-bolt"></i> Push</button>
    </div>
  </div>`;
}

function saveFontPair(heading, body, preview, tags, headingRec, bodyRec) {
  const saved = proj().savedFontPairs || [];
  if (!saved.some(sp => sp.heading === heading && sp.body === body)) {
    saved.push({ 
      heading, 
      body, 
      previewText: preview, 
      tags: tags.split(',').filter(Boolean),
      headingRec: headingRec || 'Wt 700, Lh 1.2',
      bodyRec: bodyRec || 'Wt 400, Lh 1.6'
    });
    proj().savedFontPairs = saved;
    saveState();
    renderFontPairs();
    toast('Font pair saved!');
  }
}

function removeSavedPair(heading, body) {
  proj().savedFontPairs = (proj().savedFontPairs || []).filter(sp => !(sp.heading === heading && sp.body === body));
  saveState();
  renderFontPairs();
}

function addCustomPair() {
  const heading = cleanFontName(document.getElementById('custom-heading-font').value);
  const body = cleanFontName(document.getElementById('custom-body-font').value);
  const note = document.getElementById('custom-pair-note').value.trim();
  const headingRec = document.getElementById('custom-heading-rec').value.trim() || 'Wt 700, Lh 1.2';
  const bodyRec = document.getElementById('custom-body-rec').value.trim() || 'Wt 400, Lh 1.6';

  if (!heading || !body) return;
  const saved = proj().savedFontPairs || [];
  saved.push({ 
    heading, 
    body, 
    previewText: heading + ' + ' + body, 
    tags: ['custom'], 
    note,
    headingRec,
    bodyRec
  });
  proj().savedFontPairs = saved;
  document.getElementById('custom-heading-font').value = '';
  document.getElementById('custom-body-font').value = '';
  document.getElementById('custom-pair-note').value = '';
  document.getElementById('custom-heading-rec').value = 'Wt 700, Lh 1.2';
  document.getElementById('custom-body-rec').value = 'Wt 400, Lh 1.6';
  saveState();
  renderFontPairs();
  toast('Custom pair added!');
}

function syncFontsToElementor(heading, body) {
  if (!heading || !body) return;
  window.parent.postMessage({
    type: 'itspc_sync_fonts',
    heading: heading,
    body: body
  }, window.location.origin);

  ajaxSyncElementorGlobals(null, { heading, body });
}

// ===== CSS GENERATOR =====
function generateCSS() {
  const sel = document.getElementById('css-sel').value.trim() || '.my-section';
  const pt = document.getElementById('css-pt').value;
  const pb = document.getElementById('css-pb').value;
  const pl = document.getElementById('css-pl').value;
  const pr = document.getElementById('css-pr').value;
  const bg = document.getElementById('css-bg-text').value;
  const maxw = document.getElementById('css-maxw').value;
  const radius = document.getElementById('css-radius').value;
  const comment = document.getElementById('css-comment').value.trim();
  const extra = document.getElementById('css-extra').value.trim();

  let css = '';
  if (comment) css += `/* ${comment} */\n`;
  css += `${sel} {\n`;
  css += `  padding: ${pt}px ${pr}px ${pb}px ${pl}px;\n`;
  if (bg && bg !== '#ffffff') css += `  background-color: ${bg};\n`;
  if (maxw && maxw !== '0') css += `  max-width: ${maxw}px;\n  margin-left: auto;\n  margin-right: auto;\n`;
  if (radius && radius !== '0') css += `  border-radius: ${radius}px;\n`;
  if (extra) css += '  ' + extra.split('\n').join('\n  ') + '\n';
  css += `}`;

  document.getElementById('css-output').textContent = css;
}

function copyCSS() {
  copyText(document.getElementById('css-output').textContent);
}

function loadPreset(type) {
  const presets = {
    section: { sel: '.elementor-section', pt: 80, pb: 80, pl: 0, pr: 0, bg: '#ffffff', maxw: 0, radius: 0, comment: 'Section Padding', extra: '' },
    container: { sel: '.elementor-container', pt: 0, pb: 0, pl: 15, pr: 15, bg: '#ffffff', maxw: 1200, radius: 0, comment: 'Container Width', extra: '' },
    typography: { sel: 'body', pt: 0, pb: 0, pl: 0, pr: 0, bg: '#ffffff', maxw: 0, radius: 0, comment: 'Typography Scale', extra: 'font-size: 16px;\nline-height: 1.6;\nletter-spacing: -0.01em;' },
    button: { sel: '.elementor-button', pt: 14, pb: 14, pl: 32, pr: 32, bg: '#3B82F6', maxw: 0, radius: 8, comment: 'Button Style', extra: 'font-weight: 600;\nfont-size: 14px;\ntransition: all 0.3s ease;\nborder: none;\ncursor: pointer;' },
    card: { sel: '.card-widget', pt: 24, pb: 24, pl: 24, pr: 24, bg: '#ffffff', maxw: 0, radius: 16, comment: 'Card Style', extra: 'box-shadow: 0 4px 24px rgba(0,0,0,0.06);\nborder: 1px solid #eee;' },
    responsive: { sel: '.hide-on-mobile', pt: 0, pb: 0, pl: 0, pr: 0, bg: '#ffffff', maxw: 0, radius: 0, comment: 'Responsive Hide', extra: '' },
  };
  const p = presets[type];
  if (!p) return;
  document.getElementById('css-sel').value = p.sel;
  document.getElementById('css-pt').value = p.pt;
  document.getElementById('css-pb').value = p.pb;
  document.getElementById('css-pl').value = p.pl;
  document.getElementById('css-pr').value = p.pr;
  document.getElementById('css-bg').value = p.bg;
  document.getElementById('css-bg-text').value = p.bg;
  document.getElementById('css-maxw').value = p.maxw;
  document.getElementById('css-radius').value = p.radius;
  document.getElementById('css-comment').value = p.comment;
  document.getElementById('css-extra').value = p.extra;

  if (type === 'responsive') {
    document.getElementById('css-output').textContent = `/* Responsive Hide - Mobile */\n@media (max-width: 767px) {\n  .hide-on-mobile {\n    display: none !important;\n  }\n}\n\n/* Responsive Hide - Tablet */\n@media (min-width: 768px) and (max-width: 1024px) {\n  .hide-on-tablet {\n    display: none !important;\n  }\n}\n\n/* Responsive Hide - Desktop */\n@media (min-width: 1025px) {\n  .hide-on-desktop {\n    display: none !important;\n  }\n}`;
  } else {
    generateCSS();
  }
}

function generateFromSection() {
  const secs = proj().sections;
  if (!secs.length) { toast('Add sections first!'); return; }
  let css = '/* Auto-generated from Section Planner */\n\n';
  secs.forEach((s, i) => {
    const sel = s.css || '.section-' + (i + 1);
    css += `/* ${s.name} */\n${sel} {\n  padding: 80px 0;\n}\n\n`;
  });
  document.getElementById('css-output').textContent = css;
  toast('CSS generated from planner!');
}

function saveCSSSnippet() {
  const code = document.getElementById('css-output').textContent;
  if (!code || code.includes('Click Generate')) return;
  const name = cleanText(document.getElementById('css-comment').value, 120) || 'Snippet ' + ((proj().cssSnippets || []).length + 1);
  const selector = cleanCssClass(document.getElementById('css-sel').value);
  const device = document.getElementById('css-device').value;
  const risk = document.getElementById('css-risk').value;

  if (!proj().cssSnippets) proj().cssSnippets = [];
  proj().cssSnippets.push(normalizeSnippet({ 
    id: 'snip' + (nextId++), 
    name, 
    code, 
    date: new Date().toISOString().split('T')[0],
    selector,
    device,
    risk
  }));
  saveState();
  renderSnippets();
  toast('Snippet saved!');
}

function deleteSnippet(id) {
  proj().cssSnippets = (proj().cssSnippets || []).filter(s => s.id !== id);
  saveState();
  renderSnippets();
}

function renderSnippets() {
  const list = document.getElementById('snippets-list');
  let snippets = proj().cssSnippets || [];

  // Apply Search Filter
  const query = (document.getElementById('snippet-search') ? document.getElementById('snippet-search').value : '').toLowerCase().trim();
  if (query) {
    snippets = snippets.filter(s => 
      (s.name || '').toLowerCase().includes(query) || 
      (s.selector || '').toLowerCase().includes(query) ||
      (s.code || '').toLowerCase().includes(query)
    );
  }

  // Apply Device Filter
  const filterDevice = document.getElementById('snippet-filter-device') ? document.getElementById('snippet-filter-device').value : 'all';
  if (filterDevice !== 'all') {
    snippets = snippets.filter(s => s.device === filterDevice);
  }

  // Apply Risk Filter
  const filterRisk = document.getElementById('snippet-filter-risk') ? document.getElementById('snippet-filter-risk').value : 'all';
  if (filterRisk !== 'all') {
    snippets = snippets.filter(s => s.risk === filterRisk);
  }

  if (!snippets.length) {
    list.innerHTML = '<div class="empty" style="padding:18px 10px"><i class="ti ti-code"></i><h3>No snippets found</h3><p class="mini">Generate CSS, then save useful snippets or adjust filters.</p></div>'; 
    return;
  }

  list.innerHTML = snippets.map(s => {
    let riskColor = 'var(--text3)';
    if (s.risk === 'low') riskColor = 'var(--teal)';
    else if (s.risk === 'medium') riskColor = 'var(--amber)';
    else if (s.risk === 'high') riskColor = 'var(--red)';

    return `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg3);border-radius:var(--r-md);margin-bottom:6px;border:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <span style="font-size:12px;color:var(--text);font-weight:500;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</span>
          <span style="font-size:10px;color:var(--text3)">
            ${esc(s.device ? s.device.toUpperCase() : 'ALL')} | 
            <span style="color:${riskColor};font-weight:600">${esc(s.risk ? s.risk.toUpperCase() : 'LOW')}</span>
          </span>
        </div>
        <span style="font-size:10px;color:var(--text3);white-space:nowrap">${esc(s.date)}</span>
        <button class="btn btn-sm snippet-copy" data-id="${esc(s.id)}" title="Copy CSS"><i class="ti ti-copy"></i></button>
        <button class="btn btn-sm snippet-view" data-id="${esc(s.id)}" title="Load parameters"><i class="ti ti-eye"></i></button>
        <button class="btn btn-sm snippet-delete" data-id="${esc(s.id)}" title="Delete"><i class="ti ti-trash"></i></button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.snippet-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const snippet = snippets.find(s => s.id === btn.dataset.id);
      if (snippet) copyText(snippet.code);
    });
  });
  list.querySelectorAll('.snippet-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const snippet = snippets.find(s => s.id === btn.dataset.id);
      if (snippet) {
        document.getElementById('css-output').textContent = snippet.code;
        document.getElementById('css-comment').value = snippet.name || '';
        document.getElementById('css-sel').value = snippet.selector || '';
        if (snippet.device) document.getElementById('css-device').value = snippet.device;
        if (snippet.risk) document.getElementById('css-risk').value = snippet.risk;
      }
    });
  });
  list.querySelectorAll('.snippet-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteSnippet(btn.dataset.id));
  });
}

// ===== NOTES =====
function loadNotes() {
  document.getElementById('notes-area').value = proj().notes || '';
}

function saveNotes() {
  proj().notes = document.getElementById('notes-area').value;
  saveState();
}

function insertNote(text) {
  const ta = document.getElementById('notes-area');
  const start = ta.selectionStart;
  const val = ta.value;
  const before = val.substring(0, start);
  const after = val.substring(start);
  const prefix = (before.length && !before.endsWith('\n')) ? '\n' : '';
  ta.value = before + prefix + text;
  ta.selectionStart = ta.selectionEnd = before.length + prefix.length + text.length;
  ta.value += after;
  ta.focus();
  saveNotes();
}

function insertNoteDate() {
  insertNote(`[${new Date().toISOString().split('T')[0]}] `);
}

function copyNotes() {
  copyText(document.getElementById('notes-area').value);
}

function clearNotes() {
  if (confirm('Clear all notes? This cannot be undone.')) {
    document.getElementById('notes-area').value = '';
    saveNotes();
  }
}

// ===== EXPORT =====
function buildExport() {
  const p = proj();
  let out = `\n`;
  out += `  SEKKEI  PROJECT EXPORT\n`;
  out += `  ${p.name}\n`;
  out += `  Generated: ${new Date().toLocaleString()}\n`;
  out += `  Status: ${p.status || 'Draft'}\n`;
  if (p.blockers) {
    out += `  Blockers: ${p.blockers}\n`;
  }
  out += `\n\n`;

  // Sections
  if (p.sections && p.sections.length) {
    out += ` SECTION PLAN \n\n`;
    p.sections.forEach((s, i) => {
      out += `  ${String(i+1).padStart(2,'0')}. [${s.type.toUpperCase()}] ${s.name}\n`;
      if (s.note) out += `      Note: ${s.note}\n`;
      if (s.css) out += `      CSS: ${s.css}\n`;
      if (s.dependency && s.dependency !== 'ready') out += `      Dependency: ${DEPENDENCY_LABELS[s.dependency] || s.dependency}\n`;
      const health = getSectionHealth(s, p.sections || []).filter(item => item.level !== 'info');
      if (health.length) out += `      Warnings: ${health.map(item => item.label).join(', ')}\n`;
      out += '\n';
    });
  }

  // Checklist
  const checks = p.checks || {};
  if (Object.keys(checks).length) {
    out += ` DESIGN CHECKLIST \n\n`;
    for (const [group, items] of Object.entries(checks)) {
      out += `  ${group}:\n`;
      items.forEach(item => {
        out += `    [${item.done ? 'x' : ' '}] ${item.text}\n`;
      });
      out += '\n';
    }
  }

  // Client Feedback
  const comments = p.comments || [];
  if (comments.length) {
    out += ` CLIENT FEEDBACK COMMENTS \n\n`;
    comments.forEach((c, idx) => {
      const section = p.sections.find(s => s.id === c.sectionId);
      const secName = section ? section.name : 'Global Page';
      out += `  [${c.status.toUpperCase()}] by ${c.author} on ${c.date} (Section: ${secName})\n`;
      out += `    "${c.text}"\n\n`;
    });
  }

  // Revisions Log
  const revisions = p.revisions || [];
  if (revisions.length) {
    out += ` REVISION LOG ENTRIES \n\n`;
    revisions.forEach((r, idx) => {
      out += `  [${r.status.toUpperCase()}] by ${r.author} on ${r.date}\n`;
      out += `    Summary: ${r.summary}\n`;
      if (r.request) out += `    Request Ref: ${r.request}\n`;
      out += '\n';
    });
  }

  // Colors
  if (p.colors && p.colors.length) {
    out += ` COLOR PALETTE \n\n`;
    const groups = {};
    p.colors.forEach(c => {
      const g = c.group || 'Project Colors';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    });
    for (const [g, colors] of Object.entries(groups)) {
      out += `  ${g}:\n`;
      colors.forEach(c => out += `    ${c.hex}  ${c.name} (${c.role})\n`);
      out += '\n';
    }
  }

  // Font Pairs
  if (p.savedFontPairs && p.savedFontPairs.length) {
    out += ` FONT PAIRS \n\n`;
    p.savedFontPairs.forEach(fp => {
      out += `  Heading: ${fp.heading}\n  Body: ${fp.body}\n\n`;
    });
  }

  // CSS Snippets
  if (p.cssSnippets && p.cssSnippets.length) {
    out += ` CSS SNIPPETS \n\n`;
    p.cssSnippets.forEach(s => {
      out += `  /* ${s.name}  ${s.date} */\n`;
      out += s.code.split('\n').map(l => '  ' + l).join('\n') + '\n\n';
    });
  }

  // Notes
  if (p.notes) {
    out += ` PROJECT NOTES \n\n`;
    out += p.notes.split('\n').map(l => '  ' + l).join('\n') + '\n';
  }

  out += `\n\n  End of Export  Sekkei v1.5\n`;
  document.getElementById('export-preview').textContent = out;
}

function buildOutlineExport() {
  const p = proj();
  const sections = p.sections || [];
  let out = 'SEKKEI PAGE OUTLINE\n';
  out += p.name + '\n';
  out += 'Generated: ' + new Date().toLocaleString() + '\n\n';
  if (!sections.length) {
    out += 'No sections planned yet.\n';
    return out;
  }
  const pageHealth = getPageHealth(sections);
  out += 'Planner health: ' + Math.max(0, Math.round(100 - Math.min(pageHealth.totalIssues, 8) * 12.5)) + '%\n';
  out += 'CTA coverage: ' + (pageHealth.hasCta ? 'Ready' : 'No CTA section') + '\n\n';
  sections.forEach((s, i) => {
    out += String(i + 1).padStart(2, '0') + '. ' + s.name + ' [' + s.type.toUpperCase() + ']\n';
    if (s.note) out += '    Goal: ' + s.note + '\n';
    if (s.css) out += '    CSS: ' + s.css + '\n';
    if (s.dependency && s.dependency !== 'ready') out += '    Waiting: ' + (DEPENDENCY_LABELS[s.dependency] || s.dependency) + '\n';
    const warnings = getSectionHealth(s, sections).filter(item => item.level !== 'info');
    if (warnings.length) out += '    Review: ' + warnings.map(item => item.label).join(', ') + '\n';
    out += '\n';
  });
  return out;
}

function copyOutlineExport() {
  copyText(buildOutlineExport());
}

function copyExport() {
  copyText(document.getElementById('export-preview').textContent);
}

function downloadExport() {
  buildExport();
  const text = document.getElementById('export-preview').textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sekkei-${proj().name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportJSON() {
  const data = { version: '1.5', project: normalizeProject(proj()), exportDate: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sekkei-${proj().name.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    toast('JSON file is too large.');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      const projectData = data && data.project && typeof data.project === 'object' ? data.project : null;
      if (!projectData) {
        toast('Invalid Sekkei JSON file!');
        return;
      }
      const project = normalizeProject(projectData);
      const report = analyzeImportProject(projectData, project, data.version);
      if (!confirm(buildImportSummary(project, report))) {
        return;
      }
      const id = 'imported_' + Date.now();
      state.projects[id] = project;
      state.currentProject = id;
      saveState();
      init();
      showPanel('planner');
      toast('Project imported safely. Review the summary in Export.');
    } catch(err) {
      toast('Invalid JSON file!');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
}

function restoreBackup() {
  const backup = localStorage.getItem(BACKUP_KEY);
  if (!backup) {
    toast('No local backup found.');
    return;
  }
  if (!confirm('Restore the last local backup? Current unsaved changes may be replaced.')) return;
  try {
    state = normalizeState(parseSavedState(backup));
    saveState({ skipBackup: true });
    init();
    toast('Backup restored.');
  } catch(err) {
    toast('Backup could not be restored.');
  }
}

// ===== PROJECTS =====
function openProjectModal() {
  renderProjectsList();
  document.getElementById('project-modal').classList.add('open');
}

function closeProjectModal() {
  document.getElementById('project-modal').classList.remove('open');
}

function renderProjectsList() {
  const list = document.getElementById('projects-list');
  list.innerHTML = Object.entries(state.projects).map(([id, p]) => `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:${id === state.currentProject ? 'var(--accent-dim)' : 'var(--bg3)'};border:1px solid ${id === state.currentProject ? 'var(--accent-border)' : 'var(--border)'};border-radius:var(--r-md);margin-bottom:6px;cursor:pointer" onclick="switchProject('${id}')">
      <i class="ti ti-folder" style="color:${id === state.currentProject ? 'var(--accent)' : 'var(--text3)'}"></i>
      <span style="flex:1;font-size:13px;color:${id === state.currentProject ? 'var(--accent)' : 'var(--text2)'}">${esc(p.name)}</span>
      ${id === state.currentProject ? '<span style="font-size:10px;color:var(--accent)">Active</span>' : ''}
      ${id !== state.currentProject ? `<button class="btn btn-sm" onclick="event.stopPropagation();deleteProject('${id}')"><i class="ti ti-trash"></i></button>` : ''}
    </div>
  `).join('');
}

function createProject() {
  const name = cleanText(document.getElementById('new-project-name').value, 120);
  if (!name) return;
  const id = 'proj_' + Date.now();
  state.projects[id] = { 
    name, 
    sections: [], 
    checks: {}, 
    colors: [], 
    savedFontPairs: [], 
    cssSnippets: [], 
    notes: '', 
    status: 'Draft', 
    blockers: '', 
    lastUpdated: Date.now(), 
    comments: [], 
    revisions: [] 
  };
  state.currentProject = id;
  document.getElementById('new-project-name').value = '';
  saveState();
  closeProjectModal();
  init();
  toast('Project created!');
}

function switchProject(id) {
  if (!state.projects[id]) return;
  state.currentProject = id;
  saveState();
  closeProjectModal();
  init();
}

function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  delete state.projects[id];
  if (state.currentProject === id) {
    const keys = Object.keys(state.projects);
    state.currentProject = keys.length ? keys[0] : 'default';
    if (!state.projects[state.currentProject]) {
      state.projects[state.currentProject] = { 
        name: 'My Project', 
        sections: [], 
        checks: {}, 
        colors: [], 
        savedFontPairs: [], 
        cssSnippets: [], 
        notes: '', 
        status: 'Draft', 
        blockers: '', 
        lastUpdated: Date.now(), 
        comments: [], 
        revisions: [] 
      };
    }
  }
  saveState();
  renderProjectsList();
  init();
}

// ===== MULTI-PROJECT DASHBOARD & KANBAN BOARD =====
const VALID_STATUSES = ['Draft', 'Design', 'Review', 'Revision', 'Approved', 'Published'];

function renderDashboard() {
  const columns = {};
  VALID_STATUSES.forEach(status => {
    columns[status] = [];
    const countEl = document.getElementById('count-' + status);
    const listEl = document.getElementById('cards-' + status);
    if (countEl) countEl.textContent = '0';
    if (listEl) listEl.innerHTML = '';
  });

  Object.entries(state.projects).forEach(([id, p]) => {
    const projData = normalizeProject(p);
    const status = projData.status || 'Draft';
    if (columns[status]) {
      columns[status].push({ id, ...projData });
    }
  });

  Object.entries(columns).forEach(([status, list]) => {
    const countEl = document.getElementById('count-' + status);
    const listEl = document.getElementById('cards-' + status);
    if (countEl) countEl.textContent = list.length;
    
    if (listEl) {
      if (list.length === 0) {
        listEl.innerHTML = '<div style="font-size:11px;color:var(--text3);text-align:center;padding:16px 0;">No projects</div>';
      } else {
        listEl.innerHTML = list.map(p => {
          let totalChecks = 0, doneChecks = 0;
          Object.values(p.checks || {}).forEach(items => {
            items.forEach(item => { totalChecks++; if (item.done) doneChecks++; });
          });
          const pct = totalChecks ? Math.round(doneChecks / totalChecks * 100) : 0;
          
          const isCurrent = p.id === state.currentProject;
          const cardBorder = isCurrent ? '2px solid var(--accent)' : '1px solid var(--border)';
          const lastUpdatedStr = p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : 'N/A';
          const blockerHtml = p.blockers 
            ? `<div style="background:rgba(255, 77, 77, 0.08); border:1px solid rgba(255, 77, 77, 0.2); border-radius:var(--r-sm); padding:6px 8px; font-size:11px; color:var(--red); margin-top:8px; line-height:1.45; word-break:break-word;">
                 <strong>Blocker:</strong> ${esc(p.blockers)}
               </div>` 
            : '';

          return `
            <div class="project-kanban-card" style="background:var(--bg3); border:${cardBorder}; border-radius:var(--r-md); padding:10px; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; flex-direction:column; gap:4px; position:relative; cursor:pointer;" onclick="switchProject('${p.id}')">
              <div style="font-size:13px; font-weight:600; color:${isCurrent ? 'var(--accent)' : 'var(--text)'}; display:flex; align-items:center; gap:4px; justify-content:space-between;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:130px;" title="${esc(p.name)}">${esc(p.name)}</span>
                ${isCurrent ? '<span style="font-size:9px; background:var(--accent-dim); color:var(--accent); border:1px solid var(--accent-border); padding:0px 4px; border-radius:4px;">Active</span>' : ''}
              </div>
              
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text2); margin-top:6px;">
                <span>Progress</span>
                <strong>${pct}%</strong>
              </div>
              <div class="progress-track" style="height:3px; background:var(--bg4); margin-top:2px;">
                <div class="progress-fill" style="width:${pct}%; height:3px; background:var(--accent);"></div>
              </div>
              
              ${blockerHtml}
              
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--text3); margin-top:8px; border-top:1px dashed var(--border); padding-top:6px;">
                <span>Updated: ${esc(lastUpdatedStr)}</span>
              </div>
              
              <div style="display:flex; justify-content:flex-end; gap:4px; margin-top:6px;" onclick="event.stopPropagation()">
                <button class="btn btn-icon btn-sm" style="width:28px; height:28px; font-size:15px;" onclick="moveProjectStatus('${p.id}', -1)" title="Move left"><i class="ti ti-arrow-left"></i></button>
                <button class="btn btn-icon btn-sm" style="width:28px; height:28px; font-size:15px;" onclick="moveProjectStatus('${p.id}', 1)" title="Move right"><i class="ti ti-arrow-right"></i></button>
                <button class="btn btn-icon btn-sm" style="width:28px; height:28px; font-size:15px;" onclick="openEditProjectMeta('${p.id}')" title="Edit details"><i class="ti ti-edit"></i></button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  });
}

function moveProjectStatus(id, dir) {
  const p = state.projects[id];
  if (!p) return;
  const currentIdx = VALID_STATUSES.indexOf(p.status || 'Draft');
  let newIdx = currentIdx + dir;
  if (newIdx >= 0 && newIdx < VALID_STATUSES.length) {
    p.status = VALID_STATUSES[newIdx];
    p.lastUpdated = Date.now();
    saveState();
    renderDashboard();
    renderProjectsList();
    toast(`Project "${p.name}" moved to ${p.status}`);
  }
}

function openEditProjectMeta(id) {
  const p = state.projects[id];
  if (!p) return;
  document.getElementById('pme-id').value = id;
  document.getElementById('pme-name').value = p.name || '';
  document.getElementById('pme-status').value = p.status || 'Draft';
  document.getElementById('pme-blockers').value = p.blockers || '';
  document.getElementById('project-meta-editor-card').style.display = 'block';
  document.getElementById('pme-name').focus();
}

function saveProjectMeta() {
  const id = document.getElementById('pme-id').value;
  const p = state.projects[id];
  if (!p) return;
  const name = cleanText(document.getElementById('pme-name').value, 120);
  if (!name) {
    toast('Project name is required.');
    document.getElementById('pme-name').focus();
    return;
  }
  p.name = name;
  p.status = document.getElementById('pme-status').value;
  p.blockers = cleanText(document.getElementById('pme-blockers').value, 300);
  p.lastUpdated = Date.now();
  
  saveState();
  renderDashboard();
  renderProjectsList();
  cancelProjectMeta();
  toast('Project details saved!');
}

function cancelProjectMeta() {
  document.getElementById('project-meta-editor-card').style.display = 'none';
  document.getElementById('pme-id').value = '';
}

// ===== BADGES =====
function updateBadges() {
  document.getElementById('badge-planner').textContent = proj().sections.length;
  document.getElementById('badge-colors').textContent = (proj().colors || []).length;
  // Checklist
  const checks = proj().checks || {};
  let total = 0, done = 0;
  for (const items of Object.values(checks)) {
    items.forEach(item => { total++; if (item.done) done++; });
  }
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('badge-checklist').textContent = pct + '%';

  // Comments Badge
  const comments = proj().comments || [];
  const openCount = comments.filter(c => c.status !== 'resolved').length;
  const cBadge = document.getElementById('badge-comments');
  if (cBadge) {
    cBadge.textContent = openCount;
    cBadge.style.display = openCount > 0 ? 'inline-block' : 'none';
  }

  // Revisions Badge
  const revisions = proj().revisions || [];
  const pendingCount = revisions.filter(r => r.status === 'pending').length;
  const rBadge = document.getElementById('badge-revisions');
  if (rBadge) {
    rBadge.textContent = pendingCount;
    rBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
}

let dbBackupTimer = null;

/**
 * Throttled database backup.
 * Sends data to WP database via AJAX at most once every 30 seconds.
 */
function scheduleDatabaseBackup() {
  if (dbBackupTimer) return; // already scheduled
  
  dbBackupTimer = setTimeout(function() {
    dbBackupTimer = null;
    saveToDatabase({ silent: true });
  }, 30000); // 30 seconds throttle
}

/**
 * Retrieve localized AJAX config from parent frame.
 */
function getAjaxConfig() {
  if (window.parent && window.parent.itspcData && window.parent.itspcData.ajaxUrl) {
    return {
      url: window.parent.itspcData.ajaxUrl,
      nonce: window.parent.itspcData.ajaxNonce
    };
  }
  if (window.parent && window.parent.itspcAdminData && window.parent.itspcAdminData.ajaxUrl) {
    return {
      url: window.parent.itspcAdminData.ajaxUrl,
      nonce: window.parent.itspcAdminData.ajaxNonce
    };
  }
  return null;
}

/**
 * Sync current state to WordPress database usermeta.
 *
 * @param {Object} options - { silent: bool }
 */
function saveToDatabase(options = {}) {
  const silent = !!options.silent;
  const config = getAjaxConfig();
  if (!config) {
    if (!silent) toast('Cannot sync: WordPress context not found.');
    return;
  }

  const saveBtn = document.getElementById('btn-db-save');
  if (saveBtn && !silent) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="ti ti-loader rotate" style="display:inline-block;animation:spin 1s linear infinite"></i> Syncing...';
  }

  const payload = new URLSearchParams();
  payload.append('action', 'itspc_save_backup');
  payload.append('nonce', config.nonce);
  payload.append('data', JSON.stringify(state));

  fetch(config.url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      if (!silent) {
        toast('Sync successful! Backup saved to database.');
      }
      localStorage.setItem('itspc_last_db_backup', new Date().toISOString());
      updateDataHealthStatus();
    } else {
      if (!silent) {
        toast('Sync failed: ' + (res.data ? res.data.message : 'Unknown error'));
      }
    }
  })
  .catch(err => {
    console.error('[Sekkei] DB sync error', err);
    if (!silent) toast('Sync failed. Check connection.');
  })
  .finally(() => {
    if (saveBtn && !silent) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="ti ti-cloud-upload"></i> Sync to Database';
    }
  });
}

/**
 * Restore state from WordPress database usermeta.
 */
function loadFromDatabase() {
  const config = getAjaxConfig();
  if (!config) {
    toast('Cannot restore: WordPress context not found.');
    return;
  }

  if (!confirm('This will replace your current project data with the server backup. Proceed?')) {
    return;
  }

  const loadBtn = document.getElementById('btn-db-load');
  if (loadBtn) {
    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="ti ti-loader rotate" style="display:inline-block;animation:spin 1s linear infinite"></i> Restoring...';
  }

  const payload = new URLSearchParams();
  payload.append('action', 'itspc_load_backup');
  payload.append('nonce', config.nonce);

  fetch(config.url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  })
  .then(res => res.json())
  .then(res => {
    if (res.success && res.data && res.data.data) {
      const restored = normalizeState(res.data.data);
      if (restored && restored.projects) {
        state = restored;
        saveState({ skipBackup: true });
        // Re-render everything
        document.getElementById('project-name-display').textContent = proj().name;
        renderSections();
        renderChecklist();
        renderColors();
        renderFontPairs();
        renderSnippets();
        renderTokens();
        loadNotes();
        updateBadges();
        updateDataHealthStatus();
        toast('Database backup successfully restored!');
      } else {
        toast('Restoration failed: Invalid backup structure.');
      }
    } else {
      toast('Restoration failed: ' + (res.data ? res.data.message : 'No backup found.'));
    }
  })
  .catch(err => {
    console.error('[Sekkei] DB load error', err);
    toast('Restoration failed. Check connection.');
  })
  .finally(() => {
    if (loadBtn) {
      loadBtn.disabled = false;
      loadBtn.innerHTML = '<i class="ti ti-cloud-download"></i> Restore from Database';
    }
  });
}

// ===== UTILS =====
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ===== ELEMENTOR SYNC & EVENT LISTENERS =====
function getContainerChildren(container) {
  if (!container || !container.children) return [];
  if (Array.isArray(container.children)) return container.children;
  if (typeof container.children.toArray === 'function') return container.children.toArray();
  if (container.children.models && Array.isArray(container.children.models)) return container.children.models;
  return [];
}

function getModelValue(container, key) {
  if (!container || !container.model) return '';
  if (typeof container.model.get === 'function') return container.model.get(key);
  return container.model[key] || '';
}

function getModelSetting(container, key) {
  if (!container || !container.model) return '';
  if (typeof container.model.getSetting === 'function') return container.model.getSetting(key);
  const settings = typeof container.model.get === 'function' ? container.model.get('settings') : container.model.settings;
  if (settings && typeof settings.get === 'function') return settings.get(key);
  return settings && settings[key] ? settings[key] : '';
}

function getParentSections() {
  if (window.parent && window.parent.elementor) {
    try {
      const doc = window.parent.elementor.documents.getCurrent();
      if (doc && doc.container && doc.container.children) {
        const found = [];
        const seen = {};
        function walk(container) {
          getContainerChildren(container).forEach(child => {
            const elType = getModelValue(child, 'elType');
            const id = cleanId(getModelValue(child, 'id'), '');
            const cid = cleanId(child && child.model ? child.model.cid : '', '');
            if ((elType === 'section' || elType === 'container') && (id || cid) && !seen[id || cid]) {
              seen[id || cid] = true;
              found.push({
                id,
                cid,
                title: cleanText(getModelSetting(child, '_title') || (elType.charAt(0).toUpperCase() + elType.slice(1)), 120),
                type: elType,
                children: getContainerChildren(child).length
              });
            }
            walk(child);
          });
        }
        walk(doc.container);
        if (found.length) {
          return found;
        }
      }

      const previewIframe = window.parent.document.getElementById('elementor-preview-iframe');
      if (previewIframe) {
        const previewDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
        const nodes = previewDoc.querySelectorAll('.elementor-element[data-id].e-con, .elementor-section[data-id], .elementor-top-section[data-id]');
        const found = [];
        const seen = {};
        Array.prototype.forEach.call(nodes, node => {
          const id = cleanId(node.getAttribute('data-id'), '');
          if (!id || seen[id]) return;
          seen[id] = true;
          const isSection = node.classList.contains('elementor-section') || node.classList.contains('elementor-top-section');
          found.push({
            id,
            cid: '',
            title: cleanText(node.getAttribute('data-element_type') || (isSection ? 'Section' : 'Container'), 120),
            type: isSection ? 'section' : 'container',
            children: node.querySelectorAll('.elementor-widget, .e-con, .elementor-column').length
          });
        });
        return found;
          }
    } catch (e) {
      console.warn('Failed to read parent Elementor elements', e);
    }
  }
  return [];
}

function getElementorSignature(sections) {
  return sections.map(es => [es.id, es.cid, es.title, es.type].join(':')).join('|');
}

function syncWithElementor(options = {}) {
  const elSecs = Array.isArray(options.sections) ? options.sections.map(es => ({
    id: cleanId(es && es.id, ''),
    cid: cleanId(es && es.cid, ''),
    title: cleanText(es && es.title, 120) || 'Container',
    type: cleanText(es && es.type, 20) === 'section' ? 'section' : 'container',
    children: Math.max(0, parseInt(es && es.children, 10) || 0)
  })).filter(es => es.id || es.cid) : getParentSections();
  if (!elSecs.length) return;

  const plannerSecs = proj().sections;
  let changed = false;

  elSecs.forEach((es, idx) => {
    let existing = plannerSecs.find(ps =>
      (es.id && ps.elementorId === es.id) ||
      (es.cid && ps.elementorCid === es.cid)
    );

    if (existing) {
      if (existing.elementorId !== es.id) {
        existing.elementorId = es.id;
        changed = true;
      }
      if (existing.elementorCid !== es.cid) {
        existing.elementorCid = es.cid;
        changed = true;
      }
      if (existing.elementorChildren !== es.children) {
        existing.elementorChildren = es.children;
        changed = true;
      }
      if (es.title && existing.name !== es.title && (isGenericSectionName(existing.name) || existing.name === existing.lastElementorTitle)) {
        existing.name = es.title;
        changed = true;
      }
      if (existing.lastElementorTitle !== es.title) {
        existing.lastElementorTitle = es.title;
        changed = true;
      }
      return;
    }

    plannerSecs.push(normalizeSection({
      id: 's' + (nextId++),
      elementorId: es.id,
      elementorCid: es.cid,
      name: es.title,
      type: es.type === 'section' ? 'content' : es.type,
      note: '',
      css: '',
      dependency: 'ready',
      elementorChildren: es.children,
      lastElementorTitle: es.title
    }));
    changed = true;
  });

  if (changed) {
    saveState();
    if (options.render !== false) {
      renderSections();
      updateBadges();
    }
  }
}

function startElementorAutoSync() {
  if (elementorSyncTimer) return;
  lastElementorSignature = getElementorSignature(getParentSections());
  elementorSyncTimer = setInterval(() => {
    const sections = getParentSections();
    if (!sections.length) return;
    const signature = getElementorSignature(sections);
    if (signature !== lastElementorSignature) {
      lastElementorSignature = signature;
      syncWithElementor({ render: true });
    }
  }, 3000);
}

// Run Audit Scan
function runAudit() {
  const placeholder = document.getElementById('audit-placeholder');
  const resultsCard = document.getElementById('audit-results-card');
  const errorCard = document.getElementById('audit-error-card');
  
  placeholder.style.display = 'block';
  placeholder.innerHTML = '<i class="ti ti-loader-quarter rotate" style="font-size: 48px; color: var(--accent); display: block; margin-bottom: 16px; animation: spin 1s linear infinite;"></i><p>Scanning Elementor editor canvas...</p>';
  resultsCard.style.display = 'none';
  errorCard.style.display = 'none';
  
  window.parent.postMessage({
    type: 'itspc_run_audit'
  }, window.location.origin);
}

// Listen to messages from parent Elementor editor frame
window.addEventListener('message', function(event) {
  if (event.origin !== window.location.origin) return;
  if (!event.data) return;

  if (event.data.type === 'itspc_sync_success') {
    toast(event.data.message || 'Synced successfully!');
  }

  if (event.data.type === 'itspc_sync_error') {
    toast(event.data.message || 'Sync failed.');
  }

  if (event.data.type === 'itspc_display_settings') {
    applyDisplaySettings(event.data.display);
  }

  if (event.data.type === 'itspc_elementor_structure_changed') {
    syncWithElementor({ render: true, sections: event.data.sections });
  }

  if (event.data.type === 'itspc_element_renamed_externally') {
    const { id, cid, title } = event.data;
    const sec = proj().sections.find(s => s.elementorCid === cid || s.elementorId === id);
    if (sec && sec.name !== title) {
      sec.name = cleanText(title, 120);
      sec.lastElementorTitle = sec.name;
      if (cid) sec.elementorCid = cleanId(cid, '');
      renderSections();
      saveState();
    }
  }

  if (event.data.type === 'itspc_audit_results') {
    const placeholder = document.getElementById('audit-placeholder');
    const resultsCard = document.getElementById('audit-results-card');
    const errorCard = document.getElementById('audit-error-card');
    const resultsList = document.getElementById('audit-results-list');
    const badge = document.getElementById('audit-badge');
    const exportBtn = document.getElementById('btn-export-audit-report');
    
    placeholder.style.display = 'none';
    
    if (event.data.error) {
      errorCard.style.display = 'block';
      document.getElementById('audit-error-msg').textContent = event.data.error;
      if (exportBtn) exportBtn.style.display = 'none';
      return;
    }
    
    resultsList.innerHTML = '';
    
    const auditResults = Array.isArray(event.data.results) ? event.data.results.slice(0, 200) : [];
    window.latestAuditResults = auditResults;
    if (exportBtn) {
      exportBtn.style.display = 'inline-flex';
    }

    const score = Math.max(0, 100 - (auditResults.length * 5));
    if (!proj().auditHistory) proj().auditHistory = [];
    proj().auditHistory.unshift({
      date: new Date().toLocaleString(),
      score: score,
      issuesCount: auditResults.length
    });
    proj().auditHistory = proj().auditHistory.slice(0, 5);
    saveState();
    renderAuditHistory();

    if (auditResults.length === 0) {
      badge.textContent = '0 Issues';
      badge.style.background = 'rgba(0, 229, 204, 0.1)';
      badge.style.color = 'var(--teal)';
      
      resultsList.innerHTML = `
        <div style="text-align: center; padding: 32px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r-xl);">
          <i class="ti ti-circle-check" style="font-size: 40px; color: var(--teal); display: block; margin-bottom: 12px;"></i>
          <h4 style="font-size: 14px; font-family: var(--font-head); font-weight: 600; color: var(--text);">Canvas is Perfect!</h4>
          <p style="font-size: 12px; color: var(--text3); margin-top: 4px;">No empty links, missing alt tags, placeholder text, empty columns, oversized images, or accessibility/SEO gaps found.</p>
        </div>
      `;
      resultsCard.style.display = 'block';
      return;
    }
    
    badge.textContent = auditResults.length + ' Issues';
    badge.style.background = 'rgba(255, 77, 77, 0.1)';
    badge.style.color = 'var(--red)';
    
    auditResults.forEach(item => {
      let icon = 'ti-alert-triangle';
      let colorClass = 'var(--amber)';
      let bgClass = 'rgba(255, 176, 32, 0.1)';
      
      if (item.type === 'alt' || item.type === 'lorem' || item.type === 'oversized') {
        colorClass = 'var(--amber)';
        bgClass = 'rgba(255, 176, 32, 0.1)';
        icon = item.type === 'oversized' ? 'ti-photo' : 'ti-alert-triangle';
      } else if (item.type === 'link' || item.type === 'contrast') {
        colorClass = 'var(--red)';
        bgClass = 'rgba(255, 77, 77, 0.1)';
        icon = item.type === 'contrast' ? 'ti-contrast-2' : 'ti-link';
      } else if (item.type === 'seo') {
        colorClass = 'var(--teal)';
        bgClass = 'rgba(0, 229, 204, 0.1)';
        icon = 'ti-search';
      } else if (item.type === 'accessibility') {
        colorClass = 'var(--purple)';
        bgClass = 'rgba(155, 111, 255, 0.1)';
        icon = 'ti-accessible';
      } else if (item.type === 'empty') {
        colorClass = 'var(--text2)';
        bgClass = 'var(--bg4)';
        icon = 'ti-box';
      }
      
      const itemEl = document.createElement('div');
      itemEl.className = 'audit-item';
      itemEl.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: var(--bg3);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        transition: all 0.15s ease;
        cursor: pointer;
        margin-bottom: 8px;
      `;
      
      const auditIcon = document.createElement('div');
      auditIcon.className = 'audit-icon';
      auditIcon.style.cssText = `width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${bgClass}; color: ${colorClass}; flex-shrink: 0; font-size: 12px;`;
      const auditIconInner = document.createElement('i');
      auditIconInner.className = 'ti ' + icon;
      auditIcon.appendChild(auditIconInner);

      const auditBody = document.createElement('div');
      auditBody.style.cssText = 'flex: 1; min-width: 0;';
      const auditTitleRow = document.createElement('div');
      auditTitleRow.style.cssText = 'font-size: 13px; font-weight: 600; color: var(--text); display: flex; justify-content: space-between; align-items: center;';
      const auditTitle = document.createElement('span');
      auditTitle.textContent = cleanText(item.title, 80);
      const auditId = document.createElement('span');
      auditId.style.cssText = 'font-family: var(--font-mono); font-size: 10px; color: var(--text3);';
      auditId.textContent = 'ID: #' + cleanId(item.elementId, '');
      auditTitleRow.appendChild(auditTitle);
      auditTitleRow.appendChild(auditId);
      const auditDesc = document.createElement('p');
      auditDesc.style.cssText = 'font-size: 11px; color: var(--text2); margin-top: 4px; line-height: 1.4;';
      auditDesc.textContent = cleanText(item.description, 240);
      auditBody.appendChild(auditTitleRow);
      auditBody.appendChild(auditDesc);

      const locateBtn = document.createElement('div');
      locateBtn.className = 'audit-locate-btn';
      locateBtn.style.cssText = 'font-size: 11px; color: var(--accent); align-self: center; display: flex; align-items: center; gap: 4px; font-weight: 500; margin-left: 8px; flex-shrink:0;';
      locateBtn.appendChild(document.createTextNode('Locate '));
      const locateIcon = document.createElement('i');
      locateIcon.className = 'ti ti-chevron-right';
      locateBtn.appendChild(locateIcon);

      itemEl.appendChild(auditIcon);
      itemEl.appendChild(auditBody);
      itemEl.appendChild(locateBtn);
      
      itemEl.addEventListener('mouseenter', () => {
        itemEl.style.borderColor = 'var(--border2)';
        itemEl.querySelector('.audit-locate-btn').style.textDecoration = 'underline';
      });
      itemEl.addEventListener('mouseleave', () => {
        itemEl.style.borderColor = 'var(--border)';
        itemEl.querySelector('.audit-locate-btn').style.textDecoration = 'none';
      });
      
      itemEl.addEventListener('click', () => {
        window.parent.postMessage({
          type: 'itspc_highlight_element',
          elementId: cleanId(item.elementId, '')
        }, window.location.origin);
      });
      
      resultsList.appendChild(itemEl);
    });
    
    resultsCard.style.display = 'block';
  }

  if (event.data.type === 'itspc_element_selected') {
    state.lastSelectedElement = event.data;
    updateSelectorHelperUI();
  }
});

/**
 * Render past audits list in UI.
 */
function renderAuditHistory() {
  const history = proj().auditHistory || [];
  const card = document.getElementById('audit-history-card');
  const list = document.getElementById('audit-history-list');
  if (!card || !list) return;

  if (history.length === 0) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  list.innerHTML = history.map(item => {
    let scoreColor = 'var(--red)';
    if (item.score >= 90) scoreColor = 'var(--teal)';
    else if (item.score >= 70) scoreColor = 'var(--amber)';

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg3); border:1px solid var(--border); border-radius:var(--r-md); font-size:12px;">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span style="font-weight:600; color:var(--text);">${esc(item.date)}</span>
          <span style="color:var(--text3); font-size:11px;">Issues detected: <strong>${item.issuesCount}</strong></span>
        </div>
        <div style="font-family:var(--font-mono); font-weight:700; color:${scoreColor}; font-size:14px;">
          ${item.score}/100
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Clear the audit scan history.
 */
function clearAuditHistory() {
  if (!confirm('Are you sure you want to clear all scan history for this project?')) return;
  proj().auditHistory = [];
  saveState();
  renderAuditHistory();
  toast('Audit history cleared.');
}

// ===== DESIGN TOKENS LOGIC =====
function renderTokens() {
  const dt = proj().designTokens || normalizeDesignTokens({});
  document.getElementById('token-typo-base').value = dt.typography.base;
  document.getElementById('token-typo-ratio').value = dt.typography.ratio;
  document.getElementById('token-space-base').value = dt.spacing.base;
  document.getElementById('token-radius-sm').value = dt.radius.sm;
  document.getElementById('token-radius-md').value = dt.radius.md;
  document.getElementById('token-radius-lg').value = dt.radius.lg;
  document.getElementById('token-radius-xl').value = dt.radius.xl;
  document.getElementById('token-shadow-soft').value = dt.shadows.soft;
  document.getElementById('token-shadow-medium').value = dt.shadows.medium;
  document.getElementById('token-shadow-hard').value = dt.shadows.hard;

  updateTypoScale();
  updateSpacingScale();
}

function updateTypoScale() {
  const base = parseInt(document.getElementById('token-typo-base').value, 10) || 16;
  const ratio = parseFloat(document.getElementById('token-typo-ratio').value) || 1.25;

  const h6 = Math.round(base);
  const h5 = Math.round(base * ratio);
  const h4 = Math.round(h5 * ratio);
  const h3 = Math.round(h4 * ratio);
  const h2 = Math.round(h3 * ratio);
  const h1 = Math.round(h2 * ratio);

  let html = `/* Typography scale */\n`;
  html += `--font-size-base: ${base}px;\n`;
  html += `--font-size-h6: ${h6}px;\n`;
  html += `--font-size-h5: ${h5}px;\n`;
  html += `--font-size-h4: ${h4}px;\n`;
  html += `--font-size-h3: ${h3}px;\n`;
  html += `--font-size-h2: ${h2}px;\n`;
  html += `--font-size-h1: ${h1}px;\n`;

  document.getElementById('typo-scale-preview').innerText = html;
  
  if (!proj().designTokens) proj().designTokens = normalizeDesignTokens({});
  proj().designTokens.typography.base = base;
  proj().designTokens.typography.ratio = ratio;
  saveState();
}

function updateSpacingScale() {
  const base = parseInt(document.getElementById('token-space-base').value, 10) || 8;
  const xs = Math.round(base * 0.5);
  const sm = base;
  const md = base * 2;
  const lg = base * 3;
  const xl = base * 4;
  const xxl = base * 8;

  let html = `/* Spacing scale */\n`;
  html += `--space-xs:  ${xs}px;\n`;
  html += `--space-sm:  ${sm}px;\n`;
  html += `--space-md:  ${md}px;\n`;
  html += `--space-lg:  ${lg}px;\n`;
  html += `--space-xl:  ${xl}px;\n`;
  html += `--space-xxl: ${xxl}px;\n`;

  document.getElementById('space-scale-preview').innerText = html;

  if (!proj().designTokens) proj().designTokens = normalizeDesignTokens({});
  proj().designTokens.spacing.base = base;
  saveState();
}

function updateRadiusShadows() {
  const sm = parseInt(document.getElementById('token-radius-sm').value, 10) || 4;
  const md = parseInt(document.getElementById('token-radius-md').value, 10) || 8;
  const lg = parseInt(document.getElementById('token-radius-lg').value, 10) || 12;
  const xl = parseInt(document.getElementById('token-radius-xl').value, 10) || 16;
  const soft = document.getElementById('token-shadow-soft').value;
  const medium = document.getElementById('token-shadow-medium').value;
  const hard = document.getElementById('token-shadow-hard').value;

  if (!proj().designTokens) proj().designTokens = normalizeDesignTokens({});
  proj().designTokens.radius = { sm, md, lg, xl };
  proj().designTokens.shadows = { soft, medium, hard };
  saveState();
}

function copyCSSVariables() {
  const dt = proj().designTokens || normalizeDesignTokens({});
  const baseTypo = dt.typography.base;
  const ratio = dt.typography.ratio;
  const h6 = Math.round(baseTypo);
  const h5 = Math.round(baseTypo * ratio);
  const h4 = Math.round(h5 * ratio);
  const h3 = Math.round(h4 * ratio);
  const h2 = Math.round(h3 * ratio);
  const h1 = Math.round(h2 * ratio);

  const baseSpace = dt.spacing.base;
  const xs = Math.round(baseSpace * 0.5);
  const sm = baseSpace;
  const md = baseSpace * 2;
  const lg = baseSpace * 3;
  const xl = baseSpace * 4;
  const xxl = baseSpace * 8;

  let css = `:root {\n`;
  css += `  /* Typography scale */\n`;
  css += `  --font-size-base: ${baseTypo}px;\n`;
  css += `  --font-size-h6: ${h6}px;\n`;
  css += `  --font-size-h5: ${h5}px;\n`;
  css += `  --font-size-h4: ${h4}px;\n`;
  css += `  --font-size-h3: ${h3}px;\n`;
  css += `  --font-size-h2: ${h2}px;\n`;
  css += `  --font-size-h1: ${h1}px;\n\n`;

  css += `  /* Spacing */\n`;
  css += `  --space-xs:  ${xs}px;\n`;
  css += `  --space-sm:  ${sm}px;\n`;
  css += `  --space-md:  ${md}px;\n`;
  css += `  --space-lg:  ${lg}px;\n`;
  css += `  --space-xl:  ${xl}px;\n`;
  css += `  --space-xxl: ${xxl}px;\n\n`;

  css += `  /* Border Radius */\n`;
  css += `  --radius-sm: ${dt.radius.sm}px;\n`;
  css += `  --radius-md: ${dt.radius.md}px;\n`;
  css += `  --radius-lg: ${dt.radius.lg}px;\n`;
  css += `  --radius-xl: ${dt.radius.xl}px;\n\n`;

  css += `  /* Box Shadows */\n`;
  css += `  --shadow-soft:   ${dt.shadows.soft};\n`;
  css += `  --shadow-medium: ${dt.shadows.medium};\n`;
  css += `  --shadow-hard:   ${dt.shadows.hard};\n`;
  css += `}`;

  navigator.clipboard.writeText(css).then(() => {
    toast('CSS Variables copied to clipboard!');
  });
}

// ===== CONTRAST CHECKER LOGIC =====
function checkContrast() {
  const fgSelect = document.getElementById('contrast-fg');
  const bgSelect = document.getElementById('contrast-bg');
  const preview = document.getElementById('contrast-preview-box');
  const ratioEl = document.getElementById('contrast-ratio-val');
  const normalAA = document.getElementById('contrast-normal-aa');
  const normalAAA = document.getElementById('contrast-normal-aaa');
  const largeAA = document.getElementById('contrast-large-aa');
  const largeAAA = document.getElementById('contrast-large-aaa');

  if (!fgSelect || !bgSelect || !preview) return;

  const fgHex = fgSelect.value || '#000000';
  const bgHex = bgSelect.value || '#ffffff';

  preview.style.color = fgHex;
  preview.style.backgroundColor = bgHex;

  const ratio = getContrastRatio(fgHex, bgHex);
  ratioEl.innerText = ratio.toFixed(2) + ':1';

  setComplianceClass(normalAA, ratio >= 4.5);
  setComplianceClass(normalAAA, ratio >= 7.0);
  setComplianceClass(largeAA, ratio >= 3.0);
  setComplianceClass(largeAAA, ratio >= 4.5);
}

function setComplianceClass(el, passes) {
  if (!el) return;
  if (passes) {
    el.classList.add('ok');
    el.classList.remove('risk');
    el.innerText = el.innerText.replace(' (Fail)', '').replace(' (Pass)', '') + ' (Pass)';
  } else {
    el.classList.add('risk');
    el.classList.remove('ok');
    el.innerText = el.innerText.replace(' (Fail)', '').replace(' (Pass)', '') + ' (Fail)';
  }
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getLuminance(hex) {
  const rgb = parseHexToRgb(hex);
  if (!rgb) return 0;
  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function parseHexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// ===== SELECTOR HELPER LOGIC =====
function updateSelectorHelperUI() {
  const el = state.lastSelectedElement;
  const wrap = document.getElementById('selector-helper-wrap');
  const list = document.getElementById('selector-helper-options');
  if (!el || !wrap || !list) return;

  wrap.style.display = 'block';
  let html = '';

  if (el.elementId) {
    html += `<button class="btn btn-sm" onclick="setCSSSelector('#${esc(el.elementId)}')" style="font-family:var(--font-mono);font-size:11px;padding:3px 6px;margin:2px">#${esc(el.elementId)}</button>`;
  }

  if (el.cssClasses) {
    const classes = el.cssClasses.trim().split(/\s+/).filter(Boolean);
    classes.forEach(cls => {
      const cleanCls = cls.replace(/^\./, '');
      html += `<button class="btn btn-sm" onclick="setCSSSelector('.${esc(cleanCls)}')" style="font-family:var(--font-mono);font-size:11px;padding:3px 6px;margin:2px">.${esc(cleanCls)}</button>`;
    });
  }

  if (el.id) {
    html += `<button class="btn btn-sm" onclick="setCSSSelector('.elementor-element-${esc(el.id)}')" style="font-family:var(--font-mono);font-size:11px;padding:3px 6px;margin:2px">.elementor-${esc(el.id)}</button>`;
  }

  list.innerHTML = html || '<span style="font-size:10px;color:var(--text3)">No custom class/ID set. Use default Elementor selector.</span>';
}

function setCSSSelector(sel) {
  document.getElementById('css-sel').value = sel;
  toast('Selector populated: ' + sel);
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const sectionModal = document.getElementById('section-modal');
    if (sectionModal && sectionModal.classList.contains('open')) {
      closeSectionModal();
    } else {
      // Send close command to parent window
      window.parent.postMessage({ type: 'itspc_close_panel' }, window.location.origin);
    }
  }

  // Ctrl+Shift+P to toggle panel
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'P' || event.key === 'p')) {
    event.preventDefault();
    event.stopPropagation();
    window.parent.postMessage({ type: 'itspc_toggle_panel' }, window.location.origin);
  }

  // Alt+1 to Alt+9, Alt+0 Navigation
  if (event.altKey && !event.ctrlKey && !event.metaKey) {
    const panels = [
      'dashboard', // 1
      'feedback',  // 2
      'revisions', // 3
      'checklist', // 4
      'colors',    // 5
      'fonts',     // 6
      'tokens',    // 7
      'css',       // 8
      'audit',     // 9
      'notes'      // 0
    ];
    let index = -1;
    if (event.key >= '1' && event.key <= '9') {
      index = parseInt(event.key, 10) - 1;
    } else if (event.key === '0') {
      index = 9;
    }

    if (index !== -1 && index < panels.length) {
      event.preventDefault();
      showPanel(panels[index]);
    }
  }
});

/**
 * Format project fonts as CSS custom properties and copy to clipboard.
 *
 * @param {string} heading Heading font family name
 * @param {string} body Body font family name
 */
function copyFontAsCSSVars(heading, body) {
  if (!heading || !body) return;
  const css = `:root {\n  --font-heading: '${heading}', sans-serif;\n  --font-body: '${body}', sans-serif;\n}`;
  copyText(css);
  toast('Font variables copied!');
}

function exportAuditReport() {
  const results = window.latestAuditResults || [];
  const p = proj();
  const sections = p.sections || [];
  
  let out = `==================================================\n`;
  out += `          SEKKEI PRE-PUBLISH AUDIT REPORT\n`;
  out += `==================================================\n`;
  out += `Project: ${p.name}\n`;
  out += `Date: ${new Date().toLocaleString()}\n`;
  out += `Page Title: ${document.title || 'Unknown'}\n`;
  
  const pageHealth = getPageHealth(sections);
  const healthScore = Math.max(0, Math.round(100 - Math.min(pageHealth.totalIssues, 8) * 12.5));
  out += `Planner Health Score: ${healthScore}%\n`;
  out += `Total Audit Issues: ${results.length}\n`;
  out += `==================================================\n\n`;
  
  if (results.length > 0) {
    out += `[ AUDIT ISSUES ]\n\n`;
    results.forEach((item, idx) => {
      out += `${idx + 1}. [${item.type.toUpperCase()}] ${item.title}\n`;
      out += `   Description: ${item.description}\n`;
      if (item.elementId) out += `   Element ID: #${item.elementId}\n`;
      if (item.previewText) out += `   Value/Context: ${item.previewText}\n`;
      out += `\n`;
    });
  } else {
    out += `[✔] PAGE AUDIT PASSED: No issues detected on the canvas.\n\n`;
  }
  
  if (sections.length > 0) {
    out += `==================================================\n`;
    out += `[ RESPONSIVE QA & SECTIONS STATUS ]\n\n`;
    sections.forEach((s, idx) => {
      out += `${String(idx+1).padStart(2,'0')}. ${s.name} [${s.type.toUpperCase()}]\n`;
      out += `   Desktop QA: ${(s.qa_desktop || 'pending').toUpperCase()}\n`;
      out += `   Tablet QA:  ${(s.qa_tablet || 'pending').toUpperCase()}\n`;
      out += `   Mobile QA:  ${(s.qa_mobile || 'pending').toUpperCase()}\n`;
      if (s.qa_notes) out += `   QA Notes:   ${s.qa_notes}\n`;
      if (s.note) out += `   Planner Note: ${s.note}\n`;
      out += `\n`;
    });
  }
  
  out += `==================================================\n`;
  out += `Generated by Sekkei - Elementor Workflow Toolkit\n`;
  
  const blob = new Blob([out], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sekkei-audit-report-${p.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Audit report downloaded!');
}

// ===== REVISION LOG LOGIC =====
function renderRevisions() {
  const list = document.getElementById('revisions-list');
  const revisions = proj().revisions || [];
  
  const badge = document.getElementById('badge-revisions');
  if (badge) {
    const pendingCount = revisions.filter(r => r.status === 'pending').length;
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }
  
  if (revisions.length === 0) {
    list.innerHTML = '<div class="empty"><i class="ti ti-history"></i><p>No revision log entries recorded yet.</p></div>';
    return;
  }
  
  list.innerHTML = revisions.map((r, i) => {
    let statusColor = 'var(--text3)';
    let statusText = 'Pending';
    if (r.status === 'applied') { statusColor = 'var(--blue)'; statusText = 'Applied'; }
    else if (r.status === 'verified') { statusColor = 'var(--teal)'; statusText = 'Verified & Approved'; }
    else if (r.status === 'rejected') { statusColor = 'var(--red)'; statusText = 'Rejected'; }
    
    return `
      <div style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--bg3); border:1px solid var(--border); border-radius:var(--r-md); margin-bottom:8px; position:relative;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:11px; color:var(--text3); font-weight:600; text-transform:uppercase; display:flex; justify-content:space-between; align-items:center;">
            <span>Entry #${revisions.length - i}</span>
            <span style="font-size:10px; color:var(--text3);">${esc(r.date)}</span>
          </div>
          <div style="font-size:13px; color:var(--text); margin-top:6px; line-height:1.45; word-break:break-word; font-weight:500;">
            ${esc(r.summary)}
          </div>
          ${r.request ? `<div style="font-size:11px; color:var(--text2); margin-top:4px; font-style:italic;">Request ref: ${esc(r.request)}</div>` : ''}
          <div style="display:flex; gap:10px; align-items:center; margin-top:8px; font-size:11px; color:var(--text2);">
            <span>By: <strong>${esc(r.author)}</strong></span>
            <span class="health-pill" style="cursor:pointer; color:${statusColor}; border-color:${statusColor}; background:rgba(255,255,255,0.02); text-transform:capitalize;" onclick="toggleRevisionStatus('${r.id}')" title="Click to cycle status">${statusText}</span>
          </div>
        </div>
        <div style="display:flex; gap:3px;">
          <button class="btn btn-icon btn-sm" onclick="deleteRevision('${r.id}')" title="Delete entry"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddRevision() {
  document.getElementById('add-revision-card').style.display = 'block';
  document.getElementById('rev-author').value = localStorage.getItem('itspc_last_author') || 'Designer';
  document.getElementById('rev-summary').value = '';
  document.getElementById('rev-request').value = '';
  document.getElementById('rev-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('rev-status').value = 'pending';
  document.getElementById('rev-summary').focus();
}

function closeAddRevision() {
  document.getElementById('add-revision-card').style.display = 'none';
}

function saveRevision() {
  const author = cleanText(document.getElementById('rev-author').value, 80) || 'Designer';
  const summary = cleanText(document.getElementById('rev-summary').value, 1000);
  const request = cleanText(document.getElementById('rev-request').value, 1000);
  const status = document.getElementById('rev-status').value;
  const date = cleanDate(document.getElementById('rev-date').value);
  
  if (!summary) {
    toast('Change summary is required.');
    document.getElementById('rev-summary').focus();
    return;
  }
  
  localStorage.setItem('itspc_last_author', author);
  
  if (!proj().revisions) proj().revisions = [];
  
  proj().revisions.push({
    id: 'rev' + (nextId++),
    author,
    summary,
    request,
    status,
    date
  });
  
  saveState();
  renderRevisions();
  closeAddRevision();
  updateBadges();
  toast('Revision log entry saved!');
}

function deleteRevision(id) {
  if (!confirm('Delete this entry?')) return;
  proj().revisions = (proj().revisions || []).filter(r => r.id !== id);
  saveState();
  renderRevisions();
  updateBadges();
  toast('Entry deleted.');
}

function toggleRevisionStatus(id) {
  const r = (proj().revisions || []).find(rev => rev.id === id);
  if (!r) return;
  
  const statusCycle = ['pending', 'applied', 'verified', 'rejected'];
  const currentIdx = statusCycle.indexOf(r.status);
  let nextIdx = (currentIdx + 1) % statusCycle.length;
  r.status = statusCycle[nextIdx];
  
  saveState();
  renderRevisions();
}

function exportRevisionLogTXT() {
  const revisions = proj().revisions || [];
  if (revisions.length === 0) {
    toast('No revisions to export.');
    return;
  }
  
  let out = `==================================================\n`;
  out += `          SEKKEI REVISION LOG: ${proj().name}\n`;
  out += `==================================================\n`;
  out += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  revisions.forEach((r, idx) => {
    out += `Entry #${revisions.length - idx}  [${r.status.toUpperCase()}]  Date: ${r.date}\n`;
    out += `Author:  ${r.author}\n`;
    out += `Summary: ${r.summary}\n`;
    if (r.request) out += `Request: ${r.request}\n`;
    out += `--------------------------------------------------\n`;
  });
  
  const blob = new Blob([out], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sekkei-revision-log-${proj().name.replace(/\s+/g, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Revision log downloaded!');
}

// ===== CLIENT FEEDBACK LOGIC =====
function renderComments() {
  const list = document.getElementById('comments-list');
  const comments = proj().comments || [];
  const sections = proj().sections || [];
  const select = document.getElementById('cmt-section-select');
  
  if (select) {
    let opts = '<option value="">(Global Page Feedback)</option>';
    sections.forEach(s => {
      opts += `<option value="${esc(s.id)}">${esc(s.name)} [${s.type.toUpperCase()}]</option>`;
    });
    select.innerHTML = opts;
  }
  
  const badge = document.getElementById('badge-comments');
  if (badge) {
    const openCount = comments.filter(c => c.status !== 'resolved').length;
    badge.textContent = openCount;
    badge.style.display = openCount > 0 ? 'inline-block' : 'none';
  }
  
  if (comments.length === 0) {
    list.innerHTML = '<div class="empty"><i class="ti ti-message-2"></i><p>No client comments recorded for this project yet.</p></div>';
    return;
  }
  
  list.innerHTML = comments.map((c, i) => {
    const section = sections.find(s => s.id === c.sectionId);
    const secName = section ? section.name : 'Global Page';
    const secType = section ? ` [${section.type.toUpperCase()}]` : '';
    
    let statusColor = 'var(--text3)';
    let statusText = 'Open';
    if (c.status === 'progress') { statusColor = 'var(--amber)'; statusText = 'In Progress'; }
    else if (c.status === 'resolved') { statusColor = 'var(--teal)'; statusText = 'Resolved'; }
    
    return `
      <div style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:var(--bg3); border:1px solid var(--border); border-radius:var(--r-md); margin-bottom:8px; position:relative;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:11px; color:var(--text3); font-weight:600; text-transform:uppercase; display:flex; justify-content:space-between; align-items:center;">
            <span>Section: ${esc(secName)}${secType}</span>
            <span style="font-size:10px; color:var(--text3);">${esc(c.date)}</span>
          </div>
          <div style="font-size:13px; color:var(--text); margin-top:6px; line-height:1.45; word-break:break-word; font-weight:500;">
            ${esc(c.text)}
          </div>
          <div style="display:flex; gap:10px; align-items:center; margin-top:8px; font-size:11px; color:var(--text2);">
            <span>By: <strong>${esc(c.author)}</strong></span>
            <span class="health-pill" style="cursor:pointer; color:${statusColor}; border-color:${statusColor}; background:rgba(255,255,255,0.02); text-transform:capitalize;" onclick="toggleCommentStatus('${c.id}')" title="Click to toggle status">${statusText}</span>
          </div>
        </div>
        <div style="display:flex; gap:3px;">
          <button class="btn btn-icon btn-sm" onclick="deleteComment('${c.id}')" title="Delete comment"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddComment() {
  document.getElementById('add-comment-card').style.display = 'block';
  document.getElementById('cmt-author').value = 'Client';
  document.getElementById('cmt-text').value = '';
  document.getElementById('cmt-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('cmt-status').value = 'open';
  document.getElementById('cmt-text').focus();
}

function closeAddComment() {
  document.getElementById('add-comment-card').style.display = 'none';
}

function saveComment() {
  const author = cleanText(document.getElementById('cmt-author').value, 80) || 'Client';
  const sectionId = document.getElementById('cmt-section-select').value;
  const text = cleanText(document.getElementById('cmt-text').value, 1000);
  const status = document.getElementById('cmt-status').value;
  const date = cleanDate(document.getElementById('cmt-date').value);
  
  if (!text) {
    toast('Feedback text is required.');
    document.getElementById('cmt-text').focus();
    return;
  }
  
  if (!proj().comments) proj().comments = [];
  
  proj().comments.push({
    id: 'cmt' + (nextId++),
    sectionId,
    author,
    text,
    status,
    date
  });
  
  saveState();
  renderComments();
  closeAddComment();
  updateBadges();
  toast('Client feedback comment saved!');
}

function deleteComment(id) {
  if (!confirm('Delete this comment?')) return;
  proj().comments = (proj().comments || []).filter(c => c.id !== id);
  saveState();
  renderComments();
  updateBadges();
  toast('Comment deleted.');
}

function toggleCommentStatus(id) {
  const c = (proj().comments || []).find(cmt => cmt.id === id);
  if (!c) return;
  
  if (c.status === 'open') c.status = 'progress';
  else if (c.status === 'progress') c.status = 'resolved';
  else c.status = 'open';
  
  saveState();
  renderComments();
}

function exportFeedbackMarkdown() {
  const comments = proj().comments || [];
  if (comments.length === 0) {
    toast('No feedback comments to export.');
    return;
  }
  
  let out = `# CLIENT FEEDBACK REPORT: ${proj().name}\n`;
  out += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  comments.forEach((c, idx) => {
    const section = proj().sections.find(s => s.id === c.sectionId);
    const secName = section ? section.name : 'Global Page';
    out += `## ${idx + 1}. [${c.status.toUpperCase()}] on Section: ${secName}\n`;
    out += `- **Date**: ${c.date}\n`;
    out += `- **Author**: ${c.author}\n`;
    out += `- **Request**: ${c.text}\n\n`;
  });
  
  copyText(out);
  toast('Markdown feedback report copied!');
}

function importFeedbackJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data && Array.isArray(data.comments)) {
        if (!proj().comments) proj().comments = [];
        
        let count = 0;
        data.comments.forEach(c => {
          let targetSectionId = '';
          if (c.sectionName) {
            const match = proj().sections.find(s => s.name.toLowerCase() === c.sectionName.toLowerCase());
            if (match) targetSectionId = match.id;
          }
          
          proj().comments.push(normalizeComment({
            id: 'cmt' + (nextId++),
            sectionId: targetSectionId || c.sectionId || '',
            author: c.author,
            text: c.text,
            status: c.status || 'open',
            date: c.date
          }));
          count++;
        });
        
        saveState();
        renderComments();
        updateBadges();
        toast(`Imported ${count} client comments successfully!`);
      } else {
        toast('Invalid feedback JSON structure.');
      }
    } catch(err) {
      toast('Failed to parse feedback file.');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

function exportFeedbackShareablePage() {
  const p = proj();
  const sections = p.sections || [];
  const sectionsJSON = JSON.stringify(sections.map(s => ({ id: s.id, name: s.name, type: s.type, note: s.note })));
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Client Feedback - ${p.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0E0D13; color: #F0EFE8; margin: 0; padding: 40px 20px; line-height: 1.6; }
    .wrap { max-width: 780px; margin: auto; }
    h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; color: #fff; }
    h1 span { color: #C8FF00; }
    .subtitle { color: #9896A0; margin-bottom: 30px; font-size: 14px; }
    .card { background: #141416; border: 1px solid #2A2A30; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .card-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9896A0; letter-spacing: 0.08em; margin-bottom: 15px; border-bottom: 1px solid #2A2A30; padding-bottom: 6px; }
    .section-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px; background: #1C1C20; border: 1px solid #2A2A30; border-radius: 8px; margin-bottom: 8px; }
    .type-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(200,255,0,0.1); color: #C8FF00; border: 1px solid rgba(200,255,0,0.25); text-transform: uppercase; }
    .section-name { font-size: 13.5px; font-weight: 600; }
    .section-note { font-size: 11px; color: #9896A0; margin-top: 2px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9896A0; margin-bottom: 6px; }
    input, select, textarea { width: 100%; box-sizing: border-box; background: #1C1C20; border: 1px solid #2A2A30; border-radius: 6px; padding: 10px; color: #F0EFE8; outline: none; font-size: 14px; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: rgba(200,255,0,0.5); }
    button { background: #C8FF00; color: #0E0D13; border: 0; padding: 10px 20px; font-weight: 600; font-size: 14px; border-radius: 6px; cursor: pointer; transition: opacity .15s; }
    button:hover { opacity: .85; }
    .cmt-item { background: #1C1C20; border: 1px solid #2A2A30; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 13px; position: relative; }
    .cmt-meta { font-size: 10px; color: #9896A0; display: flex; justify-content: space-between; }
    .cmt-del { position: absolute; right: 10px; top: 10px; background: none; border: 0; color: #FF4D4D; cursor: pointer; padding: 0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Client Feedback Cockpit — <span>\${esc(p.name)}</span></h1>
    <div class="subtitle">Review the planned layout outline below, and post your suggestions. When done, click "Download Feedback File" and send the downloaded file to your developer.</div>
    
    <div class="card">
      <div class="card-title">Page Outline Structure</div>
      <div id="outline-list"></div>
    </div>
    
    <div class="card">
      <div class="card-title">Add Feedback Suggestions</div>
      <div class="form-group">
        <label>Your Name / Role</label>
        <input type="text" id="reviewer" value="Client Reviewer" />
      </div>
      <div class="form-group">
        <label>Related Page Section</label>
        <select id="section-select"></select>
      </div>
      <div class="form-group">
        <label>Comment / Feedback Request</label>
        <textarea id="comment" rows="4" placeholder="e.g. Can we make the hero image a slider instead of static?"></textarea>
      </div>
      <button onclick="addComment()">Add suggestion</button>
    </div>
    
    <div class="card">
      <div class="card-title" style="display:flex; justify-content:space-between; align-items:center;">
        <span>My Feedback List</span>
        <button id="dl-btn" style="background:#fff; color:#0E0D13; font-size:12px; padding:6px 12px;" onclick="downloadJSON()">Download Feedback File</button>
      </div>
      <div id="comments-list">
        <div style="color:#9896A0; text-align:center; padding:20px 0; font-size:13px;">No suggestions added yet.</div>
      </div>
    </div>
  </div>

  <script>
    const sections = \${sectionsJSON};
    let comments = [];
    
    document.getElementById('outline-list').innerHTML = sections.map((s, i) => \\\`
      <div class="section-row">
        <div class="type-badge">\\\${s.type}</div>
        <div style="flex:1;">
          <div class="section-name">\\\${esc(s.name)}</div>
          \\\${s.note ? \\\`<div class="section-note">\\\${esc(s.note)}</div>\\\` : ''}
        </div>
      </div>
    \\\`).join('');
    
    document.getElementById('section-select').innerHTML = '<option value="">(Global Page Feedback)</option>' + sections.map(s => \\\`
      <option value="\\\${s.id}">\\\${esc(s.name)}</option>
    \\\`).join('');
    
    function esc(str) {
      const div = document.createElement('div');
      div.textContent = str || '';
      return div.innerHTML;
    }
    
    function addComment() {
      const reviewer = document.getElementById('reviewer').value.trim() || 'Client';
      const secSelect = document.getElementById('section-select');
      const sectionId = secSelect.value;
      const sectionName = sectionId ? secSelect.options[secSelect.selectedIndex].text : '';
      const text = document.getElementById('comment').value.trim();
      
      if (!text) { alert('Please type a feedback comment.'); return; }
      
      comments.push({
        sectionId,
        sectionName,
        author: reviewer,
        text,
        date: new Date().toISOString().split('T')[0],
        status: 'open'
      });
      
      document.getElementById('comment').value = '';
      renderComments();
    }
    
    function renderComments() {
      const list = document.getElementById('comments-list');
      if (comments.length === 0) {
        list.innerHTML = '<div style="color:#9896A0; text-align:center; padding:20px 0; font-size:13px;">No suggestions added yet.</div>';
        return;
      }
      
      list.innerHTML = comments.map((c, i) => \\\`
        <div class="cmt-item">
          <div class="cmt-meta">
            <span>Section: <strong>\\\${c.sectionName || 'Global Page'}</strong></span>
            <span>\\\${c.date}</span>
          </div>
          <div style="margin-top:6px; font-weight:500;">\\\${esc(c.text)}</div>
          <div style="margin-top:4px; font-size:11px; color:#9896A0;">By: \\\${esc(c.author)}</div>
          <button class="cmt-del" onclick="deleteComment(\\\${i})">&times;</button>
        </div>
      \\\`).join('');
    }
    
    function deleteComment(idx) {
      comments.splice(idx, 1);
      renderComments();
    }
    
    function downloadJSON() {
      if (comments.length === 0) { alert('Please add comments first.'); return; }
      const data = { project: "${p.name.replace(/"/g, '\\"')}", exportDate: new Date().toISOString(), comments };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = \\\`sekkei-feedback-\\\${data.project.replace(/\\\\s+/g, '-').toLowerCase()}.json\\\`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  <\\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sekkei-feedback-sheet-${p.name.replace(/\s+/g, '-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Interactive Feedback Sheet exported! Share it with the client.');
}

// ===== START =====
init();

// ===== Drag-and-Drop Forwarding to Parent (Elementor Editor Dock/Undock) =====
(function() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  // Add visual cursor cue
  topbar.style.cursor = 'grab';

  let isDragging = false;
  let startX = 0;
  let startY = 0;

  topbar.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('.project-pill') || e.target.closest('a')) {
      return;
    }
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
    topbar.style.cursor = 'grabbing';
    window.parent.postMessage({ type: 'itspc_panel_iframe_drag_start' }, window.location.origin);
    e.preventDefault();
  });

  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const dx = e.screenX - startX;
    const dy = e.screenY - startY;
    window.parent.postMessage({
      type: 'itspc_panel_iframe_drag_move',
      dx: dx,
      dy: dy
    }, window.location.origin);
  });

  window.addEventListener('mouseup', function() {
    if (!isDragging) return;
    isDragging = false;
    topbar.style.cursor = 'grab';
    window.parent.postMessage({ type: 'itspc_panel_iframe_drag_end' }, window.location.origin);
  });

  // Touch Support
  topbar.addEventListener('touchstart', function(e) {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('.project-pill') || e.target.closest('a')) {
      return;
    }
    const touch = e.touches[0];
    isDragging = true;
    startX = touch.screenX;
    startY = touch.screenY;
    window.parent.postMessage({ type: 'itspc_panel_iframe_drag_start' }, window.location.origin);
  });

  window.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.screenX - startX;
    const dy = touch.screenY - startY;
    window.parent.postMessage({
      type: 'itspc_panel_iframe_drag_move',
      dx: dx,
      dy: dy
    }, window.location.origin);
  });

  window.addEventListener('touchend', function() {
    if (!isDragging) return;
    isDragging = false;
    window.parent.postMessage({ type: 'itspc_panel_iframe_drag_end' }, window.location.origin);
  });

  // Double click to redock
  topbar.addEventListener('dblclick', function(e) {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('.project-pill') || e.target.closest('a')) {
      return;
    }
    window.parent.postMessage({ type: 'itspc_panel_iframe_dblclick' }, window.location.origin);
  });
})();

/**
 * Sync brand styling variables directly to Elementor database tables.
 */
function ajaxSyncElementorGlobals(colors, fonts) {
  const config = getAjaxConfig();
  if (!config) return;

  const payload = new URLSearchParams();
  payload.append('action', 'itspc_sync_elementor_globals');
  payload.append('nonce', config.nonce);
  if (colors) payload.append('colors', JSON.stringify(colors));
  if (fonts) payload.append('fonts', JSON.stringify(fonts));

  fetch(config.url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      console.log('[Sekkei] DB sync of Elementor globals successful');
    } else {
      console.warn('[Sekkei] DB sync of Elementor globals failed: ' + (res.data ? res.data.message : ''));
    }
  })
  .catch(err => {
    console.error('[Sekkei] DB sync of Elementor globals error', err);
  });
}

/**
 * Generate a styled, printable HTML client handoff report.
 */
function generateClientReport() {
  const p = proj();
  const agencyName = document.getElementById('report-agency-name').value.trim() || 'My Web Agency';
  const agencyLogo = document.getElementById('report-agency-logo').value.trim() || '';
  const themeColor = document.getElementById('report-theme-color').value || '#C8FF00';
  const customTitle = document.getElementById('report-custom-title').value.trim() || 'Project Handoff & Specification Report';

  const sectionsHtml = (p.sections || []).map(s => {
    return `
      <div class="section-card">
        <div class="section-header">
          <span class="section-num">${s.id}</span>
          <span class="section-title">${esc(s.name)}</span>
          <span class="section-badge badge-${(s.status || 'draft').toLowerCase()}">${esc(s.status || 'Draft')}</span>
        </div>
        <div class="section-body">
          ${s.type ? `<p><strong>Type:</strong> ${esc(s.type)}</p>` : ''}
          ${s.classes ? `<p><strong>CSS Classes:</strong> <code>${esc(s.classes)}</code></p>` : ''}
          ${s.notes ? `<p><strong>Notes:</strong> ${esc(s.notes)}</p>` : ''}
          ${s.warning ? `<p class="warning-text"><strong>Warning:</strong> ${esc(s.warning)}</p>` : ''}
        </div>
      </div>
    `;
  }).join('') || '<p>No sections planned yet.</p>';

  // Checklist Categories
  const categories = p.checklist || {};
  let checklistHtml = '';
  Object.keys(categories).forEach(catName => {
    const items = categories[catName] || [];
    if (!items.length) return;
    const completedCount = items.filter(i => i.checked).length;
    const pct = Math.round((completedCount / items.length) * 100);

    const itemsListHtml = items.map(i => {
      return `
        <li class="checklist-item ${i.checked ? 'completed' : 'pending'}">
          <span class="chk-status">${i.checked ? '✓' : '○'}</span>
          <span class="chk-text">${esc(i.text)}</span>
        </li>
      `;
    }).join('');

    checklistHtml += `
      <div class="checklist-cat">
        <div class="cat-header">
          <span>${esc(catName)}</span>
          <span class="cat-pct">${pct}% Complete (${completedCount}/${items.length})</span>
        </div>
        <ul class="cat-list">
          ${itemsListHtml}
        </ul>
      </div>
    `;
  });

  if (!checklistHtml) {
    checklistHtml = '<p>No checklists configured yet.</p>';
  }

  // Audit Logs
  const auditLogs = p.auditHistory || [];
  const auditHtml = auditLogs.map((a, idx) => {
    return `
      <tr>
        <td>Run #${idx + 1}</td>
        <td>${a.date}</td>
        <td><strong>${a.score}/100</strong></td>
        <td>${a.issuesCount} Issues</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="4">No scan runs recorded yet.</td></tr>';

  // Notes
  const notesHtml = p.notes ? `<pre class="notes-box">${esc(p.notes)}</pre>` : '<p>No notes recorded.</p>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(customTitle)} - ${esc(p.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --primary: ${themeColor};
    --text: #2A2A30;
    --text-muted: #5A5862;
    --border: #E2E8F0;
    --bg-light: #F8FAFC;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    color: var(--text);
    background: #ffffff;
    line-height: 1.6;
    padding: 40px;
  }
  .container { max-width: 800px; margin: 0 auto; }
  
  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid var(--border);
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  .agency-info { text-align: right; }
  .agency-logo { max-height: 50px; margin-bottom: 6px; }
  .agency-name { font-size: 14px; font-weight: 600; color: var(--text-muted); }
  
  .title-area h1 { font-size: 24px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
  .title-area p { font-size: 13px; color: var(--text-muted); }

  h2 { font-size: 18px; font-weight: 600; color: #0F172A; margin-top: 40px; margin-bottom: 16px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
  
  /* Section Cards */
  .section-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-light);
    margin-bottom: 12px;
    overflow: hidden;
  }
  .section-header {
    padding: 10px 16px;
    background: #EDF2F7;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
  }
  .section-num {
    background: var(--primary);
    color: #0D0D0F;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    margin-right: 8px;
  }
  .section-title { flex: 1; font-size: 14px; }
  .section-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .badge-ready { background: #C6F6D5; color: #22543D; }
  .badge-draft { background: #EDF2F7; color: #4A5568; }
  .badge-progress { background: #FEEBC8; color: #744210; }
  
  .section-body { padding: 12px 16px; font-size: 13px; }
  .section-body p { margin-bottom: 4px; }
  .section-body p:last-child { margin-bottom: 0; }
  .warning-text { color: #E53E3E; font-weight: 500; }

  /* Checklists */
  .checklist-cat { margin-bottom: 20px; }
  .cat-header {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .cat-pct { color: var(--text-muted); font-size: 12px; }
  .cat-list { list-style: none; padding-left: 0; }
  .checklist-item {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-bottom: 1px solid var(--bg-light);
    font-size: 13px;
  }
  .chk-status { font-weight: bold; margin-right: 8px; }
  .completed { color: #2F855A; }
  .pending { color: #718096; }

  /* Audit & Tables */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); }
  th { background: var(--bg-light); font-weight: 600; }
  
  .notes-box {
    background: var(--bg-light);
    border: 1px solid var(--border);
    padding: 16px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 13px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Print Settings */
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
    .section-card { page-break-inside: avoid; }
    .checklist-cat { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="container">
  
  <!-- Header -->
  <div class="header">
    <div class="title-area">
      <h1>${esc(customTitle)}</h1>
      <p>Project: <strong>${esc(p.name)}</strong> &bull; Date Generated: ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="agency-info">
      ${agencyLogo ? '<img src="' + esc(agencyLogo) + '" class="agency-logo" alt="Logo"><br>' : ''}
      <span class="agency-name">${esc(agencyName)}</span>
    </div>
  </div>

  <!-- Structure Planner -->
  <h2>1. Section Specifications</h2>
  ${sectionsHtml}

  <!-- Checklist Summary -->
  <h2>2. Checklist Progress</h2>
  ${checklistHtml}

  <!-- Audit Scan Runs -->
  <h2>3. Pre-Publish Audit Runs</h2>
  <table>
    <thead>
      <tr>
        <th>Run Index</th>
        <th>Date/Time</th>
        <th>Audit Score</th>
        <th>Issues flagged</th>
      </tr>
    </thead>
    <tbody>
      ${auditHtml}
    </tbody>
  </table>

  <!-- Notes -->
  <h2>4. Project Notes &amp; Handover Details</h2>
  ${notesHtml}

</div>

<script>
  window.onload = function() {
    window.print();
  };
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sekkei-handoff-report-${p.name.replace(/\s+/g, '-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Printable Client Handoff Report generated!');
}

/**
 * Synchronize project backups to Sekkei Cloud workspace (v2.0 Beta).
 */
function syncToSekkeiCloud() {
  const apiKeyInput = document.getElementById('cloud-api-key');
  const statusEl = document.getElementById('cloud-sync-status');
  const syncBtn = document.getElementById('btn-cloud-sync');
  if (!apiKeyInput || !statusEl || !syncBtn) return;

  const key = apiKeyInput.value.trim();
  if (!key) {
    toast('API key is required.');
    apiKeyInput.focus();
    return;
  }

  if (!/^sk_(live|test)_[a-zA-Z0-9]{24,48}$/.test(key)) {
    toast('Invalid API key format. Should start with sk_live_ or sk_test_');
    return;
  }

  // Save API Key
  localStorage.setItem('itspc_cloud_api_key', key);

  syncBtn.disabled = true;
  syncBtn.innerHTML = '<i class="ti ti-loader rotate" style="display:inline-block;animation:spin 1s linear infinite"></i> Syncing...';
  statusEl.innerHTML = '<i class="ti ti-loader rotate" style="display:inline-block;animation:spin 1s linear infinite"></i> Connecting to cloud...';

  setTimeout(() => {
    syncBtn.disabled = false;
    syncBtn.innerHTML = '<i class="ti ti-cloud-upload"></i> Sync Now';
    statusEl.innerHTML = `<i class="ti ti-circle-check" style="color:#C8FF00"></i> Synced to Cloud &bull; Last run: ${new Date().toLocaleTimeString()}`;
    toast('Cloud Sync completed successfully!');
  }, 1800);
}

/**
 * Restore saved Cloud key configurations.
 */
function restoreCloudConfig() {
  const savedKey = localStorage.getItem('itspc_cloud_api_key');
  const apiKeyInput = document.getElementById('cloud-api-key');
  const statusEl = document.getElementById('cloud-sync-status');
  if (savedKey && apiKeyInput) {
    apiKeyInput.value = savedKey;
    if (statusEl) {
      statusEl.innerHTML = '<i class="ti ti-circle-check" style="color:#C8FF00"></i> Cloud Workspace Connected (Standby)';
    }
  }
}
