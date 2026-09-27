/* ---------- Data ---------- */

const CATEGORIES = [
  "Cold water systems",
  "Hot water systems",
  "Central heating systems",
  "Above-ground drainage",
  "Sanitary appliances",
  "Rainwater systems",
  "Copper pipework — bending & jointing",
  "Plastic pipework — push-fit / solvent weld",
  "Soldering & brazing",
  "Pressure testing",
  "Fault finding & diagnostics",
  "Environmental technology (heat pumps, solar thermal)",
  "Isolating & making safe",
  "Health & safety / risk assessment",
  "First fix",
  "Second fix",
  "Customer handover",
  "Other"
];

const DEFAULT_TOOLS = [
  "Pipe cutter", "Pipe bender", "Blow torch", "Soldering / brazing kit",
  "Adjustable spanner", "Pipe wrench (Stillson)", "Basin wrench", "Hacksaw",
  "Deburring tool", "Push-fit pipe cutter", "Compression fitting spanners",
  "PTFE tape dispenser", "Flux brush", "Pressure test gauge",
  "Leak detection spray", "Multimeter", "Pipe freezing kit", "Cordless drill",
  "Spirit level", "Hole saw kit", "Plunger", "Drain rods", "Torque wrench",
  "Immersion heater spanner"
];

const DEFAULT_MATERIALS = [
  "15mm copper pipe", "22mm copper pipe", "Push-fit fittings",
  "Compression fittings", "Solder", "Flux", "PTFE tape", "Pipe insulation",
  "Jointing compound", "Copper elbows / tees", "Plastic waste pipe",
  "Isolation valves", "Tap connectors", "Radiator valves",
  "Silicone sealant", "Pipe clips", "WRAS-approved fittings"
];

const STORAGE_KEY = "apprenticeLogbook.entries";
const SETTINGS_KEY = "apprenticeLogbook.settings";
const TOOLS_KEY = "apprenticeLogbook.tools";
const MATERIALS_KEY = "apprenticeLogbook.materials";
const MAX_PHOTO_DIMENSION = 900;
const PHOTO_QUALITY = 0.7;

let entries = loadEntries();
let settings = loadSettings();
let toolLibrary = loadLibrary(TOOLS_KEY, DEFAULT_TOOLS, true);
let materialLibrary = loadLibrary(MATERIALS_KEY, DEFAULT_MATERIALS, false);
let currentPhotos = []; // dataURLs for the entry currently being edited
let currentTools = []; // selected tool names for the entry currently being edited
let currentMaterials = []; // selected material names for the entry currently being edited
let editingId = null;
let selectedInvolvement = "";

/* ---------- Storage ---------- */

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Could not read saved entries", e);
    return [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    alert("Could not save — your browser's storage may be full. Try exporting a backup and removing some older photos.");
    console.error(e);
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { name: "", qualification: "", employer: "" };
  } catch (e) {
    return { name: "", qualification: "", employer: "" };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* Libraries (tool/material quick-select lists) are arrays of
   { name, favourite } for tools, or plain strings for materials. */
function loadLibrary(key, defaults, withFavourite) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Could not read library", key, e);
  }
  return withFavourite ? defaults.map(name => ({ name, favourite: false })) : defaults.slice();
}

function saveLibrary(key, lib) {
  localStorage.setItem(key, JSON.stringify(lib));
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  buildCategoryChips();
  buildFilterOptions();
  renderToolChips();
  renderMaterialChips();
  wireUp();
  applySettingsToForm();
  render();
});

function buildCategoryChips() {
  const grid = document.getElementById("categoryChips");
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.addEventListener("click", () => {
      document.querySelectorAll("#categoryChips .chip").forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
      document.getElementById("entryCategoryOther").value = cat === "Other" ? "" : cat;
    });
    grid.appendChild(btn);
  });
}

function buildFilterOptions() {
  const sel = document.getElementById("filterCategory");
  CATEGORIES.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function addLibraryItem(lib, key, rawName, withFavourite) {
  const name = rawName.trim();
  if (!name) return;
  const exists = withFavourite
    ? lib.some(t => t.name.toLowerCase() === name.toLowerCase())
    : lib.some(m => m.toLowerCase() === name.toLowerCase());
  if (exists) {
    alert("That's already in your list.");
    return;
  }
  if (withFavourite) {
    lib.push({ name, favourite: false });
  } else {
    lib.push(name);
  }
  saveLibrary(key, lib);
  if (withFavourite) {
    renderToolChips();
    if (!currentTools.includes(name)) currentTools.push(name);
  } else {
    renderMaterialChips();
    if (!currentMaterials.includes(name)) currentMaterials.push(name);
  }
  // reflect the auto-selection visually
  if (withFavourite) renderToolChips(); else renderMaterialChips();
}

function sortedTools() {
  return toolLibrary.slice().sort((a, b) => {
    if (a.favourite !== b.favourite) return a.favourite ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function renderToolChips() {
  const grid = document.getElementById("toolChips");
  grid.innerHTML = "";
  sortedTools().forEach(tool => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip chip-multi" + (currentTools.includes(tool.name) ? " selected" : "");
    chip.innerHTML = `<span class="chip-star${tool.favourite ? " favourited" : ""}">★</span><span>${escapeHtml(tool.name)}</span>`;
    chip.querySelector(".chip-star").addEventListener("click", (e) => {
      e.stopPropagation();
      tool.favourite = !tool.favourite;
      saveLibrary(TOOLS_KEY, toolLibrary);
      renderToolChips();
    });
    chip.addEventListener("click", () => {
      const idx = currentTools.indexOf(tool.name);
      if (idx === -1) currentTools.push(tool.name); else currentTools.splice(idx, 1);
      renderToolChips();
    });
    grid.appendChild(chip);
  });
}

function renderMaterialChips() {
  const grid = document.getElementById("materialChips");
  grid.innerHTML = "";
  materialLibrary.slice().sort((a, b) => a.localeCompare(b)).forEach(material => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip chip-multi" + (currentMaterials.includes(material) ? " selected" : "");
    chip.textContent = material;
    chip.addEventListener("click", () => {
      const idx = currentMaterials.indexOf(material);
      if (idx === -1) currentMaterials.push(material); else currentMaterials.splice(idx, 1);
      renderMaterialChips();
    });
    grid.appendChild(chip);
  });
}

function wireUp() {
  document.getElementById("openNewEntryBtn").addEventListener("click", () => openEntryModal());
  document.getElementById("emptyStateNewBtn").addEventListener("click", () => openEntryModal());
  document.getElementById("closeEntryModalBtn").addEventListener("click", closeEntryModal);
  document.getElementById("cancelEntryBtn").addEventListener("click", closeEntryModal);
  document.getElementById("saveEntryBtn").addEventListener("click", saveEntry);
  document.getElementById("deleteEntryBtn").addEventListener("click", deleteCurrentEntry);
  document.getElementById("entryPhotos").addEventListener("change", handlePhotoInput);

  document.getElementById("addToolBtn").addEventListener("click", () => {
    const input = document.getElementById("newToolInput");
    addLibraryItem(toolLibrary, TOOLS_KEY, input.value, true);
    input.value = "";
  });
  document.getElementById("newToolInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("addToolBtn").click(); }
  });
  document.getElementById("addMaterialBtn").addEventListener("click", () => {
    const input = document.getElementById("newMaterialInput");
    addLibraryItem(materialLibrary, MATERIALS_KEY, input.value, false);
    input.value = "";
  });
  document.getElementById("newMaterialInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("addMaterialBtn").click(); }
  });

  document.querySelectorAll("#involvementChips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#involvementChips .chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectedInvolvement = chip.dataset.involvement;
    });
  });

  document.getElementById("filterCategory").addEventListener("change", render);
  document.getElementById("filterFrom").addEventListener("change", render);
  document.getElementById("filterTo").addEventListener("change", render);
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    render();
  });

  document.getElementById("generateLogbookBtn").addEventListener("click", generateLogbook);
  document.getElementById("exportBackupBtn").addEventListener("click", exportBackup);
  document.getElementById("importBackupInput").addEventListener("change", importBackup);

  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModalBackdrop").classList.add("open");
  });
  document.getElementById("closeSettingsModalBtn").addEventListener("click", () => {
    document.getElementById("settingsModalBackdrop").classList.remove("open");
  });
  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    settings.name = document.getElementById("settingName").value.trim();
    settings.qualification = document.getElementById("settingQual").value.trim();
    settings.employer = document.getElementById("settingEmployer").value.trim();
    saveSettings();
    applySettingsToForm();
    document.getElementById("settingsModalBackdrop").classList.remove("open");
  });

  // Close modals on backdrop click
  [document.getElementById("entryModalBackdrop"), document.getElementById("settingsModalBackdrop")].forEach(bd => {
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.classList.remove("open"); });
  });
}

function applySettingsToForm() {
  document.getElementById("settingName").value = settings.name || "";
  document.getElementById("settingQual").value = settings.qualification || "";
  document.getElementById("settingEmployer").value = settings.employer || "";
  document.getElementById("traineeNameDisplay").textContent =
    settings.qualification || "Plumbing & Domestic Heating";
}

/* ---------- Entry modal ---------- */

function openEntryModal(entry) {
  editingId = entry ? entry.id : null;
  currentPhotos = entry ? [...entry.photos] : [];
  currentTools = entry && entry.tools ? [...entry.tools] : [];
  currentMaterials = entry && entry.materials ? [...entry.materials] : [];
  selectedInvolvement = entry ? entry.involvement : "";

  document.getElementById("entryModalTitle").textContent = entry ? "Edit log entry" : "New log entry";
  document.getElementById("entryId").value = entry ? entry.id : "";
  document.getElementById("entryDate").value = entry ? entry.date : new Date().toISOString().slice(0, 10);
  document.getElementById("entryCategoryOther").value = entry ? entry.category : "";
  document.getElementById("entryHours").value = entry ? entry.hours : "";
  document.getElementById("entryPreNotes").value = entry ? (entry.preJobNotes || "") : "";
  document.getElementById("entryPostNotes").value = entry ? (entry.postJobNotes || entry.notes || "") : "";
  document.getElementById("entryWitness").value = entry ? entry.witness : "";
  document.getElementById("deleteEntryBtn").style.display = entry ? "inline-block" : "none";

  document.querySelectorAll("#categoryChips .chip").forEach(c => {
    c.classList.toggle("selected", entry && c.dataset.category === entry.category);
  });
  document.querySelectorAll("#involvementChips .chip").forEach(c => {
    c.classList.toggle("selected", entry && c.dataset.involvement === entry.involvement);
  });

  renderToolChips();
  renderMaterialChips();
  renderPhotoPreview();
  document.getElementById("entryModalBackdrop").classList.add("open");
}

function closeEntryModal() {
  document.getElementById("entryModalBackdrop").classList.remove("open");
  document.getElementById("entryPhotos").value = "";
}

function saveEntry() {
  const date = document.getElementById("entryDate").value;
  const category = document.getElementById("entryCategoryOther").value.trim();
  const hours = parseFloat(document.getElementById("entryHours").value) || 0;
  const preJobNotes = document.getElementById("entryPreNotes").value.trim();
  const postJobNotes = document.getElementById("entryPostNotes").value.trim();
  const witness = document.getElementById("entryWitness").value.trim();

  if (!date) { alert("Please add a date."); return; }
  if (!category) { alert("Please pick or type a task category."); return; }

  const entryData = {
    id: editingId || String(Date.now()),
    date, category, hours, preJobNotes, postJobNotes, witness,
    involvement: selectedInvolvement,
    tools: [...currentTools],
    materials: [...currentMaterials],
    photos: currentPhotos,
    createdAt: editingId ? (entries.find(e => e.id === editingId) || {}).createdAt || Date.now() : Date.now()
  };

  if (editingId) {
    entries = entries.map(e => e.id === editingId ? entryData : e);
  } else {
    entries.push(entryData);
  }
  saveEntries();
  closeEntryModal();
  render();
}

function deleteCurrentEntry() {
  if (!editingId) return;
  if (!confirm("Delete this log entry? This can't be undone.")) return;
  entries = entries.filter(e => e.id !== editingId);
  saveEntries();
  closeEntryModal();
  render();
}

/* ---------- Photos ---------- */

function handlePhotoInput(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    compressImage(file).then(dataUrl => {
      currentPhotos.push(dataUrl);
      renderPhotoPreview();
    }).catch(err => console.error("Photo processing failed", err));
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_PHOTO_DIMENSION || height > MAX_PHOTO_DIMENSION) {
          const scale = MAX_PHOTO_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", PHOTO_QUALITY));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderPhotoPreview() {
  const wrap = document.getElementById("photoPreview");
  wrap.innerHTML = "";
  currentPhotos.forEach((src, i) => {
    const div = document.createElement("div");
    div.className = "thumb-wrap";
    div.innerHTML = `<img src="${src}" alt="Photo ${i + 1}"><button type="button" class="remove-photo" title="Remove">✕</button>`;
    div.querySelector(".remove-photo").addEventListener("click", () => {
      currentPhotos.splice(i, 1);
      renderPhotoPreview();
    });
    wrap.appendChild(div);
  });
}

/* ---------- Rendering the ledger ---------- */

function getFilteredEntries() {
  const cat = document.getElementById("filterCategory").value;
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;

  return entries
    .filter(e => !cat || e.category === cat)
    .filter(e => !from || e.date >= from)
    .filter(e => !to || e.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
}

function render() {
  const filtered = getFilteredEntries();
  const list = document.getElementById("entryList");
  const empty = document.getElementById("emptyState");

  document.getElementById("ledgerCount").textContent =
    `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`;

  if (entries.length === 0) {
    empty.style.display = "block";
    list.style.display = "none";
  } else {
    empty.style.display = "none";
    list.style.display = "block";
  }

  list.innerHTML = "";
  const total = filtered.length;
  filtered.forEach((entry, idx) => {
    const num = String(total - idx).padStart(3, "0");
    const tagClass = entry.involvement === "Completed independently" ? "tag-independent"
      : entry.involvement === "Assisted" ? "tag-assisted" : "tag-observed";

    const row = document.createElement("div");
    row.className = "entry";
    row.innerHTML = `
      <div class="entry-num">#${num}</div>
      <div>
        <div class="entry-head">
          <span class="entry-date">${formatDate(entry.date)}</span>
          <span class="entry-category">${escapeHtml(entry.category)}</span>
          ${entry.involvement ? `<span class="tag ${tagClass}">${entry.involvement}</span>` : ""}
          ${entry.hours ? `<span class="entry-hours">${entry.hours}h</span>` : ""}
        </div>
        ${entry.preJobNotes ? `<p class="entry-notes-label">Pre-job customer notes</p><p class="entry-notes">${escapeHtml(entry.preJobNotes)}</p>` : ""}
        ${(entry.postJobNotes || entry.notes) ? `<p class="entry-notes-label">Post-job reflective notes</p><p class="entry-notes">${escapeHtml(entry.postJobNotes || entry.notes)}</p>` : ""}
        ${entry.witness ? `<p class="entry-witness">Witnessed by ${escapeHtml(entry.witness)}</p>` : ""}
        ${entry.tools && entry.tools.length ? `<p class="entry-meta-list"><span class="meta-label">Tools</span><span class="meta-tags">${entry.tools.map(t => `<span class="meta-tag">${escapeHtml(t)}</span>`).join("")}</span></p>` : ""}
        ${entry.materials && entry.materials.length ? `<p class="entry-meta-list"><span class="meta-label">Materials</span><span class="meta-tags">${entry.materials.map(m => `<span class="meta-tag">${escapeHtml(m)}</span>`).join("")}</span></p>` : ""}
        ${entry.photos.length ? `<div class="entry-photos">${entry.photos.map(p => `<img src="${p}">`).join("")}</div>` : ""}
        <div class="entry-actions">
          <button data-action="edit">Edit</button>
          <button data-action="delete">Delete</button>
        </div>
      </div>
    `;
    row.querySelector('[data-action="edit"]').addEventListener("click", () => openEntryModal(entry));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (!confirm("Delete this log entry?")) return;
      entries = entries.filter(e => e.id !== entry.id);
      saveEntries();
      render();
    });
    row.querySelectorAll(".entry-photos img").forEach(img => {
      img.addEventListener("click", () => window.open(img.src, "_blank"));
    });
    list.appendChild(row);
  });

  updateStats();
}

function updateStats() {
  document.getElementById("statTotalEntries").textContent = entries.length;
  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
  document.getElementById("statTotalHours").textContent =
    Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(2);
  document.getElementById("statIndependent").textContent =
    entries.filter(e => e.involvement === "Completed independently").length;
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Logbook (print) generation ---------- */

function generateLogbook() {
  const filtered = getFilteredEntries().slice().sort((a, b) => (a.date > b.date ? 1 : -1));
  if (filtered.length === 0) {
    alert("No entries match the current filters — adjust the filters in the left rail first.");
    return;
  }

  const totalHours = filtered.reduce((sum, e) => sum + (e.hours || 0), 0);
  const byCategory = {};
  filtered.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + 1; });
  const categoryCount = Object.keys(byCategory).length;

  const view = document.getElementById("logbookPrintView");
  view.innerHTML = `
    <div class="logbook-cover">
      <h1>Apprenticeship Logbook</h1>
      <p>${escapeHtml(settings.name || "Name not set")}</p>
      ${settings.qualification ? `<p>${escapeHtml(settings.qualification)}</p>` : ""}
      ${settings.employer ? `<p>${escapeHtml(settings.employer)}</p>` : ""}
      <p>Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
    </div>
    <div class="logbook-summary">
      <div><span class="n">${filtered.length}</span>entries</div>
      <div><span class="n">${totalHours}</span>hours logged</div>
      <div><span class="n">${categoryCount}</span>task categories covered</div>
      <div><span class="n">${filtered.filter(e => e.involvement === "Completed independently").length}</span>completed independently</div>
    </div>
    ${filtered.map((e, i) => `
      <div class="logbook-entry">
        <h3>${i + 1}. ${escapeHtml(e.category)}</h3>
        <p class="meta">${formatDate(e.date)}${e.involvement ? " · " + e.involvement : ""}${e.hours ? " · " + e.hours + "h" : ""}${e.witness ? " · Witnessed by " + escapeHtml(e.witness) : ""}</p>
        ${e.preJobNotes ? `<p class="notes"><strong>Pre-job customer notes:</strong> ${escapeHtml(e.preJobNotes)}</p>` : ""}
        ${(e.postJobNotes || e.notes) ? `<p class="notes"><strong>Post-job reflective notes:</strong> ${escapeHtml(e.postJobNotes || e.notes)}</p>` : ""}
        ${e.tools && e.tools.length ? `<p class="meta">Tools: ${e.tools.map(escapeHtml).join(", ")}</p>` : ""}
        ${e.materials && e.materials.length ? `<p class="meta">Materials: ${e.materials.map(escapeHtml).join(", ")}</p>` : ""}
        ${e.photos.length ? `<div class="photos">${e.photos.map(p => `<img src="${p}">`).join("")}</div>` : ""}
      </div>
    `).join("")}
  `;

  window.print();
}

/* ---------- Backup / restore ---------- */

function exportBackup() {
  const payload = { settings, entries, toolLibrary, materialLibrary, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `logbook-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!Array.isArray(payload.entries)) throw new Error("Not a valid backup file");
      const mode = confirm(
        `This backup has ${payload.entries.length} entries. Click OK to merge with your current entries, or Cancel to replace your current entries entirely.`
      );
      entries = mode ? mergeEntries(entries, payload.entries) : payload.entries;
      if (payload.settings) settings = payload.settings;
      if (Array.isArray(payload.toolLibrary)) toolLibrary = payload.toolLibrary;
      if (Array.isArray(payload.materialLibrary)) materialLibrary = payload.materialLibrary;
      saveEntries();
      saveSettings();
      saveLibrary(TOOLS_KEY, toolLibrary);
      saveLibrary(MATERIALS_KEY, materialLibrary);
      applySettingsToForm();
      renderToolChips();
      renderMaterialChips();
      render();
      alert("Backup imported.");
    } catch (err) {
      alert("Couldn't read that file — is it a logbook backup exported from this app?");
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function mergeEntries(a, b) {
  const map = new Map();
  [...a, ...b].forEach(e => map.set(e.id, e));
  return Array.from(map.values());
}
