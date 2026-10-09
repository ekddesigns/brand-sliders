// --- Data ---
const SECTIONS = [
  {
    id: "tone", tag: "TONE & VOICE", color: "purple", title: "Tone & Voice",
    desc: "If your brand were a person, how would it speak?",
    sliders: [
      { id: "s1", left: { label: "Playful", desc: "" }, right: { label: "Professional", desc: "" } },
      { id: "s2", left: { label: "Casual / Informational", desc: "" }, right: { label: "Formal / Authoritative", desc: "" } },
      { id: "s3", left: { label: "Witty / Humorous", desc: "" }, right: { label: "Serious / Matter-of-fact", desc: "" } }
    ]
  },
  {
    id: "market", tag: "MARKET POSITIONING", color: "blue", title: "Market Positioning",
    desc: "Where does your brand sit among competitors?",
    sliders: [
      { id: "s4", left: { label: "Affordable / Accessible", desc: "" }, right: { label: "Premium / Luxury", desc: "" } },
      { id: "s5", left: { label: "Mass market", desc: "" }, right: { label: "Niche / Boutique", desc: "" } },
      { id: "s6", left: { label: "Disruptive / Bold", desc: "" }, right: { label: "Safe / Trusted", desc: "" } }
    ]
  },
  {
    id: "look", tag: "LOOK & FEEL", color: "yellow", title: "Look & Feel",
    desc: "What should people see and feel at first glance?",
    sliders: [
      { id: "s7", left: { label: "Modern / Futuristic", desc: "" }, right: { label: "Classic / Traditional", desc: "" } },
      { id: "s8", left: { label: "Minimalist / Clean", desc: "" }, right: { label: "Complex / Detailed", desc: "" } },
      { id: "s9", left: { label: "Loud / Vibrant", desc: "" }, right: { label: "Quiet / Muted", desc: "" } }
    ]
  }
];

// --- State ---
let state = {
  brandName: "",
  clientName: "",
  answers: {},
  exportAttempted: false
};

// --- Initialization ---
function init() {
  loadState();
  parseURLParams();
  renderSections();
  setupEventListeners();
  updateUI();
}

function loadState() {
  // Purposely ignore local storage and start fresh on every load per user request
  try { localStorage.removeItem('brandSlidersState'); } catch(e) {}
  
  state.brandName = "";
  state.clientName = "";
  state.answers = {};
  state.exportAttempted = false;

  // Initialize all to 0 (unanswered)
  SECTIONS.forEach(sec => sec.sliders.forEach(sl => {
    state.answers[sl.id] = 0;
  }));
}

function saveState() {
  // Still saving during session just in case of accidental refresh, but it gets cleared on load
  try { localStorage.setItem('brandSlidersState', JSON.stringify(state)); } catch (e) {}
}

function parseURLParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('brand')) state.brandName = params.get('brand');
    if (params.has('client')) state.clientName = params.get('client');
    const brandInput = document.getElementById('brand-name');
    const clientInput = document.getElementById('client-name');
    if (brandInput) brandInput.value = state.brandName;
    if (clientInput) clientInput.value = state.clientName;
  } catch (e) {}
}

// --- Rendering ---
function renderSections() {
  const container = document.getElementById('sections-container');
  if (!container) return;
  container.innerHTML = ''; 

  SECTIONS.forEach((section) => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.innerHTML = `
      <div class="section-header">
        <span class="tag-pill tag-${section.color}">${section.tag}</span>
        <h2 class="section-title">${section.title} <span id="badge-${section.id}" class="badge badge-amber" style="display:none;"></span></h2>
        <p class="section-desc">${section.desc}</p>
      </div>
    `;

    section.sliders.forEach((slider, idx) => {
      if (idx > 0) {
        const div = document.createElement('div');
        div.className = 'divider';
        card.appendChild(div);
      }
      card.appendChild(createSliderRow(slider, section.id));
    });

    container.appendChild(card);
  });
}

function createSliderRow(slider, sectionId) {
  const row = document.createElement('div');
  row.className = 'slider-row';
  row.id = `row-${slider.id}`;
  
  let leftShort = slider.left.label.split('/')[0].trim();
  let rightShort = slider.right.label.split('/')[0].trim();
  
  row.innerHTML = `
    <div class="slider-header">
      <div class="side-label left">
        <div class="label-title" id="lbl-left-${slider.id}"><span class="dot-indicator"></span>${slider.left.label}</div>
        ${slider.left.desc ? `<div class="label-desc">${slider.left.desc}</div>` : ''}
      </div>
      <div class="side-label right">
        <div class="label-title" id="lbl-right-${slider.id}">${slider.right.label}<span class="dot-indicator"></span></div>
        ${slider.right.desc ? `<div class="label-desc">${slider.right.desc}</div>` : ''}
      </div>
    </div>
    <div class="track-bg" id="track-${slider.id}" role="radiogroup" aria-label="${slider.left.label} vs ${slider.right.label}">
      <button class="segment" data-val="-2" aria-label="Strongly ${leftShort}"></button>
      <button class="segment" data-val="-1" aria-label="Leans ${leftShort}"></button>
      <button class="segment" data-val="1" aria-label="Leans ${rightShort}"></button>
      <button class="segment" data-val="2" aria-label="Strongly ${rightShort}"></button>
    </div>
  `;

  setTimeout(() => initSliderInteraction(slider, row), 0);
  return row;
}

// --- Segment Interaction ---
function initSliderInteraction(slider, row) {
  const segments = row.querySelectorAll('.segment');
  
  segments.forEach(seg => {
    seg.addEventListener('click', () => {
      const val = parseInt(seg.getAttribute('data-val'), 10);
      setSliderValue(slider.id, val);
    });
  });
}

function setSliderValue(sliderId, value) {
  state.answers[sliderId] = value;
  saveState();
  updateVisuals(sliderId);
  updateProgress();
}

function getInterpretation(slider, val) {
  if (val === 0) return "Not answered";
  if (val === -2) return `Strongly ${slider.left.label}`;
  if (val === -1) return `Leans ${slider.left.label}`;
  if (val === 1) return `Leans ${slider.right.label}`;
  if (val === 2) return `Strongly ${slider.right.label}`;
}

function updateVisuals(sliderId) {
  const val = state.answers[sliderId];
  
  const lblLeft = document.getElementById(`lbl-left-${sliderId}`);
  const lblRight = document.getElementById(`lbl-right-${sliderId}`);
  const row = document.getElementById(`row-${sliderId}`);
  
  if (!lblLeft || !lblRight || !row) return;
  
  // Update segment active states
  const segments = row.querySelectorAll('.segment');
  segments.forEach(seg => {
    if (parseInt(seg.getAttribute('data-val'), 10) === val) {
      seg.classList.add('active');
    } else {
      seg.classList.remove('active');
    }
  });

  // Label highlighting and row warnings
  if (val !== 0) {
    if (val < 0) {
      lblLeft.className = 'label-title active';
      lblRight.className = 'label-title inactive';
    } else {
      lblLeft.className = 'label-title inactive';
      lblRight.className = 'label-title active';
    }
    row.classList.remove('highlight-unanswered');
  } else {
    if (state.exportAttempted) {
      row.classList.add('highlight-unanswered');
    } else {
      row.classList.remove('highlight-unanswered');
    }
    lblLeft.className = 'label-title';
    lblRight.className = 'label-title';
  }
}

// --- Global UI Updates ---
function updateUI() {
  SECTIONS.forEach(sec => {
    sec.sliders.forEach(sl => updateVisuals(sl.id));
  });
  updateProgress();
  
  const brandInput = document.getElementById('brand-name');
  const clientInput = document.getElementById('client-name');
  if (brandInput) brandInput.value = state.brandName;
  if (clientInput) clientInput.value = state.clientName;
}

function updateProgress() {
  let answered = Object.values(state.answers).filter(v => v !== 0).length;
  let total = 9;
  let remaining = total - answered;
  
  const pChip = document.getElementById('progress-chip');
  const pLink = document.getElementById('progress-link');
  if (!pChip || !pLink) return;
  
  if (remaining === 0) {
    pChip.className = 'chip chip-green';
    pChip.textContent = 'All selections adjusted';
    pLink.style.display = 'none';
  } else {
    pChip.className = 'chip chip-amber';
    pChip.textContent = `${answered} of 9 Adjusted`;
    pLink.style.display = 'inline-block';
    
    // Fixed typo here: changed 'selections${...' to 'selection${...'
    pLink.textContent = `${remaining} selection${remaining > 1 ? 's' : ''} remaining, jump to next`;
    state.allDoneFired = false;
  }
  
  SECTIONS.forEach(sec => {
    let unans = sec.sliders.filter(sl => state.answers[sl.id] === 0).length;
    let badge = document.getElementById(`badge-${sec.id}`);
    if (badge) {
      if (unans > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = `${unans} unanswered`;
      } else {
        badge.style.display = 'none';
      }
    }
  });
}

function getNextUnanswered() {
  for (let sec of SECTIONS) {
    for (let sl of sec.sliders) {
      if (state.answers[sl.id] === 0) return sl.id;
    }
  }
  return null;
}

function scrollToSlider(id) {
  const el = document.getElementById(`row-${id}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const firstSegment = el.querySelector('.segment');
    if (firstSegment) firstSegment.focus();
  }
}

// --- Event Listeners ---
function setupEventListeners() {
  const q = (id) => document.getElementById(id);
  
  if (q('brand-name')) q('brand-name').addEventListener('input', (e) => { state.brandName = e.target.value; saveState(); });
  if (q('client-name')) q('client-name').addEventListener('input', (e) => { state.clientName = e.target.value; saveState(); });
  
  if (q('btn-reset')) q('btn-reset').addEventListener('click', () => {
    // Clear everything
    state.brandName = "";
    state.clientName = "";
    Object.keys(state.answers).forEach(k => state.answers[k] = 0);
    state.exportAttempted = false;
    saveState(); updateUI();
  });
  
  if (q('progress-link')) q('progress-link').addEventListener('click', () => {
    let nextId = getNextUnanswered();
    if (nextId) scrollToSlider(nextId);
  });
  
  if (q('btn-export-pdf')) q('btn-export-pdf').addEventListener('click', () => handleExportAttempt('pdf'));
  
  const exportMenu = q('export-dropdown');
  if (q('btn-export-menu') && exportMenu) {
    q('btn-export-menu').addEventListener('click', (e) => {
      exportMenu.classList.toggle('hidden');
      e.stopPropagation();
    });
    document.addEventListener('click', () => exportMenu.classList.add('hidden'));
  }
  
  if (q('export-dd-pdf')) q('export-dd-pdf').addEventListener('click', () => handleExportAttempt('pdf'));
  if (q('export-dd-json')) q('export-dd-json').addEventListener('click', () => handleExportAttempt('json'));
  if (q('export-dd-csv')) q('export-dd-csv').addEventListener('click', () => handleExportAttempt('csv'));
  if (q('export-dd-copy')) q('export-dd-copy').addEventListener('click', () => handleExportAttempt('copy'));
  
  const modal = q('warning-modal');
  if (modal) {
    if (q('btn-modal-review')) q('btn-modal-review').addEventListener('click', () => {
      modal.close();
      let nextId = getNextUnanswered();
      if (nextId) scrollToSlider(nextId);
    });
    if (q('btn-modal-export')) q('btn-modal-export').addEventListener('click', () => {
      modal.close();
      executeExport(state.pendingExportType || 'pdf');
    });
    modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.close(); });
  }
}

// --- Export Logic ---
function handleExportAttempt(type = 'pdf') {
  let typeString = typeof type === 'string' ? type : 'pdf';
  let unans = Object.values(state.answers).filter(v => v === 0).length;
  
  if (unans > 0) {
    state.exportAttempted = true;
    updateUI(); 
    openModal(unans, typeString);
  } else {
    executeExport(typeString);
  }
}

function openModal(count, type) {
  state.pendingExportType = type;
  const modal = document.getElementById('warning-modal');
  if (!modal) return;

  document.getElementById('modal-title').textContent = `${count} unfilled remaining`;
  
  const list = document.getElementById('modal-unanswered-list');
  list.innerHTML = '';
  
  SECTIONS.forEach(sec => {
    sec.sliders.forEach(sl => {
      if (state.answers[sl.id] === 0) {
        let chip = document.createElement('button');
        chip.className = 'unanswered-chip';
        chip.textContent = `${sl.left.label} / ${sl.right.label}`;
        chip.onclick = () => { modal.close(); scrollToSlider(sl.id); };
        list.appendChild(chip);
      }
    });
  });
  
  modal.showModal();
  document.getElementById('btn-modal-review').focus();
}

function executeExport(type) {
  const unans = Object.values(state.answers).filter(v => v === 0).length;
  
  if (type === 'pdf') exportPDF();
  else if (type === 'json') exportJSON();
  else if (type === 'csv') exportCSV();
  else if (type === 'copy') copyToClipboard();
  
  if (unans > 0) showToast(`${unans} unfilled remaining`);
  else showToast(`this is what you chose`);
}

function generateExportData() {
  let responses = [];
  SECTIONS.forEach(sec => {
    sec.sliders.forEach(sl => {
      let val = state.answers[sl.id];
      responses.push({
        section: sec.title,
        leftLabel: sl.left.label,
        rightLabel: sl.right.label,
        value: val,
        interpretation: getInterpretation(sl, val),
        answered: val !== 0
      });
    });
  });
  return responses;
}

function getFilename(ext) {
  let brand = (state.brandName || 'Brand').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  let date = new Date().toISOString().split('T')[0];
  return `brand-sliders-${brand}-${date}.${ext}`;
}

function exportPDF() {
  const printDiv = document.getElementById('print-summary');
  if (!printDiv) return;
  const date = new Date().toISOString().split('T')[0];
  
  let html = `
    <div class="print-header">
      <div class="print-title">Brand Profile: ${state.brandName || 'Unnamed Brand'}</div>
      <div class="print-meta">Client: ${state.clientName || 'N/A'} &bull; Date: ${date}</div>
    </div>
  `;
  
  SECTIONS.forEach(sec => {
    html += `<div class="print-section"><div class="print-section-title">${sec.title}</div>`;
    sec.sliders.forEach(sl => {
      let val = state.answers[sl.id];
      let unansClass = val === 0 ? 'print-unanswered' : '';
      
      let segsHTML = [-2, -1, 1, 2].map(v => {
        return `<div class="print-segment ${v === val ? 'active' : ''}"></div>`;
      }).join('');
      
      html += `
        <div class="print-row ${unansClass}">
          <div class="print-label left">${sl.left.label}</div>
          <div class="print-track-bg">
            ${segsHTML}
          </div>
          <div class="print-label right">${sl.right.label}</div>
          <div class="print-interpretation">${getInterpretation(sl, val)}</div>
        </div>
      `;
    });
    html += `</div>`;
  });
  
  printDiv.innerHTML = html;
  
  const originalTitle = document.title;
  document.title = getFilename('pdf').replace('.pdf', '');
  window.print();
  document.title = originalTitle;
}

function exportJSON() {
  let data = {
    brandName: state.brandName,
    clientName: state.clientName,
    exportedAt: new Date().toISOString(),
    answeredCount: Object.values(state.answers).filter(v => v !== 0).length,
    responses: generateExportData()
  };
  triggerDownload(JSON.stringify(data, null, 2), 'application/json', getFilename('json'));
}

function exportCSV() {
  let responses = generateExportData();
  let csv = "Section,Left label,Right label,Value,Interpretation,Answered\n";
  responses.forEach(r => {
    let row = [
      `"${r.section}"`, `"${r.leftLabel}"`, `"${r.rightLabel}"`, 
      r.value, `"${r.interpretation}"`, r.answered
    ];
    csv += row.join(',') + "\n";
  });
  triggerDownload(csv, 'text/csv', getFilename('csv'));
}

function copyToClipboard() {
  let text = `BRAND PROFILE: ${state.brandName}\nClient: ${state.clientName}\n\n`;
  generateExportData().forEach(r => {
    text += `[${r.section}] ${r.leftLabel} vs ${r.rightLabel}: ${r.interpretation}\n`;
  });
  navigator.clipboard.writeText(text).catch(err => console.error(err));
}

function triggerDownload(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Toasts ---
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Kickoff
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}