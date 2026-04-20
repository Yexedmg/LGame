/* ============================================
   COLLEGE::RPG — Application Logic
   ============================================ */

// ── Constants ──
const RARITY = {
  5: { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', star: '#FFD700', glow: 'rgba(255,215,0,0.3)', label: '5★ Legendary' },
  4: { bg: 'linear-gradient(135deg, #B388FF, #7C4DFF)', star: '#B388FF', glow: 'rgba(179,136,255,0.3)', label: '4★ Epic' },
  3: { bg: 'linear-gradient(135deg, #64B5F6, #42A5F5)', star: '#64B5F6', glow: 'rgba(100,181,246,0.3)', label: '3★ Rare' },
  2: { bg: 'linear-gradient(135deg, #81C784, #66BB6A)', star: '#81C784', glow: 'rgba(129,199,132,0.3)', label: '2★ Common' },
  1: { bg: 'linear-gradient(135deg, #90A4AE, #78909C)', star: '#90A4AE', glow: 'rgba(144,164,174,0.3)', label: '1★ Basic' },
};

const XP_BASE = 100;
const XP_MULT = 1.4;
const ZONE_COLORS = ['#00E5FF','#FF4081','#FFD740','#00E676','#B388FF','#FF6E40','#64B5F6','#E040FB','#FFAB40','#69F0AE'];

const DEFAULT_LOCATIONS = [
  { id:'l1', name:'Your Floor (Informatica)', type:'Daily Hub', drops:['Same-major peers','Weak ties','Reputation XP','Group project partners'], obtained:[], difficulty:'Easy', visited:true },
  { id:'l2', name:'Other Major Floors', type:'Exploration Zone', drops:['Cross-pollination contacts','Different perspectives','Unexpected collaborations'], obtained:[], difficulty:'Medium', visited:false },
  { id:'l3', name:'Studievereniging', type:'Event Domain', drops:['Company connections','Hackathon access','Career events','Industry weak ties'], obtained:[], difficulty:'Medium', visited:false },
  { id:'l4', name:'Canteen / Common Area', type:'Social Hub', drops:['Serendipity encounters','Cross-major weak ties','Casual reputation building'], obtained:[], difficulty:'Easy', visited:true },
  { id:'l5', name:'Minor (Other Hogeschool)', type:'Raid Zone', drops:['Entirely new network','New skill tree','Study abroad contacts','Fresh perspective'], obtained:[], difficulty:'Hard', visited:false },
  { id:'l6', name:'Stage / Internship', type:'Boss Domain', drops:['Real work experience','Professional network','Hiring pipeline access','Industry reputation'], obtained:[], difficulty:'Hard', visited:false },
  { id:'l7', name:'Faculty Offices', type:'Hidden Quest', drops:['Industry introductions','Project mentorship','Reference letters','Insider knowledge'], obtained:[], difficulty:'Medium', visited:false },
  { id:'l8', name:'Library / Study Spaces', type:'Grinding Zone', drops:['Focus hours','Random encounters','Study group formation'], obtained:[], difficulty:'Easy', visited:false },
];

function defaultData() {
  return {
    player: { level: 1, xp: 0 },
    characters: [],
    learningMaterial: [],
    parties: [],
    activePartyId: null,
    locations: JSON.parse(JSON.stringify(DEFAULT_LOCATIONS)),
    mapZones: [],
    log: [],
  };
}

// ── State ──
let D = defaultData();
let currentPage = 'home';
let currentPartyIndex = 0;
let currentInvTab = 'characters';
let summonType = null;
let selectedMapZone = null;
let mapDrag = null;

// ── Persistence ──
function save() {
  try { localStorage.setItem('college-rpg-data', JSON.stringify(D)); } catch(e) {}
}
function load() {
  try {
    const raw = localStorage.getItem('college-rpg-data');
    if (raw) {
      const parsed = JSON.parse(raw);
      D = { ...defaultData(), ...parsed };
      // ensure arrays exist
      D.locations.forEach(l => { if (!l.obtained) l.obtained = []; });
      if (!D.learningMaterial) D.learningMaterial = [];
      if (!D.mapZones) D.mapZones = [];
      if (!D.parties) D.parties = [];
    }
  } catch(e) {}
}

// ── XP System ──
function xpForLevel(lvl) { return Math.floor(XP_BASE * Math.pow(XP_MULT, lvl - 1)); }

function addXP(amount, reason) {
  D.player.xp += amount;
  let needed = xpForLevel(D.player.level);
  let leveled = false;
  while (D.player.xp >= needed) {
    D.player.xp -= needed;
    D.player.level++;
    leveled = true;
    needed = xpForLevel(D.player.level);
  }
  addLog(`+${amount} XP — ${reason}`);
  save();
  if (leveled) showLevelUp(D.player.level);
  updateXPDisplay();
}

function updateXPDisplay() {
  const needed = xpForLevel(D.player.level);
  const pct = Math.min((D.player.xp / needed) * 100, 100);
  const el = document.getElementById('home-xp-bar');
  const txt = document.getElementById('home-xp-text');
  const lvl = document.getElementById('home-level');
  if (el) el.style.width = pct + '%';
  if (txt) txt.textContent = `${D.player.xp} / ${needed} XP`;
  if (lvl) lvl.textContent = D.player.level;
}

function showLevelUp(level) {
  const div = document.createElement('div');
  div.className = 'level-up-banner';
  div.innerHTML = `<div class="level-up-title">LEVEL UP!</div><div class="level-up-number">${level}</div>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

// ── Log ──
function addLog(msg) {
  D.log.push({ t: Date.now(), msg });
  if (D.log.length > 100) D.log = D.log.slice(-100);
  save();
}

// ── Navigation ──
function navigateTo(page) {
  document.querySelectorAll('.page:not(.overlay-page)').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.overlay-page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); el.querySelector('.page-scroll')?.classList.add('page-enter'); }
  document.querySelectorAll('.dock-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  currentPage = page;
  renderPage(page);
}

function showPage(page) {
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); el.querySelector('.page-scroll')?.classList.add('page-enter'); }
  renderPage(page);
}

function hideOverlay() {
  document.querySelectorAll('.overlay-page').forEach(p => p.classList.remove('active'));
}

// ── Modal ──
function openModal(html) {
  document.getElementById('modal-content').innerHTML = '<div class="modal-handle"></div>' + html;
  document.getElementById('modal-backdrop').classList.add('visible');
  document.getElementById('modal-container').classList.add('visible');
}
function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('visible');
  document.getElementById('modal-container').classList.remove('visible');
}

// ── Stars helper ──
function stars(n) { return '★'.repeat(n); }
function rarityColor(r) { return RARITY[r] || RARITY[1]; }

// ── Render Router ──
function renderPage(page) {
  switch(page) {
    case 'home': renderHome(); break;
    case 'party': renderParty(); break;
    case 'summon': renderSummonPage(); renderSummonHistory(); break;
    case 'locations': renderLocations(); break;
    case 'inventory': renderInventory(); break;
    case 'stats': renderStats(); break;
    case 'map': renderMap(); break;
  }
}

// ══════════════════════════════════════════
//  HOME PAGE
// ══════════════════════════════════════════
function renderHome() {
  updateXPDisplay();
  // Stats cards
  const grid = document.getElementById('home-stats-grid');
  const totalChars = D.characters.length;
  const totalMats = D.learningMaterial.length;
  const explored = D.locations.filter(l => l.visited).length;
  const totalParties = D.parties.length;
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-card-value">${totalChars}</div><div class="stat-card-label">Characters</div></div>
    <div class="stat-card"><div class="stat-card-value">${totalMats}</div><div class="stat-card-label">Materials</div></div>
    <div class="stat-card"><div class="stat-card-value">${explored}/${D.locations.length}</div><div class="stat-card-label">Explored</div></div>
  `;
  // Active party
  const preview = document.getElementById('home-party-preview');
  const activeParty = D.parties.find(p => p.id === D.activePartyId);
  if (activeParty && activeParty.members.length > 0) {
    const chars = activeParty.members.map(id => D.characters.find(c => c.id === id)).filter(Boolean);
    preview.innerHTML = chars.map(c => `
      <div class="party-mini" style="border-color:${rarityColor(c.rarity).star}">
        <div class="party-mini-avatar" style="background:${rarityColor(c.rarity).bg}">${c.name.charAt(0).toUpperCase()}</div>
        <div class="party-mini-name">${c.name}</div>
        <div class="party-mini-stars" style="color:${rarityColor(c.rarity).star}">${stars(c.rarity)}</div>
      </div>
    `).join('');
  } else {
    preview.innerHTML = '<div class="empty-state">No active party set. Go to Party tab to create one.</div>';
  }
  // Activity feed
  const feed = document.getElementById('home-activity-feed');
  if (D.log.length === 0) {
    feed.innerHTML = '<div class="empty-state">No activity yet. Start summoning!</div>';
  } else {
    feed.innerHTML = D.log.slice(-8).reverse().map(e => `
      <div class="activity-entry">
        <span class="activity-time">${new Date(e.t).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</span>
        <span class="activity-msg">${e.msg}</span>
      </div>
    `).join('');
  }
}

// ══════════════════════════════════════════
//  PARTY PAGE
// ══════════════════════════════════════════
function renderParty() {
  const tabs = document.getElementById('party-tabs');
  if (D.parties.length === 0) {
    tabs.innerHTML = '';
    document.getElementById('party-detail').innerHTML = '<div class="empty-state">No parties yet. Create your first party!</div>';
    return;
  }
  if (currentPartyIndex >= D.parties.length) currentPartyIndex = 0;
  tabs.innerHTML = D.parties.map((p, i) => `
    <button class="party-tab ${i === currentPartyIndex ? 'active' : ''}" onclick="selectPartyTab(${i})">${p.name}</button>
  `).join('');
  renderPartyDetail();
}

function selectPartyTab(i) {
  currentPartyIndex = i;
  renderParty();
}

function renderPartyDetail() {
  const party = D.parties[currentPartyIndex];
  if (!party) return;
  const members = party.members.map(id => D.characters.find(c => c.id === id)).filter(Boolean);
  const bench = D.characters.filter(c => !party.members.includes(c.id));
  const devPct = (party.devLevel / 10) * 100;
  const detail = document.getElementById('party-detail');
  detail.innerHTML = `
    <div class="party-info-card">
      <div class="party-name-row">
        <div class="party-name">${party.name}</div>
        <div class="flex-row">
          <button class="small-btn" onclick="openEditPartyModal(${currentPartyIndex})">Edit</button>
          <button class="small-btn" style="border-color:var(--red);color:var(--red)" onclick="deleteParty(${currentPartyIndex})">Delete</button>
        </div>
      </div>
      <div class="party-dev-level">
        <span class="party-dev-label">Dev Level</span>
        <div class="party-dev-bar"><div class="party-dev-fill" style="width:${devPct}%"></div></div>
        <span class="party-dev-value">${party.devLevel}/10</span>
      </div>
      ${party.origin ? `<div class="party-origin"><strong>ORIGIN:</strong> ${party.origin}</div>` : ''}
      ${party.notes ? `<div class="party-origin" style="margin-top:4px"><strong>NOTES:</strong> ${party.notes}</div>` : ''}
      <div style="margin-top:8px">
        <button class="small-btn ${D.activePartyId === party.id ? 'style="border-color:var(--green);color:var(--green)"' : ''}" onclick="setActiveParty('${party.id}')">${D.activePartyId === party.id ? '✓ Active' : 'Set Active'}</button>
      </div>
    </div>
    <div class="section-header"><span>MEMBERS (${members.length})</span></div>
    ${members.length === 0 ? '<div class="empty-state">No members. Add from bench below.</div>' : `
      <div class="party-members-grid">
        ${members.map(c => `
          <div class="party-member-card" style="border-color:${rarityColor(c.rarity).star};box-shadow:0 0 15px ${rarityColor(c.rarity).glow}">
            <div class="party-member-avatar" style="background:${rarityColor(c.rarity).bg}">${c.name.charAt(0).toUpperCase()}</div>
            <div class="party-member-info">
              <div class="party-member-name">${c.name}</div>
              <div class="party-member-stars" style="color:${rarityColor(c.rarity).star}">${stars(c.rarity)}</div>
              ${c.location ? `<div class="party-member-location">${c.location}</div>` : ''}
            </div>
            <button class="party-remove-btn" onclick="removeFromParty(${currentPartyIndex},'${c.id}')">✕</button>
          </div>
        `).join('')}
      </div>
    `}
    <div class="section-header"><span>BENCH (${bench.length})</span></div>
    ${bench.length === 0 ? '<div class="empty-state">All characters are in this party, or no characters pulled yet.</div>' : `
      <div class="bench-grid">
        ${bench.map(c => `
          <div class="bench-card">
            <div class="bench-avatar" style="background:${rarityColor(c.rarity).bg}">${c.name.charAt(0).toUpperCase()}</div>
            <div class="bench-info">
              <div class="bench-name">${c.name}</div>
              <div class="bench-stars" style="color:${rarityColor(c.rarity).star}">${stars(c.rarity)}</div>
            </div>
            <button class="bench-add-btn" onclick="addToParty(${currentPartyIndex},'${c.id}')">+ Add</button>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

function addToParty(pi, charId) {
  if (!D.parties[pi].members.includes(charId)) {
    D.parties[pi].members.push(charId);
    save(); renderPartyDetail();
  }
}
function removeFromParty(pi, charId) {
  D.parties[pi].members = D.parties[pi].members.filter(id => id !== charId);
  save(); renderPartyDetail();
}
function setActiveParty(id) {
  D.activePartyId = id; save(); renderPartyDetail();
}
function deleteParty(pi) {
  if (!confirm('Delete this party?')) return;
  const name = D.parties[pi].name;
  if (D.activePartyId === D.parties[pi].id) D.activePartyId = null;
  D.parties.splice(pi, 1);
  currentPartyIndex = 0;
  addLog(`Disbanded party: ${name}`);
  save(); renderParty();
}

function openAddPartyModal() {
  openModal(`
    <div class="modal-title">NEW PARTY</div>
    <div class="field-group"><label class="field-label">Party Name</label><input class="field-input" id="m-party-name" placeholder="e.g. Study Squad" /></div>
    <div class="field-group"><label class="field-label">Origin / Where formed</label><input class="field-input" id="m-party-origin" placeholder="e.g. Library meetup" /></div>
    <div class="field-group"><label class="field-label">Notes</label><textarea class="field-input" id="m-party-notes" placeholder="Optional notes..."></textarea></div>
    <div class="modal-actions">
      <button class="action-btn success" onclick="confirmAddParty()">Create Party</button>
      <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function confirmAddParty() {
  const name = document.getElementById('m-party-name').value.trim();
  if (!name) return;
  const party = { id: 'p' + Date.now(), name, members: [], devLevel: 1, origin: document.getElementById('m-party-origin').value.trim(), notes: document.getElementById('m-party-notes').value.trim() };
  D.parties.push(party);
  if (!D.activePartyId) D.activePartyId = party.id;
  addLog(`Created party: ${name}`);
  save(); closeModal();
  currentPartyIndex = D.parties.length - 1;
  renderParty();
}

function openEditPartyModal(pi) {
  const p = D.parties[pi];
  openModal(`
    <div class="modal-title">EDIT PARTY</div>
    <div class="field-group"><label class="field-label">Party Name</label><input class="field-input" id="m-ep-name" value="${p.name}" /></div>
    <div class="field-group"><label class="field-label">Origin</label><input class="field-input" id="m-ep-origin" value="${p.origin || ''}" /></div>
    <div class="field-group"><label class="field-label">Dev Level (1-10)</label><input type="number" class="field-input" id="m-ep-dev" min="1" max="10" value="${p.devLevel}" /></div>
    <div class="field-group"><label class="field-label">Notes</label><textarea class="field-input" id="m-ep-notes">${p.notes || ''}</textarea></div>
    <div class="modal-actions">
      <button class="action-btn success" onclick="confirmEditParty(${pi})">Save</button>
      <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function confirmEditParty(pi) {
  D.parties[pi].name = document.getElementById('m-ep-name').value.trim() || D.parties[pi].name;
  D.parties[pi].origin = document.getElementById('m-ep-origin').value.trim();
  D.parties[pi].devLevel = Math.max(1, Math.min(10, parseInt(document.getElementById('m-ep-dev').value) || 1));
  D.parties[pi].notes = document.getElementById('m-ep-notes').value.trim();
  save(); closeModal(); renderParty();
}

// ══════════════════════════════════════════
//  SUMMON PAGE — BANNER SYSTEM
// ══════════════════════════════════════════
let currentBannerIndex = 0;
let currentSummonType = 'character';

// Banner colors per difficulty
const BANNER_COLORS = {
  Easy:   { bg: 'linear-gradient(135deg, #0D3B2E, #0A2A1F)', accent: '#00E676' },
  Medium: { bg: 'linear-gradient(135deg, #2A2400, #1A1700)', accent: '#FFD740' },
  Hard:   { bg: 'linear-gradient(135deg, #2A0A0A, #1A0505)', accent: '#FF5252' },
};

function renderSummonPage() {
  if (D.locations.length === 0) {
    document.getElementById('banner-card').innerHTML = '<div class="empty-state" style="padding:40px 0">No locations yet.<br>Add locations from the Locations tab to create banners!</div>';
    document.getElementById('banner-dots').innerHTML = '';
    document.getElementById('banner-drop-list').innerHTML = '<div class="empty-state">Add locations to see drop lists.</div>';
    document.getElementById('summon-action-area').style.display = 'none';
    document.getElementById('banner-loc-type').textContent = '';
    return;
  }
  if (currentBannerIndex >= D.locations.length) currentBannerIndex = 0;
  if (currentBannerIndex < 0) currentBannerIndex = D.locations.length - 1;
  const loc = D.locations[currentBannerIndex];
  const colors = BANNER_COLORS[loc.difficulty] || BANNER_COLORS.Medium;
  const charsHere = D.characters.filter(c => c.location === loc.name);
  const matsHere = D.learningMaterial.filter(m => m.source === loc.name);
  const totalPulled = charsHere.length + matsHere.length;
  const obtainableCount = loc.drops.filter(d => !loc.obtained.includes(d)).length;
  const diffColor = loc.difficulty==='Easy'?'var(--green)':loc.difficulty==='Medium'?'var(--yellow)':'var(--red)';

  // Render banner card
  document.getElementById('banner-card').innerHTML = `
    <div class="banner-bg" style="background:${colors.bg}">
      <div class="banner-bg-pattern" style="color:${colors.accent}"></div>
    </div>
    <div class="banner-difficulty-badge" style="color:${diffColor};border-color:${diffColor};background:rgba(0,0,0,0.4)">
      ${loc.difficulty === 'Easy' ? '●' : loc.difficulty === 'Medium' ? '●●' : '●●●'} ${loc.difficulty}
    </div>
    <div class="banner-card-inner">
      <div class="banner-loc-name">${loc.name}</div>
      <div class="banner-loc-subtitle">${loc.type}</div>
      ${obtainableCount > 0 ? `<div class="banner-featured-tag">⚡ ${obtainableCount} obtainable</div>` : '<div class="banner-featured-tag" style="color:var(--green);background:rgba(0,230,118,0.1);border-color:rgba(0,230,118,0.3)">✓ ALL OBTAINED</div>'}
      ${totalPulled > 0 ? `<div class="banner-chars-pulled">👤 ${totalPulled} pulled from here</div>` : ''}
    </div>
  `;

  // Render dots
  document.getElementById('banner-dots').innerHTML = D.locations.map((_, i) =>
    `<div class="banner-dot ${i === currentBannerIndex ? 'active' : ''}" onclick="goToBanner(${i})"></div>`
  ).join('');

  // Banner loc type
  document.getElementById('banner-loc-type').textContent = loc.type;

  // Render drop list
  renderBannerDropList(loc, charsHere, matsHere);

  // Show summon area
  document.getElementById('summon-action-area').style.display = 'block';
}

function renderBannerDropList(loc, charsHere, matsHere) {
  const el = document.getElementById('banner-drop-list');
  if (loc.drops.length === 0 && charsHere.length === 0 && matsHere.length === 0) {
    el.innerHTML = '<div class="empty-state">No drops defined for this location. Edit the location to add drops.</div>';
    return;
  }

  let html = '';

  // Show characters pulled from here as "featured"
  if (charsHere.length > 0) {
    html += `<div style="font-size:10px;color:var(--text-muted);letter-spacing:1px;margin:4px 0;font-weight:700">CHARACTERS OBTAINED</div>`;
    charsHere.forEach(c => {
      html += `
        <div class="drop-list-item obtained" onclick="openCharDetail('${c.id}')">
          <div class="drop-list-icon" style="background:${rarityColor(c.rarity).bg};border-radius:50%;color:#111;font-weight:800;font-size:14px">${c.name.charAt(0).toUpperCase()}</div>
          <div class="drop-list-info">
            <div class="drop-list-name">${c.name}</div>
            <div class="drop-list-meta" style="color:${rarityColor(c.rarity).star}">${stars(c.rarity)} ${RARITY[c.rarity].label}</div>
          </div>
          <span class="drop-list-status got">✓ GOT</span>
        </div>
      `;
    });
  }

  // Show learning materials obtained here
  if (matsHere.length > 0) {
    html += `<div style="font-size:10px;color:var(--text-muted);letter-spacing:1px;margin:8px 0 4px;font-weight:700">MATERIALS OBTAINED</div>`;
    matsHere.forEach(m => {
      html += `
        <div class="drop-list-item obtained" onclick="openMaterialDetail('${m.id}')">
          <div class="drop-list-icon" style="background:linear-gradient(135deg,#7C4DFF,#B388FF);border-radius:8px">${m.type==='Book'?'📖':m.type==='Course'?'🎓':m.type==='Video'?'🎬':'📦'}</div>
          <div class="drop-list-info">
            <div class="drop-list-name">${m.name}</div>
            <div class="drop-list-meta">${m.type}</div>
          </div>
          <span class="drop-list-status got">✓ GOT</span>
        </div>
      `;
    });
  }

  // Show drops (obtainable items from this location)
  if (loc.drops.length > 0) {
    html += `<div style="font-size:10px;color:var(--text-muted);letter-spacing:1px;margin:8px 0 4px;font-weight:700">OBTAINABLE DROPS</div>`;
    loc.drops.forEach(drop => {
      const got = loc.obtained.includes(drop);
      html += `
        <div class="drop-list-item ${got ? 'obtained' : ''}" onclick="toggleBannerDrop(${currentBannerIndex}, '${drop.replace(/'/g, "\\'")}')">
          <div class="drop-list-icon" style="background:${got ? 'rgba(0,230,118,0.1)' : 'rgba(255,215,64,0.1)'};border-radius:8px;color:${got ? 'var(--green)' : 'var(--yellow)'}">${got ? '✓' : '⚡'}</div>
          <div class="drop-list-info">
            <div class="drop-list-name">${drop}</div>
            <div class="drop-list-meta">${got ? 'Obtained' : 'Available'}</div>
          </div>
          <span class="drop-list-status ${got ? 'got' : 'available'}">${got ? '✓ GOT' : 'OBTAINABLE'}</span>
        </div>
      `;
    });
  }

  el.innerHTML = html;
}

function toggleBannerDrop(locIdx, drop) {
  const loc = D.locations[locIdx];
  if (loc.obtained.includes(drop)) {
    loc.obtained = loc.obtained.filter(d => d !== drop);
  } else {
    loc.obtained.push(drop);
    addXP(10, `Obtained: ${drop}`);
  }
  save();
  renderSummonPage();
}

let bannerAnimating = false;

function slideBanner(newIndex, direction) {
  if (bannerAnimating || D.locations.length === 0) return;
  if (newIndex === currentBannerIndex) return;
  bannerAnimating = true;
  const card = document.getElementById('banner-card');
  const outClass = direction === 'left' ? 'slide-out-left' : 'slide-out-right';
  const inClass = direction === 'left' ? 'slide-in-right' : 'slide-in-left';
  card.classList.add(outClass);
  setTimeout(() => {
    card.classList.remove(outClass);
    currentBannerIndex = newIndex;
    renderSummonPage();
    card.classList.add(inClass);
    setTimeout(() => {
      card.classList.remove(inClass);
      bannerAnimating = false;
    }, 300);
  }, 280);
}

function prevBanner() {
  const newIdx = (currentBannerIndex - 1 + D.locations.length) % D.locations.length;
  slideBanner(newIdx, 'right');
}

function nextBanner() {
  const newIdx = (currentBannerIndex + 1) % D.locations.length;
  slideBanner(newIdx, 'left');
}

function goToBanner(i) {
  if (i === currentBannerIndex) return;
  slideBanner(i, i > currentBannerIndex ? 'left' : 'right');
}

function pickSummonType(type) {
  currentSummonType = type;
  document.getElementById('stype-character').classList.toggle('active', type === 'character');
  document.getElementById('stype-learning').classList.toggle('active', type === 'learning');
}

function startBannerSummon() {
  summonType = currentSummonType;
  // Hide banner UI, show animation
  document.getElementById('summon-action-area').style.display = 'none';
  const anim = document.getElementById('summon-animation');
  anim.style.display = 'flex';
  // Generate particles
  const particles = document.getElementById('summon-particles');
  particles.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'summon-particle';
    const angle = (i / 12) * Math.PI * 2;
    const dist = 50 + Math.random() * 30;
    p.style.cssText = `--px:${Math.cos(angle)*dist}px;--py:${Math.sin(angle)*dist}px;background:var(--cyan);animation-delay:${i*0.15}s`;
    particles.appendChild(p);
  }
  anim.onclick = () => revealSummon();
}

function revealSummon() {
  document.getElementById('summon-animation').style.display = 'none';
  const form = document.getElementById('summon-form');
  form.style.display = 'block';
  const isChar = summonType === 'character';
  const bannerLoc = D.locations[currentBannerIndex];
  const locName = bannerLoc ? bannerLoc.name : '';
  document.getElementById('summon-form-title').textContent = isChar ? 'NEW CHARACTER PULLED' : 'NEW LEARNING MATERIAL';
  if (isChar) {
    document.getElementById('summon-form-fields').innerHTML = `
      <div style="text-align:center;font-size:11px;color:var(--cyan);margin-bottom:12px;letter-spacing:1px">FROM: ${locName}</div>
      <div class="field-group"><label class="field-label">Name</label><input class="field-input" id="sf-name" placeholder="Who did you meet?" /></div>
      <div class="field-group"><label class="field-label">Rarity</label>
        <div class="rarity-picker">${[1,2,3,4,5].map(r => `<button class="rarity-btn" data-r="${r}" onclick="pickSummonRarity(${r})">${stars(r)}</button>`).join('')}</div>
      </div>
      <input type="hidden" id="sf-location" value="${locName}" />
      <div class="field-group"><label class="field-label">Notes</label><input class="field-input" id="sf-notes" placeholder="Optional notes" /></div>
      <div class="field-group"><label class="field-label">Tags (comma separated)</label><input class="field-input" id="sf-tags" placeholder="e.g. motivated, funny" /></div>
      <input type="hidden" id="sf-rarity" value="3" />
      <div class="modal-actions">
        <button class="action-btn success" onclick="confirmSummon()">Confirm Pull</button>
        <button class="action-btn" style="opacity:0.6" onclick="cancelSummon()">Cancel</button>
      </div>
    `;
    pickSummonRarity(3);
  } else {
    document.getElementById('summon-form-fields').innerHTML = `
      <div style="text-align:center;font-size:11px;color:var(--cyan);margin-bottom:12px;letter-spacing:1px">FROM: ${locName}</div>
      <div class="field-group"><label class="field-label">Name / Title</label><input class="field-input" id="sf-name" placeholder="What did you find?" /></div>
      <div class="field-group"><label class="field-label">Type</label><select class="field-input" id="sf-type">
        <option value="Book">📖 Book</option><option value="Course">🎓 Course</option><option value="Article">📄 Article</option>
        <option value="Video">🎬 Video</option><option value="Tutorial">💻 Tutorial</option><option value="Workshop">🛠️ Workshop</option><option value="Other">📦 Other</option>
      </select></div>
      <input type="hidden" id="sf-location" value="${locName}" />
      <div class="field-group"><label class="field-label">Notes</label><textarea class="field-input" id="sf-notes" placeholder="What's it about?"></textarea></div>
      <div class="modal-actions">
        <button class="action-btn success" onclick="confirmSummonMaterial()">Add Material</button>
        <button class="action-btn" style="opacity:0.6" onclick="cancelSummon()">Cancel</button>
      </div>
    `;
  }
}

function pickSummonRarity(r) {
  document.getElementById('sf-rarity').value = r;
  document.querySelectorAll('#summon-form-fields .rarity-btn').forEach(b => {
    const br = parseInt(b.dataset.r);
    b.classList.toggle('active', br === r);
    if (br === r) { b.style.background = RARITY[r].bg; b.style.color = '#fff'; }
    else { b.style.background = ''; b.style.color = ''; }
  });
}

function confirmSummon() {
  const name = document.getElementById('sf-name').value.trim();
  if (!name) return;
  const rarity = parseInt(document.getElementById('sf-rarity').value);
  const c = {
    id: 'c' + Date.now(), name, rarity,
    location: document.getElementById('sf-location').value,
    notes: document.getElementById('sf-notes').value.trim(),
    tags: (document.getElementById('sf-tags').value || '').split(',').map(s=>s.trim()).filter(Boolean),
    obtainedDate: Date.now(),
  };
  D.characters.push(c);
  addXP(rarity * 15, `Pulled ${name}`);
  addLog(`Pulled ${name} (${RARITY[rarity].label}) from ${c.location}`);
  save(); cancelSummon(); renderSummonPage(); renderSummonHistory();
}

function confirmSummonMaterial() {
  const name = document.getElementById('sf-name').value.trim();
  if (!name) return;
  const mat = {
    id: 'm' + Date.now(), name,
    type: document.getElementById('sf-type').value,
    source: document.getElementById('sf-location').value,
    notes: document.getElementById('sf-notes').value.trim(),
    obtainedDate: Date.now(),
  };
  D.learningMaterial.push(mat);
  addXP(20, `Found: ${name}`);
  addLog(`Found material: ${name} at ${mat.source}`);
  save(); cancelSummon(); renderSummonPage(); renderSummonHistory();
}

function cancelSummon() {
  document.getElementById('summon-animation').style.display = 'none';
  document.getElementById('summon-form').style.display = 'none';
  document.getElementById('summon-action-area').style.display = 'block';
  summonType = null;
}

function renderSummonHistory() {
  const el = document.getElementById('summon-history');
  const allPulls = [
    ...D.characters.map(c => ({ ...c, _type:'char' })),
    ...D.learningMaterial.map(m => ({ ...m, _type:'mat' }))
  ].sort((a,b) => (b.obtainedDate||0) - (a.obtainedDate||0)).slice(0, 15);
  if (allPulls.length === 0) { el.innerHTML = '<div class="empty-state">No pulls yet.</div>'; return; }
  el.innerHTML = allPulls.map(p => {
    if (p._type === 'char') {
      return `<div class="summon-history-entry">
        <div class="summon-history-avatar" style="background:${rarityColor(p.rarity).bg}">${p.name.charAt(0).toUpperCase()}</div>
        <span class="summon-history-name">${p.name}</span>
        <span class="summon-history-stars" style="color:${rarityColor(p.rarity).star}">${stars(p.rarity)}</span>
        <span class="summon-history-time">${p.obtainedDate ? new Date(p.obtainedDate).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}) : ''}</span>
      </div>`;
    } else {
      return `<div class="summon-history-entry">
        <div class="summon-history-avatar" style="background:linear-gradient(135deg,#7C4DFF,#B388FF)">📚</div>
        <span class="summon-history-name">${p.name}</span>
        <span class="summon-history-stars" style="color:var(--purple)">${p.type}</span>
        <span class="summon-history-time">${p.obtainedDate ? new Date(p.obtainedDate).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}) : ''}</span>
      </div>`;
    }
  }).join('');
}

// ══════════════════════════════════════════
//  LOCATIONS PAGE
// ══════════════════════════════════════════
function renderLocations() {
  document.getElementById('locations-count').textContent = `LOCATIONS (${D.locations.length})`;
  const list = document.getElementById('locations-list');
  if (D.locations.length === 0) { list.innerHTML = '<div class="empty-state">No locations.</div>'; return; }
  list.innerHTML = D.locations.map((loc,i) => {
    const charsHere = D.characters.filter(c => c.location === loc.name).length;
    const obtainableCount = loc.drops.filter(d => !loc.obtained.includes(d)).length;
    const diffColor = loc.difficulty==='Easy'?'var(--green)':loc.difficulty==='Medium'?'var(--yellow)':'var(--red)';
    const diffDots = loc.difficulty==='Easy'?'●':loc.difficulty==='Medium'?'●●':'●●●';
    return `<div class="location-card ${loc.visited?'explored':''}" onclick="openLocationDetail(${i})">
      <div class="loc-header">
        <span class="loc-name">${loc.name}</span>
        ${loc.visited ? '<span class="loc-explored-badge">✓</span>' : ''}
      </div>
      <div class="loc-type">${loc.type}</div>
      <div class="loc-difficulty"><span style="color:${diffColor}">${diffDots} ${loc.difficulty}</span></div>
      <div class="loc-drops">
        ${loc.drops.slice(0,3).map(d => `<span class="loc-drop-chip ${loc.obtained.includes(d)?'obtained':''}">${d}</span>`).join('')}
        ${loc.drops.length > 3 ? `<span class="loc-drop-chip">+${loc.drops.length-3}</span>` : ''}
      </div>
      ${obtainableCount > 0 ? `<div class="loc-chars-count" style="color:var(--yellow)">⚡ ${obtainableCount} obtainable</div>` : ''}
      ${charsHere > 0 ? `<div class="loc-chars-count">👤 ${charsHere} met here</div>` : ''}
    </div>`;
  }).join('');
}

function openLocationDetail(i) {
  const loc = D.locations[i];
  const charsHere = D.characters.filter(c => c.location === loc.name);
  openModal(`
    <div class="modal-title">${loc.name}</div>
    <div style="color:var(--cyan);font-size:11px;letter-spacing:1px;text-align:center;margin-bottom:12px">${loc.type} — ${loc.difficulty}</div>
    <div class="field-label" style="margin-bottom:6px">OBTAINABLE DROPS:</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
      ${loc.drops.map(d => {
        const got = loc.obtained.includes(d);
        return `<span class="loc-drop-chip ${got?'obtained':''}" style="cursor:pointer" onclick="toggleObtained(${i},'${d.replace(/'/g,"\\'")}')">${got?'✓ ':''}${d}</span>`;
      }).join('')}
    </div>
    ${charsHere.length > 0 ? `
      <div class="field-label" style="margin-bottom:6px">CHARACTERS MET HERE (${charsHere.length}):</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
        ${charsHere.map(c => `<span class="tag" style="border-color:${rarityColor(c.rarity).star};color:${rarityColor(c.rarity).star}">${c.name} ${stars(c.rarity)}</span>`).join('')}
      </div>
    ` : ''}
    <div class="modal-actions">
      <button class="action-btn" onclick="toggleExplored(${i})">${loc.visited ? 'Mark Unexplored' : 'Mark Explored'}</button>
      <button class="action-btn" onclick="openEditLocationModal(${i})">Edit</button>
      <button class="action-btn danger" onclick="deleteLocation(${i})">Delete</button>
    </div>
    <div style="margin-top:8px"><button class="action-btn w-full" style="opacity:0.6" onclick="closeModal()">Close</button></div>
  `);
}

function toggleObtained(i, drop) {
  const loc = D.locations[i];
  if (loc.obtained.includes(drop)) loc.obtained = loc.obtained.filter(d => d !== drop);
  else { loc.obtained.push(drop); addXP(10, `Obtained: ${drop}`); }
  save(); openLocationDetail(i);
}

function toggleExplored(i) {
  D.locations[i].visited = !D.locations[i].visited;
  if (D.locations[i].visited) addXP(25, `Explored: ${D.locations[i].name}`);
  save(); closeModal(); renderLocations();
}

function deleteLocation(i) {
  if (!confirm('Delete this location?')) return;
  D.locations.splice(i, 1); save(); closeModal(); renderLocations();
}

function openAddLocationModal() {
  openModal(`
    <div class="modal-title">NEW LOCATION</div>
    <div class="field-group"><label class="field-label">Name</label><input class="field-input" id="m-loc-name" placeholder="Location name" /></div>
    <div class="field-group"><label class="field-label">Type</label><input class="field-input" id="m-loc-type" placeholder="e.g. Social Hub, Raid Zone" /></div>
    <div class="field-group"><label class="field-label">Drops (comma separated)</label><input class="field-input" id="m-loc-drops" placeholder="e.g. Contacts, Skills, XP" /></div>
    <div class="field-group"><label class="field-label">Difficulty</label>
      <div class="difficulty-picker">
        <button class="difficulty-btn active" id="diff-easy" onclick="pickDifficulty('Easy')" style="background:var(--green);color:#111">Easy</button>
        <button class="difficulty-btn" id="diff-medium" onclick="pickDifficulty('Medium')">Medium</button>
        <button class="difficulty-btn" id="diff-hard" onclick="pickDifficulty('Hard')">Hard</button>
      </div>
      <input type="hidden" id="m-loc-diff" value="Easy" />
    </div>
    <div class="modal-actions">
      <button class="action-btn success" onclick="confirmAddLocation()">Add Location</button>
      <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function pickDifficulty(d) {
  document.getElementById('m-loc-diff').value = d;
  ['Easy','Medium','Hard'].forEach(dd => {
    const btn = document.getElementById('diff-'+dd.toLowerCase());
    if (!btn) return;
    btn.classList.toggle('active', dd === d);
    btn.style.background = dd === d ? (dd==='Easy'?'var(--green)':dd==='Medium'?'var(--yellow)':'var(--red)') : '';
    btn.style.color = dd === d ? '#111' : '';
  });
}

function confirmAddLocation() {
  const name = document.getElementById('m-loc-name').value.trim();
  if (!name) return;
  D.locations.push({
    id: 'l' + Date.now(), name,
    type: document.getElementById('m-loc-type').value.trim() || 'Unknown',
    drops: document.getElementById('m-loc-drops').value.split(',').map(s=>s.trim()).filter(Boolean),
    obtained: [], difficulty: document.getElementById('m-loc-diff').value, visited: false,
  });
  addLog(`Discovered location: ${name}`);
  save(); closeModal(); renderLocations();
}

function openEditLocationModal(i) {
  const loc = D.locations[i];
  closeModal();
  setTimeout(() => {
    openModal(`
      <div class="modal-title">EDIT LOCATION</div>
      <div class="field-group"><label class="field-label">Name</label><input class="field-input" id="m-eloc-name" value="${loc.name}" /></div>
      <div class="field-group"><label class="field-label">Type</label><input class="field-input" id="m-eloc-type" value="${loc.type}" /></div>
      <div class="field-group"><label class="field-label">Drops (comma separated)</label><input class="field-input" id="m-eloc-drops" value="${loc.drops.join(', ')}" /></div>
      <div class="field-group"><label class="field-label">Difficulty</label>
        <div class="difficulty-picker">
          ${['Easy','Medium','Hard'].map(d => `<button class="difficulty-btn ${loc.difficulty===d?'active':''}" id="ediff-${d.toLowerCase()}" onclick="pickEditDifficulty('${d}')" ${loc.difficulty===d?`style="background:${d==='Easy'?'var(--green)':d==='Medium'?'var(--yellow)':'var(--red)'};color:#111"`:''} >${d}</button>`).join('')}
        </div>
        <input type="hidden" id="m-eloc-diff" value="${loc.difficulty}" />
      </div>
      <div class="modal-actions">
        <button class="action-btn success" onclick="confirmEditLocation(${i})">Save</button>
        <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Cancel</button>
      </div>
    `);
  }, 350);
}

function pickEditDifficulty(d) {
  document.getElementById('m-eloc-diff').value = d;
  ['Easy','Medium','Hard'].forEach(dd => {
    const btn = document.getElementById('ediff-'+dd.toLowerCase());
    if (!btn) return;
    btn.classList.toggle('active', dd === d);
    btn.style.background = dd === d ? (dd==='Easy'?'var(--green)':dd==='Medium'?'var(--yellow)':'var(--red)') : '';
    btn.style.color = dd === d ? '#111' : '';
  });
}

function confirmEditLocation(i) {
  D.locations[i].name = document.getElementById('m-eloc-name').value.trim() || D.locations[i].name;
  D.locations[i].type = document.getElementById('m-eloc-type').value.trim();
  D.locations[i].drops = document.getElementById('m-eloc-drops').value.split(',').map(s=>s.trim()).filter(Boolean);
  D.locations[i].difficulty = document.getElementById('m-eloc-diff').value;
  save(); closeModal(); renderLocations();
}

// ══════════════════════════════════════════
//  INVENTORY PAGE
// ══════════════════════════════════════════
function switchInventoryTab(tab) {
  currentInvTab = tab;
  document.getElementById('inv-tab-characters').classList.toggle('active', tab==='characters');
  document.getElementById('inv-tab-learning').classList.toggle('active', tab==='learning');
  document.getElementById('inv-characters').classList.toggle('active', tab==='characters');
  document.getElementById('inv-learning').classList.toggle('active', tab==='learning');
  document.getElementById('inv-search').value = '';
  renderInventory();
}

function filterInventory() { renderInventory(); }

function renderInventory() {
  const query = (document.getElementById('inv-search').value || '').toLowerCase();
  if (currentInvTab === 'characters') renderInvCharacters(query);
  else renderInvLearning(query);
}

function renderInvCharacters(query) {
  const el = document.getElementById('inv-characters');
  let chars = D.characters;
  if (query) chars = chars.filter(c => c.name.toLowerCase().includes(query) || (c.tags||[]).some(t=>t.toLowerCase().includes(query)));
  if (chars.length === 0) { el.innerHTML = '<div class="empty-state">No characters found.</div>'; return; }
  // Check which characters are in any party
  const inParty = new Set();
  D.parties.forEach(p => p.members.forEach(id => inParty.add(id)));
  let html = '<div class="inv-char-grid">';
  [5,4,3,2,1].forEach(r => {
    const rc = chars.filter(c => c.rarity === r);
    if (rc.length === 0) return;
    html += `<div class="inv-rarity-group-label" style="color:${RARITY[r].star}">${stars(r)} ${RARITY[r].label} (${rc.length})</div><div class="inv-char-row">`;
    rc.forEach(c => {
      html += `<div class="inv-char-card" style="border-color:${RARITY[r].star};box-shadow:0 0 12px ${RARITY[r].glow}" onclick="openCharDetail('${c.id}')">
        ${inParty.has(c.id) ? '<div class="inv-party-badge">⚔️ PARTY</div>' : ''}
        <div class="inv-char-avatar" style="background:${RARITY[r].bg}">${c.name.charAt(0).toUpperCase()}</div>
        <div class="inv-char-name">${c.name}</div>
        ${c.location ? `<div class="inv-char-loc">${c.location}</div>` : ''}
      </div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function renderInvLearning(query) {
  const el = document.getElementById('inv-learning');
  let mats = D.learningMaterial;
  if (query) mats = mats.filter(m => m.name.toLowerCase().includes(query) || m.type.toLowerCase().includes(query));
  if (mats.length === 0) { el.innerHTML = '<div class="empty-state">No learning materials found.</div>'; return; }
  el.innerHTML = '<div class="inv-learning-list">' + mats.map(m => `
    <div class="inv-learning-card" onclick="openMaterialDetail('${m.id}')">
      <div class="inv-learning-icon">${m.type==='Book'?'📖':m.type==='Course'?'🎓':m.type==='Video'?'🎬':m.type==='Tutorial'?'💻':m.type==='Workshop'?'🛠️':'📦'}</div>
      <div class="inv-learning-info">
        <div class="inv-learning-name">${m.name}</div>
        <div class="inv-learning-type">${m.type}</div>
        ${m.source ? `<div class="inv-learning-source">${m.source}</div>` : ''}
      </div>
    </div>
  `).join('') + '</div>';
}

function openManualAddModal() {
  if (currentInvTab === 'characters') {
    openModal(`
      <div class="modal-title">ADD CHARACTER MANUALLY</div>
      <div class="field-group"><label class="field-label">Name</label><input class="field-input" id="m-add-c-name" placeholder="Character Name" /></div>
      <div class="field-group"><label class="field-label">Rarity</label>
        <div class="rarity-picker">${[1,2,3,4,5].map(r => `<button class="rarity-btn" data-r="${r}" onclick="pickManualRarity(${r})">${stars(r)}</button>`).join('')}</div>
      </div>
      <input type="hidden" id="m-add-c-rarity" value="3" />
      <div class="field-group"><label class="field-label">Origin / Location</label><input class="field-input" id="m-add-c-loc" placeholder="Where did you meet them?" /></div>
      <div class="field-group"><label class="field-label">Tags (comma separated)</label><input class="field-input" id="m-add-c-tags" placeholder="e.g. friend, coder" /></div>
      <div class="field-group"><label class="field-label">Notes</label><textarea class="field-input" id="m-add-c-notes" placeholder="Optional notes"></textarea></div>
      <div class="modal-actions">
        <button class="action-btn success" onclick="confirmManualAddChar()">Add Character</button>
        <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Cancel</button>
      </div>
    `);
    pickManualRarity(3);
  } else {
    // Add learning material
    openModal(`
      <div class="modal-title">ADD MATERIAL MANUALLY</div>
      <div class="field-group"><label class="field-label">Name / Title</label><input class="field-input" id="m-add-m-name" placeholder="Material Name" /></div>
      <div class="field-group"><label class="field-label">Type</label><select class="field-input" id="m-add-m-type">
        <option value="Book">📖 Book</option><option value="Course">🎓 Course</option><option value="Article">📄 Article</option>
        <option value="Video">🎬 Video</option><option value="Tutorial">💻 Tutorial</option><option value="Workshop">🛠️ Workshop</option><option value="Other">📦 Other</option>
      </select></div>
      <div class="field-group"><label class="field-label">Source</label><input class="field-input" id="m-add-m-loc" placeholder="Where did you find it?" /></div>
      <div class="field-group"><label class="field-label">Notes</label><textarea class="field-input" id="m-add-m-notes" placeholder="Optional notes"></textarea></div>
      <div class="modal-actions">
        <button class="action-btn success" onclick="confirmManualAddMat()">Add Material</button>
        <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Cancel</button>
      </div>
    `);
  }
}

function pickManualRarity(r) {
  document.getElementById('m-add-c-rarity').value = r;
  document.querySelectorAll('#modal-content .rarity-btn').forEach(b => {
    const br = parseInt(b.dataset.r);
    b.classList.toggle('active', br === r);
    if (br === r) { b.style.background = RARITY[r].bg; b.style.color = '#fff'; }
    else { b.style.background = ''; b.style.color = ''; }
  });
}

function confirmManualAddChar() {
  const name = document.getElementById('m-add-c-name').value.trim();
  if (!name) return;
  const rarity = parseInt(document.getElementById('m-add-c-rarity').value);
  const c = {
    id: 'c' + Date.now(), name, rarity,
    location: document.getElementById('m-add-c-loc').value.trim() || 'Unknown',
    notes: document.getElementById('m-add-c-notes').value.trim(),
    tags: (document.getElementById('m-add-c-tags').value || '').split(',').map(s=>s.trim()).filter(Boolean),
    obtainedDate: Date.now(),
  };
  D.characters.push(c);
  addXP(rarity * 15, `Added: ${name}`);
  addLog(`Added ${name} (${RARITY[rarity].label}) manually`);
  save(); closeModal(); renderInventory();
}

function confirmManualAddMat() {
  const name = document.getElementById('m-add-m-name').value.trim();
  if (!name) return;
  const mat = {
    id: 'm' + Date.now(), name,
    type: document.getElementById('m-add-m-type').value,
    source: document.getElementById('m-add-m-loc').value.trim() || 'Unknown',
    notes: document.getElementById('m-add-m-notes').value.trim(),
    obtainedDate: Date.now(),
  };
  D.learningMaterial.push(mat);
  addXP(20, `Added material: ${name}`);
  addLog(`Added material: ${name}`);
  save(); closeModal(); renderInventory();
}

function openCharDetail(id) {
  const c = D.characters.find(x => x.id === id);
  if (!c) return;
  openModal(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div style="width:52px;height:52px;border-radius:50%;background:${rarityColor(c.rarity).bg};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#111">${c.name.charAt(0).toUpperCase()}</div>
      <div><div style="font-size:18px;font-weight:700;color:var(--text-primary)">${c.name}</div>
        <div style="color:${rarityColor(c.rarity).star};font-size:12px">${stars(c.rarity)} — ${RARITY[c.rarity].label}</div>
      </div>
    </div>
    ${c.location ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px"><strong style="color:var(--text-muted)">MET AT:</strong> ${c.location}</div>` : ''}
    ${c.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px"><strong style="color:var(--text-muted)">NOTES:</strong> ${c.notes}</div>` : ''}
    ${c.tags?.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>` : ''}
    <div class="modal-actions" style="margin-top:16px">
      <button class="action-btn danger" onclick="deleteCharacter('${c.id}')">Release</button>
      <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Close</button>
    </div>
  `);
}

function deleteCharacter(id) {
  if (!confirm('Release this character?')) return;
  const c = D.characters.find(x => x.id === id);
  D.characters = D.characters.filter(x => x.id !== id);
  D.parties.forEach(p => { p.members = p.members.filter(m => m !== id); });
  addLog(`Released ${c?.name || 'character'}`);
  save(); closeModal(); renderInventory();
}

function openMaterialDetail(id) {
  const m = D.learningMaterial.find(x => x.id === id);
  if (!m) return;
  openModal(`
    <div class="modal-title">${m.name}</div>
    <div style="text-align:center;color:var(--purple);font-size:11px;margin-bottom:12px">${m.type}</div>
    ${m.source ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px"><strong style="color:var(--text-muted)">SOURCE:</strong> ${m.source}</div>` : ''}
    ${m.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px"><strong style="color:var(--text-muted)">NOTES:</strong> ${m.notes}</div>` : ''}
    <div class="modal-actions" style="margin-top:16px">
      <button class="action-btn danger" onclick="deleteMaterial('${m.id}')">Remove</button>
      <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Close</button>
    </div>
  `);
}

function deleteMaterial(id) {
  if (!confirm('Remove this material?')) return;
  D.learningMaterial = D.learningMaterial.filter(x => x.id !== id);
  save(); closeModal(); renderInventory();
}

// ══════════════════════════════════════════
//  MY STATS PAGE
// ══════════════════════════════════════════
function renderStats() {
  const el = document.getElementById('stats-content');
  const totalMembers = new Set(); D.parties.forEach(p => p.members.forEach(id => totalMembers.add(id)));
  const explored = D.locations.filter(l => l.visited).length;
  const rarityBreakdown = [5,4,3,2,1].map(r => ({ r, count: D.characters.filter(c=>c.rarity===r).length }));
  const maxCount = Math.max(1, ...rarityBreakdown.map(x=>x.count));
  el.innerHTML = `
    <div class="stats-big-card">
      <div class="stats-big-value">${D.player.level}</div>
      <div class="stats-big-label">Current Level</div>
      <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">${D.player.xp} / ${xpForLevel(D.player.level)} XP to next</div>
    </div>
    <div class="stats-grid">
      <div class="stats-grid-card"><div class="stats-grid-value">${totalMembers.size}</div><div class="stats-grid-label">Party Members</div></div>
      <div class="stats-grid-card"><div class="stats-grid-value">${D.characters.length}</div><div class="stats-grid-label">Characters</div></div>
      <div class="stats-grid-card"><div class="stats-grid-value">${explored}/${D.locations.length}</div><div class="stats-grid-label">Explored</div></div>
      <div class="stats-grid-card"><div class="stats-grid-value">${D.learningMaterial.length}</div><div class="stats-grid-label">Materials</div></div>
    </div>
    <div class="section-header" style="margin-top:20px"><span>RARITY BREAKDOWN</span></div>
    <div class="stats-rarity-breakdown">
      ${rarityBreakdown.map(({r,count}) => `
        <div class="rarity-breakdown-row">
          <span class="rarity-breakdown-stars" style="color:${RARITY[r].star}">${stars(r)}</span>
          <div class="rarity-breakdown-bar"><div class="rarity-breakdown-fill" style="width:${(count/maxCount)*100}%;background:${RARITY[r].bg}"></div></div>
          <span class="rarity-breakdown-count">${count}</span>
        </div>
      `).join('')}
    </div>
    <div class="section-header"><span>PARTIES (${D.parties.length})</span></div>
    ${D.parties.map(p => `
      <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:8px;padding:10px;margin-bottom:6px">
        <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${p.name} ${D.activePartyId===p.id?'<span style="color:var(--green);font-size:10px">✓ ACTIVE</span>':''}</div>
        <div style="font-size:10px;color:var(--text-muted)">${p.members.length} members · Dev Lvl ${p.devLevel}/10</div>
      </div>
    `).join('') || '<div class="empty-state">No parties created yet.</div>'}
    <div class="section-header" style="margin-top:28px"><span>💾 DATA MANAGEMENT</span></div>
    <div class="data-mgmt-card">
      <div class="data-mgmt-info">
        <div class="data-mgmt-stat">Characters: <span style="color:var(--text-primary)">${D.characters.length}</span> · Materials: <span style="color:var(--text-primary)">${D.learningMaterial.length}</span> · Parties: <span style="color:var(--text-primary)">${D.parties.length}</span></div>
      </div>
      <div class="data-mgmt-actions">
        <button class="action-btn data-mgmt-btn export-btn" onclick="exportSaveData()"><span class="data-mgmt-icon">⬇️</span> Export Save</button>
        <button class="action-btn data-mgmt-btn import-btn" onclick="document.getElementById('import-file-input').click()"><span class="data-mgmt-icon">⬆️</span> Import Save</button>
        <button class="action-btn data-mgmt-btn danger" onclick="resetAllData()"><span class="data-mgmt-icon">🗑️</span> Reset All Data</button>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════
//  MAP PAGE
// ══════════════════════════════════════════
function renderMap() {
  const canvas = document.getElementById('map-canvas');
  canvas.innerHTML = D.mapZones.map((z,i) => `
    <div class="map-zone ${selectedMapZone===i?'selected':''}" id="zone-${i}"
      style="left:${z.x}px;top:${z.y}px;width:${z.width}px;height:${z.height}px;background:${z.color}33;border-color:${z.color}"
      onmousedown="startZoneDrag(event,${i})" ontouchstart="startZoneDrag(event,${i})" onclick="selectMapZone(${i})">
      <span class="map-zone-label">${z.name}</span>
      <div class="map-zone-resize" onmousedown="startZoneResize(event,${i})" ontouchstart="startZoneResize(event,${i})"></div>
    </div>
  `).join('');
  renderMapLegend();
}

function renderMapLegend() {
  const el = document.getElementById('map-legend');
  if (D.mapZones.length === 0) { el.innerHTML = '<div class="empty-state">No zones. Tap "+ Add Zone" to map your campus.</div>'; return; }
  el.innerHTML = D.mapZones.map((z,i) => {
    const loc = D.locations.find(l => l.name === z.locationId);
    const obtainable = loc ? loc.drops.filter(d => !loc.obtained.includes(d)).length : 0;
    return `<div class="map-legend-entry" onclick="selectMapZone(${i})">
      <div class="map-legend-color" style="background:${z.color}"></div>
      <span class="map-legend-name">${z.name}</span>
      ${obtainable > 0 ? `<span class="map-legend-obtainable">⚡${obtainable}</span>` : ''}
      <button class="map-legend-delete" onclick="event.stopPropagation();deleteMapZone(${i})">✕</button>
    </div>`;
  }).join('');
}

function selectMapZone(i) { selectedMapZone = i; renderMap(); }
function clearMapSelection() { selectedMapZone = null; renderMap(); }
function deleteMapZone(i) {
  D.mapZones.splice(i, 1); selectedMapZone = null; save(); renderMap();
}

function openAddZoneModal() {
  const locOptions = D.locations.map(l => `<option value="${l.name}">${l.name}</option>`).join('');
  openModal(`
    <div class="modal-title">ADD MAP ZONE</div>
    <div class="field-group"><label class="field-label">Zone Name</label><input class="field-input" id="m-zone-name" placeholder="e.g. Building A" /></div>
    <div class="field-group"><label class="field-label">Link to Location</label>
      <select class="field-input" id="m-zone-loc"><option value="">None</option>${locOptions}</select>
    </div>
    <div class="field-group"><label class="field-label">Color</label>
      <div class="color-grid" id="m-zone-colors">
        ${ZONE_COLORS.map((c,i) => `<div class="color-swatch ${i===0?'active':''}" style="background:${c}" data-color="${c}" onclick="pickZoneColor('${c}',this)"></div>`).join('')}
      </div>
      <input type="hidden" id="m-zone-color" value="${ZONE_COLORS[0]}" />
    </div>
    <div class="modal-actions">
      <button class="action-btn success" onclick="confirmAddZone()">Add Zone</button>
      <button class="action-btn" style="opacity:0.6" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function pickZoneColor(color, el) {
  document.getElementById('m-zone-color').value = color;
  document.querySelectorAll('#m-zone-colors .color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

function confirmAddZone() {
  const name = document.getElementById('m-zone-name').value.trim();
  if (!name) return;
  const canvas = document.getElementById('map-canvas');
  const cw = canvas.clientWidth; const ch = canvas.clientHeight;
  D.mapZones.push({
    id: 'z' + Date.now(), name,
    color: document.getElementById('m-zone-color').value,
    locationId: document.getElementById('m-zone-loc').value,
    x: 20 + Math.random() * (cw - 120), y: 20 + Math.random() * (ch - 80),
    width: 100, height: 60,
  });
  save(); closeModal(); renderMap();
}

// Zone dragging
function startZoneDrag(e, i) {
  if (e.target.classList.contains('map-zone-resize')) return;
  e.preventDefault();
  const zone = D.mapZones[i];
  const touch = e.touches ? e.touches[0] : e;
  const startX = touch.clientX - zone.x;
  const startY = touch.clientY - zone.y;
  const canvas = document.getElementById('map-canvas');
  const onMove = (ev) => {
    const t = ev.touches ? ev.touches[0] : ev;
    zone.x = Math.max(0, Math.min(canvas.clientWidth - zone.width, t.clientX - startX));
    zone.y = Math.max(0, Math.min(canvas.clientHeight - zone.height, t.clientY - startY));
    const el = document.getElementById('zone-' + i);
    if (el) { el.style.left = zone.x + 'px'; el.style.top = zone.y + 'px'; }
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    save();
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);
}

function startZoneResize(e, i) {
  e.preventDefault(); e.stopPropagation();
  const zone = D.mapZones[i];
  const touch = e.touches ? e.touches[0] : e;
  const startX = touch.clientX; const startY = touch.clientY;
  const startW = zone.width; const startH = zone.height;
  const onMove = (ev) => {
    const t = ev.touches ? ev.touches[0] : ev;
    zone.width = Math.max(40, startW + (t.clientX - startX));
    zone.height = Math.max(30, startH + (t.clientY - startY));
    const el = document.getElementById('zone-' + i);
    if (el) { el.style.width = zone.width + 'px'; el.style.height = zone.height + 'px'; }
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    save();
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);
}

// ══════════════════════════════════════════
//  DATA MANAGEMENT (Export / Import / Reset)
// ══════════════════════════════════════════
function exportSaveData() {
  const data = JSON.stringify(D, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `college-rpg-save_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ Save exported!');
}

function importSaveData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.player || !Array.isArray(parsed.characters)) {
        showToast('❌ Invalid save file!', true);
        return;
      }
      if (!confirm('This will overwrite your current data. Continue?')) return;
      D = { ...defaultData(), ...parsed };
      D.locations.forEach(l => { if (!l.obtained) l.obtained = []; });
      if (!D.learningMaterial) D.learningMaterial = [];
      if (!D.mapZones) D.mapZones = [];
      if (!D.parties) D.parties = [];
      save();
      showToast('✅ Save imported successfully!');
      navigateTo('home');
    } catch(err) {
      showToast('❌ Failed to read file!', true);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetAllData() {
  if (!confirm('⚠️ This will DELETE all your data (characters, parties, locations, XP). This cannot be undone!')) return;
  if (!confirm('Are you REALLY sure? This is your last chance.')) return;
  D = defaultData();
  save();
  currentPartyIndex = 0;
  currentBannerIndex = 0;
  showToast('All data has been reset.');
  navigateTo('home');
}

function showToast(msg, isError) {
  const existing = document.querySelector('.rpg-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'rpg-toast' + (isError ? ' error' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  load();
  navigateTo('home');
});
