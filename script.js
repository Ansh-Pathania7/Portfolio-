/**
 * Ansh Pathania Portfolio — script.js
 * Kali Linux Desktop OS Simulation
 *
 * MODULES:
 *  A. Boot sequence animation
 *  B. Live clock (top bar + dock)
 *  C. Window management (open, close, minimize, maximize, drag, focus)
 *  D. Dock / taskbar (reflects open windows)
 *  E. Terminal emulator (command parser + output)
 *  F. Skill bar animations (on window open)
 *  G. Desktop context menu (right-click)
 *  H. Contact form (mini form in contact window)
 *  I. Resume open (placeholder)
 *  J. Utility helpers
 */

'use strict';

/* ============================================================
   STATE — track open/minimized windows, z-index, history
============================================================ */
const state = {
  openWindows:     new Set(),   // window IDs currently open (not minimized)
  minimizedWindows:new Set(),   // window IDs minimized
  zCounter:        20,          // base z-index counter
  termHistory:     [],          // terminal command history
  termHistIdx:     -1,          // history nav index
  isMobile:        () => window.innerWidth <= 600,
};

/* ============================================================
   WINDOW POSITION REGISTRY — smart cascading placement
============================================================ */
const windowStartPositions = {
  'about':           { top: 60,  left: 140 },
  'skills':          { top: 80,  left: 200 },
  'projects':        { top: 55,  left: 160 },
  'proj-ai':         { top: 100, left: 220 },
  'proj-expense':    { top: 110, left: 240 },
  'proj-attendance': { top: 120, left: 260 },
  'certificates':    { top: 70,  left: 180 },
  'achievements':    { top: 75,  left: 190 },
  'contact':         { top: 85,  left: 210 },
  'terminal':        { top: 50,  left: 150 },
};
let cascadeOffset = 0; // increment per new window open


/* ============================================================
   A. BOOT SEQUENCE
============================================================ */
const bootLines = [
  'BIOS version 2.35 — KaliOS kernel 6.1.0-kali5',
  'Loading hardware modules...',
  '[  OK  ] Started Journal Service.',
  '[  OK  ] Started Network Manager.',
  '[  OK  ] Reached target Graphical Interface.',
  '',
  '  ██╗  ██╗ █████╗ ██╗     ██╗',
  '  ██║ ██╔╝██╔══██╗██║     ██║',
  '  █████╔╝ ███████║██║     ██║',
  '  ██╔═██╗ ██╔══██║██║     ██║',
  '  ██║  ██╗██║  ██║███████╗██║',
  '  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝',
  '',
  'Welcome to Ansh@kali',
  'Booting desktop environment...',
];

function runBoot() {
  const bootPre      = document.getElementById('boot-pre');
  const bootProgress = document.getElementById('boot-progress-fill');
  const bootScreen   = document.getElementById('boot-screen');

  if (!bootPre || !bootScreen) return;

  let lineIdx = 0;
  let totalDuration = 0;

  bootLines.forEach((line, i) => {
    const delay = i * 120 + Math.random() * 40;
    totalDuration = delay;
    setTimeout(() => {
      bootPre.textContent += line + '\n';
      // Animate progress bar
      const pct = Math.round(((i + 1) / bootLines.length) * 100);
      bootProgress.style.width = pct + '%';
    }, delay);
  });

  // Hide boot screen after all lines printed + small pause
  setTimeout(() => {
    bootScreen.classList.add('hidden');
    // Open terminal after boot
    setTimeout(() => openWindow('terminal'), 400);
  }, totalDuration + 700);
}


/* ============================================================
   B. LIVE CLOCK
============================================================ */
function updateClock() {
  const now  = new Date();
  const hh   = String(now.getHours()).padStart(2, '0');
  const mm   = String(now.getMinutes()).padStart(2, '0');
  const ss   = String(now.getSeconds()).padStart(2, '0');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayStr = `${days[now.getDay()]} ${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]}`;

  const clockTimeEl = document.getElementById('clock-time');
  const clockDateEl = document.getElementById('clock-date');
  const dockMiniEl  = document.getElementById('dock-time-mini');

  if (clockTimeEl) clockTimeEl.textContent = `${hh}:${mm}:${ss}`;
  if (clockDateEl) clockDateEl.textContent = dayStr;
  if (dockMiniEl)  dockMiniEl.textContent  = `${hh}:${mm}`;
}


/* ============================================================
   C. WINDOW MANAGEMENT
============================================================ */

/**
 * Open a window by ID (or bring to front if already open)
 * @param {string} id  — window key e.g. 'about', 'terminal'
 */
function openWindow(id) {
  const win = document.getElementById(`win-${id}`);
  if (!win) return;

  // If minimized, restore it
  if (state.minimizedWindows.has(id)) {
    state.minimizedWindows.delete(id);
    win.classList.remove('minimized');
    win.classList.add('open');
    state.openWindows.add(id);
    focusWindow(id);
    updateDock();
    return;
  }

  // If already open, just focus it
  if (state.openWindows.has(id)) {
    focusWindow(id);
    return;
  }

  // Position window
  if (!state.isMobile()) {
    const base = windowStartPositions[id] || { top: 80, left: 160 };
    const top  = base.top  + cascadeOffset;
    const left = base.left + cascadeOffset;

    // Clamp to viewport
    const maxLeft = window.innerWidth  - 200;
    const maxTop  = window.innerHeight - 200;
    win.style.top  = Math.min(top,  maxTop)  + 'px';
    win.style.left = Math.min(left, maxLeft) + 'px';

    cascadeOffset = (cascadeOffset + 24) % 80;
  }

  win.classList.add('open');
  state.openWindows.add(id);
  focusWindow(id);
  updateDock();

  // Trigger skill bars animation when skills window opens
  if (id === 'skills') {
    setTimeout(animateSkillBars, 250);
  }

  // Focus terminal input when terminal opens
  if (id === 'terminal') {
    setTimeout(() => {
      if (!document.getElementById('term-output').childElementCount) {
        printWelcome();
      }
      focusTermInput();
    }, 200);
  }
}

/**
 * Close a window
 * @param {string} id
 */
function closeWindow(id) {
  const win = document.getElementById(`win-${id}`);
  if (!win) return;
  win.classList.remove('open', 'minimized', 'focused');
  state.openWindows.delete(id);
  state.minimizedWindows.delete(id);
  updateDock();
  updateTopBarTitle();
}

/**
 * Minimize a window to the dock
 * @param {string} id
 */
function minimizeWindow(id) {
  const win = document.getElementById(`win-${id}`);
  if (!win) return;
  win.classList.remove('open', 'focused');
  win.classList.add('minimized');
  state.openWindows.delete(id);
  state.minimizedWindows.add(id);
  updateDock();
  updateTopBarTitle();
}

/**
 * Toggle maximize/restore a window
 * @param {string} id
 */
function toggleMaxWindow(id) {
  const win = document.getElementById(`win-${id}`);
  if (!win) return;
  win.classList.toggle('maximized');
}

/**
 * Bring a window to the top of the z-stack
 * @param {string} id
 */
function focusWindow(id) {
  // Unfocus all
  document.querySelectorAll('.os-window').forEach(w => w.classList.remove('focused'));

  const win = document.getElementById(`win-${id}`);
  if (!win) return;

  state.zCounter++;
  win.style.zIndex = state.zCounter;
  win.classList.add('focused');
  updateTopBarTitle(id);
  updateDock();
}

/**
 * Update top bar active window title
 * @param {string} [id]
 */
function updateTopBarTitle(id) {
  const el = document.getElementById('active-window-title');
  if (!el) return;

  if (!id) {
    el.textContent = 'Ansh Pathania@kali:~$';
    return;
  }

  const titleMap = {
    'about':           'About_Me.txt',
    'skills':          'Skills.app — Dashboard',
    'projects':        'Projects/ — File Manager',
    'proj-ai':         'Projects/AI_Predictor.py',
    'proj-expense':    'Projects/ExpenseTracker.js',
    'proj-attendance': 'Projects/Attendance.py',
    'certificates':    'Certificates.pdf',
    'achievements':    'Achievements.log',
    'contact':         'Contact.sh',
    'terminal':        'ansh@kali: ~/terminal',
  };

  el.textContent = titleMap[id] || 'Ansh Pathania@kali:~$';
}

/**
 * Close all open windows
 */
function closeAllWindows() {
  [...state.openWindows, ...state.minimizedWindows].forEach(id => closeWindow(id));
  hideContextMenu();
}

/**
 * Refresh desktop (close all windows)
 */
function refreshDesktop() {
  closeAllWindows();
  cascadeOffset = 0;
  hideContextMenu();
}

/**
 * Open resume in new tab (placeholder)
 */
function openResume() {
  // CHANGE: your resume PDF link — replace '#' with your actual resume URL
  const resumeUrl = '#'; // e.g. 'https://drive.google.com/file/d/YOUR_ID/view'
  if (resumeUrl === '#') {
    // Show a message in terminal if open, else alert
    if (state.openWindows.has('terminal')) {
      termPrint('error', 'cat: Resume.pdf: No URL configured');
      termPrint('comment', '# CHANGE: Add your resume URL in script.js → openResume()');
      termPrintPrompt();
    } else {
      openWindow('terminal');
      setTimeout(() => {
        termPrint('error', 'cat: Resume.pdf: No URL configured — see CHANGE comment in script.js');
        termPrintPrompt();
      }, 400);
    }
  } else {
    window.open(resumeUrl, '_blank', 'noopener');
  }
}


/* ============================================================
   C2. WINDOW DRAGGING
============================================================ */
function initDragging() {
  document.querySelectorAll('.win-titlebar').forEach(titlebar => {
    let isDragging = false;
    let startX, startY, winStartLeft, winStartTop;

    const getWin = () => titlebar.closest('.os-window');

    titlebar.addEventListener('mousedown', (e) => {
      // Don't drag if clicking a button
      if (e.target.tagName === 'BUTTON') return;
      const win = getWin();
      if (!win || win.classList.contains('maximized')) return;

      // Focus this window
      const id = titlebar.getAttribute('data-win');
      if (id) focusWindow(id);

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      winStartLeft = win.offsetLeft;
      winStartTop  = win.offsetTop;

      e.preventDefault();
    });

    // Touch drag
    titlebar.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      const win = getWin();
      if (!win || win.classList.contains('maximized')) return;
      if (window.innerWidth <= 600) return; // no drag on mobile

      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      winStartLeft = win.offsetLeft;
      winStartTop  = win.offsetTop;
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const win = getWin();
      if (!win) return;

      let newLeft = winStartLeft + (e.clientX - startX);
      let newTop  = winStartTop  + (e.clientY - startY);

      // Clamp to viewport
      const topBarH  = 32;
      const dockH    = 52;
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - 80));
      newTop  = Math.max(topBarH, Math.min(newTop,  window.innerHeight - dockH - 40));

      win.style.left = newLeft + 'px';
      win.style.top  = newTop  + 'px';
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const win = getWin();
      if (!win) return;
      const touch = e.touches[0];
      let newLeft = winStartLeft + (touch.clientX - startX);
      let newTop  = winStartTop  + (touch.clientY - startY);
      win.style.left = Math.max(0, newLeft) + 'px';
      win.style.top  = Math.max(32, newTop)  + 'px';
    }, { passive: true });

    document.addEventListener('mouseup',  () => { isDragging = false; });
    document.addEventListener('touchend', () => { isDragging = false; });
  });

  // Click on any window to focus it
  document.querySelectorAll('.os-window').forEach(win => {
    win.addEventListener('mousedown', () => {
      const titlebar = win.querySelector('.win-titlebar');
      if (titlebar) {
        const id = titlebar.getAttribute('data-win');
        if (id) focusWindow(id);
      }
    });
  });
}


/* ============================================================
   D. DOCK / TASKBAR
============================================================ */
function updateDock() {
  const dockItems = document.getElementById('dock-items');
  if (!dockItems) return;

  dockItems.innerHTML = '';

  const allVisible = new Set([...state.openWindows, ...state.minimizedWindows]);

  if (allVisible.size === 0) {
    const hint = document.createElement('span');
    hint.style.cssText = 'font-size:0.65rem;color:#484f58;padding:0 6px;';
    hint.textContent = 'No open windows — double-click an icon';
    dockItems.appendChild(hint);
    return;
  }

  const labelMap = {
    'about':           '📄 About_Me',
    'skills':          '⚙️ Skills',
    'projects':        '📁 Projects',
    'proj-ai':         '🤖 AI Predictor',
    'proj-expense':    '💰 Expenses',
    'proj-attendance': '📋 Attendance',
    'certificates':    '📜 Certs',
    'achievements':    '🏆 Achiev.',
    'contact':         '📡 Contact',
    'terminal':        '▶ Terminal',
  };

  allVisible.forEach(id => {
    const btn = document.createElement('button');
    btn.className = 'dock-item';
    btn.setAttribute('aria-label', `${labelMap[id] || id} — click to restore or minimize`);

    const dot = document.createElement('span');
    dot.className = 'dock-dot';
    btn.appendChild(dot);

    const label = document.createElement('span');
    label.textContent = labelMap[id] || id;
    btn.appendChild(label);

    // Active = open (not minimized)
    if (state.openWindows.has(id)) {
      btn.classList.add('active-win');
    }

    btn.addEventListener('click', () => {
      if (state.minimizedWindows.has(id)) {
        // Restore
        openWindow(id);
      } else if (state.openWindows.has(id)) {
        // Minimize (toggle)
        const win = document.getElementById(`win-${id}`);
        if (win && win.classList.contains('focused')) {
          minimizeWindow(id);
        } else {
          focusWindow(id);
        }
      }
    });

    dockItems.appendChild(btn);
  });
}


/* ============================================================
   E. TERMINAL EMULATOR
============================================================ */

/** Scroll to bottom of terminal */
function termScrollBottom() {
  const body = document.getElementById('terminal-body');
  if (body) body.scrollTop = body.scrollHeight;
}

/** Focus the terminal input */
function focusTermInput() {
  const inp = document.getElementById('term-input');
  if (inp) inp.focus();
}

/** Print a line to terminal output */
function termPrint(type, text) {
  const output = document.getElementById('term-output');
  if (!output) return;

  const span = document.createElement('span');
  span.className = `term-line term-line-${type}`;

  // Sanitize HTML in text to avoid XSS — only allow simple tags
  span.textContent = text;

  // Special: allow links in output if type is 'link-output'
  if (type === 'link-output') {
    span.innerHTML = text; // trusted content only
  }

  output.appendChild(span);
  output.appendChild(document.createElement('br'));
  termScrollBottom();
}

/** Print an empty blank line */
function termBlank() {
  termPrint('blank', '');
}

/** Print the prompt after a command completes */
function termPrintPrompt() {
  const output = document.getElementById('term-output');
  if (!output) return;

  const line = document.createElement('span');
  line.className = 'term-line term-line-prompt';
  line.innerHTML = '<span class="t-host">ansh@kali</span>:<span class="t-path">~</span>$ ';
  output.appendChild(line);
  termScrollBottom();
}

/** Print the welcome banner when terminal first opens */
function printWelcome() {
  const lines = [
    ['comment', '# ─────────────────────────────────────────────'],
    ['comment', '# Welcome to Ansh Pathania\'s Portfolio Terminal'],
    ['comment', '# ─────────────────────────────────────────────'],
    ['output',  'OS: KaliOS 2025 (Portfolio Edition)'],
    ['output',  'User: ansh | Host: kali | Shell: bash 5.2'],
    ['blank',   ''],
    ['success', 'Type a command to get started.'],
    ['output',  'Available commands:'],
    ['output',  '  help      — show all commands'],
    ['output',  '  whoami    — about me'],
    ['output',  '  skills    — list my tech skills'],
    ['output',  '  projects  — view my projects'],
    ['output',  '  contact   — get contact info'],
    ['output',  '  open <app>— open a desktop window'],
    ['output',  '  clear     — clear terminal'],
    ['blank',   ''],
  ];

  lines.forEach(([type, text]) => termPrint(type, text));
  termPrintPrompt();
}

/** Process a terminal command string */
function processCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) { termPrintPrompt(); return; }

  // Save to history
  state.termHistory.unshift(trimmed);
  if (state.termHistory.length > 50) state.termHistory.pop();
  state.termHistIdx = -1;

  // Echo the command
  const output = document.getElementById('term-output');
  if (output) {
    const echo = document.createElement('span');
    echo.className = 'term-line term-line-prompt';
    echo.innerHTML = `<span class="t-host">ansh@kali</span>:<span class="t-path">~</span>$ ${escapeHtml(trimmed)}`;
    output.appendChild(echo);
    output.appendChild(document.createElement('br'));
  }

  const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);

  switch (cmd) {

    case 'help':
      termBlank();
      termPrint('success',  'AVAILABLE COMMANDS:');
      termPrint('output',   '  whoami              — show personal info');
      termPrint('output',   '  skills              — list all technical skills');
      termPrint('output',   '  projects            — list all projects');
      termPrint('output',   '  contact             — show contact details');
      termPrint('output',   '  education           — academic background');
      termPrint('output',   '  achievements        — milestones & badges');
      termPrint('output',   '  certificates        — certifications earned');
      termPrint('output',   '  ls                  — list desktop files');
      termPrint('output',   '  open <window>       — open a desktop window');
      termPrint('output',   '    e.g. open about, open projects, open terminal');
      termPrint('output',   '  cat <file>          — view file contents');
      termPrint('output',   '    e.g. cat About_Me.txt, cat Achievements.log');
      termPrint('output',   '  clear               — clear terminal screen');
      termPrint('output',   '  date                — show current date/time');
      termPrint('output',   '  uname               — system info');
      termPrint('output',   '  pwd                 — show current path');
      termPrint('output',   '  echo <text>         — echo text back');
      termBlank();
      break;

    case 'whoami':
      termBlank();
      termPrint('success',  '▶ WHOAMI — Ansh Pathania');
      termPrint('output',   '  Name       : Ansh Pathania');
      termPrint('output',   '  Role       : Full Stack Developer');
      termPrint('output',   '  Degree     : B.Tech Computer Science & Engineering');
      termPrint('output',   '  University : Lovely Professional University, Phagwara');
      termPrint('output',   '  Year       : 2nd Year (2023 – 2027)');
      termPrint('output',   '  CGPA       : 7.61');
      termPrint('output',   '  Status     : Open to internships & opportunities');
      termBlank();
      break;

    case 'skills':
    case 'skill':
      termBlank();
      termPrint('success',  '▶ SKILLS — Tech Stack');
      termPrint('output',   '  Languages  : Python, C, C++, JavaScript');
      termPrint('output',   '  Web        : HTML, CSS, JavaScript');
      termPrint('output',   '  Databases  : MySQL, MongoDB');
      termPrint('output',   '  Tools      : Git, GitHub, Figma');
      termPrint('output',   '  Learning   : Flask, scikit-learn, React');
      termBlank();
      termPrint('comment',  '# Tip: "open skills" to see the interactive dashboard');
      termBlank();
      break;

    case 'projects':
    case 'project':
      termBlank();
      termPrint('success',  '▶ PROJECTS — Portfolio');
      termBlank();
      termPrint('output',   '  [01] AI Student Performance Predictor');
      termPrint('output',   '       Stack: Python, Flask, scikit-learn, HTML/CSS');
      termPrint('output',   '       Status: Active');
      termBlank();
      termPrint('output',   '  [02] Personal Expense Tracker');
      termPrint('output',   '       Stack: HTML, CSS, JavaScript, Chart.js');
      termPrint('output',   '       Status: Completed');
      termBlank();
      termPrint('output',   '  [03] College Attendance Management System');
      termPrint('output',   '       Stack: Python, Flask, MySQL, JavaScript');
      termPrint('output',   '       Status: Completed');
      termBlank();
      termPrint('comment',  '# Tip: "open projects" to browse the folder view');
      termBlank();
      break;

    case 'contact':
      termBlank();
      termPrint('success',  '▶ CONTACT — Reach out');
      termPrint('output',   '  Phone    : +91-9915569889');
      termPrint('output',   '  GitHub   : github.com/Ansh-Pathania7');
      termPrint('output',   '  LinkedIn : linkedin.com/in/ansh-pathania-9683053bb');
      termPrint('comment',  '  # CHANGE: Replace email below with your real email');
      termPrint('output',   '  Email    : anshpathania@example.com');
      termPrint('output',   '  Location : Phagwara, Punjab, India');
      termBlank();
      break;

    case 'education':
    case 'edu':
      termBlank();
      termPrint('success',  '▶ EDUCATION');
      termPrint('output',   '  Degree     : B.Tech — Computer Science & Engineering');
      termPrint('output',   '  University : Lovely Professional University, Phagwara');
      termPrint('output',   '  Duration   : 2023 – 2027 (2nd Year)');
      termPrint('output',   '  CGPA       : 7.61');
      termBlank();
      break;

    case 'achievements':
    case 'achievement':
      termBlank();
      termPrint('success',  '▶ ACHIEVEMENTS — Milestones');
      termPrint('output',   '  [*] 200+ coding problems solved (LeetCode, HackerRank, GFG)');
      termPrint('output',   '  [*] LeetCode 100 Days Badge — 100 day streak maintained');
      termPrint('output',   '  [*] Top 10 / 50+ teams — Hackathon performance');
      termBlank();
      break;

    case 'certificates':
    case 'cert':
      termBlank();
      termPrint('success',  '▶ CERTIFICATES');
      termPrint('output',   '  [LPU]      Design Thinking & Figma — Summer 2025');
      termPrint('output',   '  [Infosys]  Introduction to Artificial Intelligence — 2024');
      termPrint('output',   '  [Infosys]  Introduction to Python Programming — 2024');
      termBlank();
      break;

    case 'ls':
      termBlank();
      termPrint('output',   'total 8 — ~/Desktop/');
      termPrint('output',   '  About_Me.txt    Skills.app      Projects/');
      termPrint('output',   '  Certificates.pdf Achievements.log Contact.sh');
      termPrint('output',   '  Resume.pdf      Terminal.sh');
      termBlank();
      break;

    case 'cat':
      handleCat(args);
      break;

    case 'open':
      handleOpen(args);
      break;

    case 'clear':
    case 'cls':
      const out = document.getElementById('term-output');
      if (out) out.innerHTML = '';
      termPrintPrompt();
      return; // skip the termPrintPrompt() at bottom

    case 'date':
      termPrint('output', new Date().toString());
      break;

    case 'uname':
      termPrint('output', 'Linux ansh-kali 6.1.0-kali5 #1 SMP PREEMPT Portfolio x86_64 GNU/Linux');
      break;

    case 'pwd':
      termPrint('output', '/home/ansh');
      break;

    case 'echo':
      termPrint('output', args.join(' '));
      break;

    case 'exit':
      termPrint('output', 'Closing terminal...');
      setTimeout(() => closeWindow('terminal'), 600);
      break;

    case 'sudo':
      termPrint('error', 'sudo: Permission denied. You are not in the sudoers file.');
      termPrint('comment', '# Nice try 😄');
      break;

    case 'rm':
      termPrint('error', 'rm: Cannot remove portfolio — this is read-only!');
      break;

    case 'hack':
    case 'nmap':
    case 'metasploit':
      simulateHack();
      return;

    default:
      termPrint('error', `bash: ${escapeHtml(cmd)}: command not found`);
      termPrint('comment', `# Type 'help' to see available commands`);
      break;
  }

  termPrintPrompt();
}

/** Handle the 'cat' command */
function handleCat(args) {
  if (!args.length) {
    termPrint('error', 'cat: missing file operand');
    return;
  }
  const file = args.join(' ').toLowerCase().replace(/\s/g, '');

  if (file.includes('about') || file.includes('about_me')) {
    termBlank();
    termPrint('success', '▶ About_Me.txt');
    termPrint('output',  '  NAME       = "Ansh Pathania"');
    termPrint('output',  '  ROLE       = "Full Stack Developer"');
    termPrint('output',  '  UNIVERSITY = "LPU, Phagwara"');
    termPrint('output',  '  CGPA       = 7.61');
    termPrint('output',  '  YEAR       = "2nd Year (2023-2027)"');
    termBlank();
  } else if (file.includes('achievement') || file.includes('.log')) {
    processCommand('achievements');
    return;
  } else if (file.includes('contact') || file.includes('.sh')) {
    processCommand('contact');
    return;
  } else if (file.includes('cert')) {
    processCommand('certificates');
    return;
  } else if (file.includes('resume') || file.includes('.pdf')) {
    termPrint('error', 'cat: Resume.pdf: Binary file — use "open resume"');
    termPrint('comment', '# CHANGE: add your resume PDF link in openResume()');
  } else {
    termPrint('error', `cat: ${escapeHtml(args.join(' '))}: No such file or directory`);
  }
}

/** Handle the 'open' command */
function handleOpen(args) {
  if (!args.length) {
    termPrint('error', 'open: missing argument');
    termPrint('output', '  Usage: open <window>');
    termPrint('output',  '  Options: about, skills, projects, contact, achievements,');
    termPrint('output',  '           certificates, terminal, resume');
    return;
  }
  const target = args.join('').toLowerCase().replace(/[^a-z]/g, '');

  const aliasMap = {
    'about': 'about', 'aboutme': 'about',
    'skills': 'skills', 'skill': 'skills',
    'projects': 'projects', 'project': 'projects', 'folder': 'projects',
    'contact': 'contact',
    'achievements': 'achievements', 'achievement': 'achievements',
    'certificates': 'certificates', 'cert': 'certificates',
    'terminal': 'terminal', 'term': 'terminal', 'bash': 'terminal',
    'resume': null,  // special
  };

  const winId = aliasMap[target];
  if (winId === null) {
    openResume();
  } else if (winId) {
    openWindow(winId);
    termPrint('success', `Opening ${winId}...`);
  } else {
    termPrint('error', `open: unknown window '${escapeHtml(target)}'`);
    termPrint('output', "  Try: about, skills, projects, contact, terminal, resume");
  }
}

/** Fun easter egg: fake hacking sequence */
function simulateHack() {
  const hackLines = [
    ['output',  'Initializing payload...'],
    ['output',  'Scanning target: 127.0.0.1'],
    ['output',  'PORT   STATE  SERVICE'],
    ['output',  '22/tcp open   ssh'],
    ['output',  '80/tcp open   http'],
    ['output',  'Exploiting vulnerability...'],
    ['output',  '[ ████████████████████ ] 100%'],
    ['error',   'ACCESS DENIED — This is a portfolio, not a target! 😄'],
    ['comment', '# Nice try — but there\'s nothing to hack here'],
    ['success', 'Tip: "whoami" to learn about the developer instead'],
  ];

  let delay = 0;
  hackLines.forEach(([type, text]) => {
    setTimeout(() => {
      termPrint(type, text);
      termScrollBottom();
    }, delay);
    delay += 250;
  });

  setTimeout(() => termPrintPrompt(), delay);
}

/** Initialize terminal key listener */
function initTerminal() {
  const input = document.getElementById('term-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input.value;
      input.value = '';
      processCommand(cmd);
    }

    // History navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.termHistIdx < state.termHistory.length - 1) {
        state.termHistIdx++;
        input.value = state.termHistory[state.termHistIdx] || '';
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.termHistIdx > 0) {
        state.termHistIdx--;
        input.value = state.termHistory[state.termHistIdx] || '';
      } else {
        state.termHistIdx = -1;
        input.value = '';
      }
    }

    // Tab autocomplete (basic)
    if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.value.trim().toLowerCase();
      const cmds = ['help','whoami','skills','projects','contact','education','achievements',
                    'certificates','ls','clear','date','uname','pwd','echo','exit',
                    'open about','open skills','open projects','open contact','open terminal','open resume'];
      const match = cmds.find(c => c.startsWith(partial) && c !== partial);
      if (match) input.value = match;
    }
  });
}


/* ============================================================
   F. SKILL BAR ANIMATIONS
============================================================ */
function animateSkillBars() {
  document.querySelectorAll('.sk-bar-fill').forEach(bar => {
    const pct = bar.getAttribute('data-pct') || '0';
    bar.style.width = pct + '%';
  });
}


/* ============================================================
   G. DESKTOP CONTEXT MENU (right-click)
============================================================ */
function initContextMenu() {
  const menu = document.getElementById('ctx-menu');
  const desktop = document.getElementById('desktop');

  if (!menu || !desktop) return;

  desktop.addEventListener('contextmenu', (e) => {
    // Only show on desktop background, not on icons or windows
    if (e.target.closest('.desktop-icon') ||
        e.target.closest('.os-window')     ||
        e.target.closest('.bottom-dock')   ||
        e.target.closest('.top-bar')) return;

    e.preventDefault();

    // Position menu, keeping it within viewport
    let x = e.clientX;
    let y = e.clientY;
    const menuW = 180;
    const menuH = 140;
    if (x + menuW > window.innerWidth)  x = window.innerWidth  - menuW - 8;
    if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;

    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';
    menu.classList.add('visible');
    menu.querySelector('.ctx-item')?.focus();
  });

  // Close menu on click anywhere
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });

  // Keyboard navigation in context menu
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('.ctx-item')];
    const idx   = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { items[(idx + 1) % items.length]?.focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp')   { items[(idx - 1 + items.length) % items.length]?.focus(); e.preventDefault(); }
    if (e.key === 'Enter')     { document.activeElement.click(); }
  });
}

function hideContextMenu() {
  document.getElementById('ctx-menu')?.classList.remove('visible');
}


/* ============================================================
   H. CONTACT FORM
============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('cfm-feedback');
  const submitBtn = document.getElementById('cfm-submit');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name  = document.getElementById('cfm-name')?.value.trim()  || '';
    const email = document.getElementById('cfm-email')?.value.trim() || '';
    const msg   = document.getElementById('cfm-msg')?.value.trim()   || '';

    if (!name) {
      showCFMFeedback('error', 'Error: name is required');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showCFMFeedback('error', 'Error: invalid email address');
      return;
    }
    if (!msg || msg.length < 10) {
      showCFMFeedback('error', 'Error: message too short (min 10 chars)');
      return;
    }

    // Simulate sending
    // CHANGE: Replace with your actual form backend (Formspree, EmailJS, etc.)
    submitBtn.disabled = true;
    showCFMFeedback('ok', '▶ Sending...');

    setTimeout(() => {
      showCFMFeedback('ok', `✔ Message sent! I'll respond to ${email} soon.`);
      form.reset();
      submitBtn.disabled = false;
    }, 1500);
  });
}

function showCFMFeedback(type, msg) {
  const el = document.getElementById('cfm-feedback');
  if (!el) return;
  el.className = `cfm-feedback ${type}`;
  el.textContent = msg;
}


/* ============================================================
   I. MOBILE SUPPORT — Full-screen overlay for windows
============================================================ */
function initMobileSupport() {
  const overlay    = document.getElementById('mobile-overlay');
  const closeBtn   = document.getElementById('mobile-close-btn');
  const content    = document.getElementById('mobile-content');

  if (!overlay || !closeBtn || !content) return;

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('open');
    content.innerHTML = '';
  });
}

/**
 * On mobile: instead of floating windows, copy window content into the overlay
 * This is handled automatically since on mobile CSS makes windows fullscreen.
 * No extra JS needed — the CSS media query handles it.
 */


/* ============================================================
   J. UTILITY HELPERS
============================================================ */

/** Escape HTML to prevent XSS in terminal output */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Close context menu on desktop icon double-click */
function handleIconDoubleClick() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('dblclick', hideContextMenu);
  });
}


/* ============================================================
   INITIALIZATION — Run everything when DOM is ready
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // Boot sequence
  runBoot();

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Dragging
  initDragging();

  // Terminal
  initTerminal();

  // Context menu
  initContextMenu();

  // Contact form
  initContactForm();

  // Mobile
  initMobileSupport();

  // Icon double-click cleanup
  handleIconDoubleClick();

  // Initial dock state
  updateDock();

  // Close all windows shortcut — Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });

  // Desktop click — click off windows to unfocus
  document.getElementById('desktop')?.addEventListener('click', (e) => {
    if (!e.target.closest('.os-window') &&
        !e.target.closest('.desktop-icon') &&
        !e.target.closest('.bottom-dock')) {
      document.querySelectorAll('.os-window').forEach(w => w.classList.remove('focused'));
      updateTopBarTitle();
    }
  });

  // Footer year (not needed in OS theme, but leaving for completeness)
  // const yr = document.getElementById('footer-year');
  // if (yr) yr.textContent = new Date().getFullYear();

});
