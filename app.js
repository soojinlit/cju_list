const state = {
  items: [],
  filter: "all",
  query: "",
  page: 1,
  pageSize: 50,
  sortBy: "default",
  ratingFilter: "all",
  indexFilter: "all",
  activeItemId: null,
  version: 1,
};

const els = {
  list: document.getElementById("book-list"),
  stats: {
    total: document.getElementById("stat-total"),
    done: document.getElementById("stat-done"),
    reading: document.getElementById("stat-reading"),
    dnf: document.getElementById("stat-dnf"),
  },
  search: document.getElementById("search"),
  addPanel: document.getElementById("add-panel"),
  settingsPanel: document.getElementById("settings-panel"),
  saveStatus: document.getElementById("save-status"),
  pagerInfo: document.getElementById("pager-info"),
  pagerPrev: document.getElementById("pager-prev"),
  pagerNext: document.getElementById("pager-next"),
  pageSize: document.getElementById("page-size"),
  sortBy: document.getElementById("sort-by"),
  ratingFilter: document.getElementById("rating-filter"),
  indexBar: document.getElementById("index-bar"),
  modal: document.getElementById("detail-modal"),
  modalClose: document.getElementById("detail-close"),
  modalBackdrop: document.querySelector(".modal__backdrop"),
  modalSave: document.getElementById("detail-save"),
  modalDelete: document.getElementById("detail-delete"),
  modalClearRating: document.getElementById("detail-rating-clear"),
  detail: {
    title: document.getElementById("detail-title"),
    author: document.getElementById("detail-author"),
    status: document.getElementById("detail-status"),
    date: document.getElementById("detail-date"),
    notes: document.getElementById("detail-notes"),
    rating: document.getElementById("detail-rating"),
    previewTitle: document.getElementById("preview-title"),
    previewAuthor: document.getElementById("preview-author"),
    previewMeta: document.getElementById("preview-meta"),
    previewNotes: document.getElementById("preview-notes"),
  },
};

const STORAGE_KEY = "tbr_local_items";
const SETTINGS_KEY = "tbr_github_settings";

const collator = new Intl.Collator("ko", { sensitivity: "base", numeric: true });

let lastFocused = null;
let hoverRating = null;

function loadLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocal() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: state.version,
      items: state.items,
      pageSize: state.pageSize,
      sortBy: state.sortBy,
      ratingFilter: state.ratingFilter,
      indexFilter: state.indexFilter,
    })
  );
}

function setStats() {
  const total = state.items.length;
  const done = state.items.filter(i => i.status === "done").length;
  const reading = state.items.filter(i => i.status === "reading").length;
  const dnf = state.items.filter(i => i.status === "dnf").length;
  els.stats.total.textContent = total;
  els.stats.done.textContent = done;
  els.stats.reading.textContent = reading;
  els.stats.dnf.textContent = dnf;
}

function getFilteredItems() {
  const query = state.query.trim().toLowerCase();
  let items = state.items.filter(item => {
    if (state.filter !== "all" && item.status !== state.filter) return false;
    if (state.ratingFilter !== "all") {
      const min = Number(state.ratingFilter);
      if (!item.rating || item.rating < min) return false;
    }
    if (state.indexFilter !== "all") {
      const init = getTitleInitial(item.title);
      if (init !== state.indexFilter) return false;
    }
    if (!query) return true;
    return (item.title + " " + item.author).toLowerCase().includes(query);
  });

  if (state.sortBy === "title-asc") {
    items = items.slice().sort((a, b) => collator.compare(a.title, b.title));
  } else if (state.sortBy === "author-asc") {
    items = items.slice().sort((a, b) => collator.compare(a.author || "", b.author || ""));
  } else if (state.sortBy === "rating-desc") {
    items = items.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (state.sortBy === "rating-asc") {
    items = items.slice().sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }

  return items;
}

function updatePager(totalCount) {
  const totalPages = Math.max(1, Math.ceil(totalCount / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  els.pagerInfo.textContent = `${state.page} / ${totalPages} · ${totalCount}권`;
  els.pagerPrev.disabled = state.page <= 1;
  els.pagerNext.disabled = state.page >= totalPages;
}

function statusLabel(status) {
  if (status === "done") return "완독";
  if (status === "reading") return "읽는 중";
  if (status === "dnf") return "DNF";
  return "TBR";
}

function getTitleInitial(title) {
  if (!title) return "";
  const ch = title.trim()[0];
  if (!ch) return "";
  const code = ch.charCodeAt(0);
  // Hangul syllables
  if (code >= 0xac00 && code <= 0xd7a3) {
    const cho = Math.floor((code - 0xac00) / 28 / 21);
    const chos = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    return chos[cho] || "";
  }
  // Latin letters
  if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();
  // Digits
  if (/[0-9]/.test(ch)) return ch;
  return "";
}

function render() {
  setStats();
  els.list.innerHTML = "";

  const items = getFilteredItems();
  updatePager(items.length);

  const start = (state.page - 1) * state.pageSize;
  const pageItems = items.slice(start, start + state.pageSize);
  const template = document.getElementById("book-card-template");

  pageItems.forEach(item => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".book-card");
    card.dataset.id = item.id;

    node.querySelector(".book-title").textContent = item.title;
    node.querySelector(".book-author").textContent = item.author || "";

    const dateEl = node.querySelector(".book-date");
    const notesEl = node.querySelector(".book-notes");
    const ratingEl = node.querySelector(".book-rating");
    if (item.date_read) {
      dateEl.textContent = `읽은 날: ${item.date_read}`;
      dateEl.style.display = "block";
    } else {
      dateEl.style.display = "none";
    }
    if (item.notes) {
      notesEl.textContent = `메모: ${item.notes}`;
      notesEl.style.display = "block";
    } else {
      notesEl.style.display = "none";
    }
    if (item.rating) {
      ratingEl.textContent = `별점: ${item.rating}/5`;
      ratingEl.style.display = "block";
    } else {
      ratingEl.style.display = "none";
    }

    const statusEl = node.querySelector(".status-pill");
    statusEl.textContent = statusLabel(item.status);
    statusEl.dataset.status = item.status;

    node.querySelector(".open-detail").addEventListener("click", () => {
      openDetail(item.id);
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openDetail(item.id);
    });

    els.list.appendChild(node);
  });
}

function openDetail(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  state.activeItemId = itemId;
  lastFocused = document.activeElement;
  els.detail.title.value = item.title;
  els.detail.author.value = item.author || "";
  els.detail.status.value = item.status;
  els.detail.date.value = item.date_read || "";
  els.detail.notes.value = item.notes || "";
  syncRatingButtons(item.rating);

  els.modal.classList.remove("hidden");
  updatePreview(item);
  focusFirstModalControl();
}

function closeDetail() {
  state.activeItemId = null;
  els.modal.classList.add("hidden");
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function updatePreview(item) {
  const title = els.detail.title.value.trim() || item.title;
  const author = els.detail.author.value.trim() || item.author || "";
  const status = els.detail.status.value;
  const date = els.detail.date.value;
  const notes = els.detail.notes.value.trim();
  const rating = item.rating ? `${item.rating}/5` : "";
  const metaParts = [];
  if (status) metaParts.push(statusLabel(status));
  if (rating) metaParts.push(`별점 ${rating}`);
  if (date) metaParts.push(`읽은 날 ${date}`);

  els.detail.previewTitle.textContent = title;
  els.detail.previewAuthor.textContent = author ? `저자: ${author}` : "";
  els.detail.previewMeta.textContent = metaParts.join(" · ");
  els.detail.previewNotes.textContent = notes ? `메모: ${notes}` : "";
}

function syncRatingButtons(rating) {
  const ratingButtons = els.detail.rating.querySelectorAll(".star");
  ratingButtons.forEach(btn => {
    const star = Number(btn.dataset.star);
    btn.classList.remove("filled", "half");
    if (!rating) return;
    if (rating >= star) {
      btn.classList.add("filled");
    } else if (rating >= star - 0.5) {
      btn.classList.add("half");
    }
  });
}

function getStarValueFromEvent(btn, e) {
  const star = Number(btn.dataset.star);
  const rect = btn.getBoundingClientRect();
  const isHalf = (e.clientX - rect.left) < rect.width / 2;
  return isHalf ? star - 0.5 : star;
}

function focusFirstModalControl() {
  const focusables = getModalFocusables();
  if (focusables.length) focusables[0].focus();
}

function getModalFocusables() {
  return Array.from(els.modal.querySelectorAll("button, input, select, textarea, [tabindex]:not([tabindex='-1'])"))
    .filter(el => !el.disabled && el.offsetParent !== null);
}

function trapModalFocus(e) {
  if (els.modal.classList.contains("hidden")) return;
  if (e.key === "Escape") {
    closeDetail();
    return;
  }
  if (e.key !== "Tab") return;
  const focusables = getModalFocusables();
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function saveDetail() {
  const item = state.items.find(i => i.id === state.activeItemId);
  if (!item) return;
  const newTitle = els.detail.title.value.trim() || item.title;
  const newAuthor = els.detail.author.value.trim();
  item.title = newTitle;
  item.author = newAuthor;
  item.status = els.detail.status.value;
  item.date_read = els.detail.date.value || null;
  item.notes = els.detail.notes.value.trim();
  saveLocal();
  render();
  closeDetail();
}

function deleteDetail() {
  if (!state.activeItemId) return;
  const item = state.items.find(i => i.id === state.activeItemId);
  if (!item) return;
  const ok = confirm(`'${item.title}' 책을 삭제할까요?`);
  if (!ok) return;
  state.items = state.items.filter(i => i.id !== state.activeItemId);
  saveLocal();
  render();
  closeDetail();
}

async function loadData() {
  const local = loadLocal();
  if (local && Array.isArray(local.items)) {
    state.items = local.items;
    if (local.pageSize) state.pageSize = local.pageSize;
    if (local.sortBy) state.sortBy = local.sortBy;
    if (local.ratingFilter) state.ratingFilter = local.ratingFilter;
    if (local.indexFilter) state.indexFilter = local.indexFilter;
    els.pageSize.value = String(state.pageSize);
    els.sortBy.value = state.sortBy;
    els.ratingFilter.value = state.ratingFilter;
    buildIndexBar();
    render();
    return;
  }

  const res = await fetch("data/books.json", { cache: "no-store" });
  const data = await res.json();
  state.version = data.version || 1;
  state.items = data.items || [];
  els.pageSize.value = String(state.pageSize);
  els.sortBy.value = state.sortBy;
  els.ratingFilter.value = state.ratingFilter;
  buildIndexBar();
  render();
}

function buildIndexBar() {
  if (!els.indexBar) return;
  els.indexBar.innerHTML = "";
  const digits = ["0","1","2","3","4","5","6","7","8","9"];
  const han = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const alpha = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const all = ["all", ...han, ...alpha, ...digits];
  all.forEach(key => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "index-btn";
    btn.dataset.key = key;
    btn.textContent = key === "all" ? "전체" : key;
    if (key === state.indexFilter) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.indexFilter = key;
      state.page = 1;
      saveLocal();
      buildIndexBar();
      render();
    });
    els.indexBar.appendChild(btn);
  });
}

function showPanel(panel, show) {
  panel.classList.toggle("hidden", !show);
}

function addItemFromForm() {
  const title = document.getElementById("add-title").value.trim();
  const author = document.getElementById("add-author").value.trim();
  const status = document.getElementById("add-status").value;

  if (!title) return;

  state.items.unshift({
    id: `b${Date.now()}`,
    title,
    author,
    status,
    rating: null,
    date_read: null,
    notes: "",
    added_at: new Date().toISOString().slice(0, 10),
  });

  state.page = 1;
  saveLocal();
  render();
  showPanel(els.addPanel, false);

  document.getElementById("add-title").value = "";
  document.getElementById("add-author").value = "";
  document.getElementById("add-status").value = "tbr";
}

function toMarkdown() {
  const statusMap = {
    tbr: " ",
    done: "x",
    dnf: "-",
    reading: "/",
  };

  const lines = [];
  lines.push("---");
  lines.push(`created: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("tags: [tbr]");
  lines.push("---\n");
  lines.push("# 📚 독서 목록");
  lines.push("");
  state.items.forEach(item => {
    let line = `- [${statusMap[item.status]}] ${item.title}`;
    if (item.author) line += ` / ${item.author}`;
    if (item.rating) line += ` — [${item.rating}/5]`;
    if (item.date_read) line += ` ${item.date_read}`;
    lines.push(line);
  });
  return lines.join("\n");
}

function downloadMarkdown() {
  const blob = new Blob([toMarkdown()], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tbr_export.md";
  a.click();
  URL.revokeObjectURL(url);
}

function getSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function fillSettingsUI() {
  const settings = getSettings();
  if (!settings) return;
  document.getElementById("gh-owner").value = settings.owner || "";
  document.getElementById("gh-repo").value = settings.repo || "";
  document.getElementById("gh-path").value = settings.path || "data/books.json";
  document.getElementById("gh-token").value = settings.token || "";
}

async function saveToGitHub() {
  const owner = document.getElementById("gh-owner").value.trim();
  const repo = document.getElementById("gh-repo").value.trim();
  const path = document.getElementById("gh-path").value.trim() || "data/books.json";
  const token = document.getElementById("gh-token").value.trim();

  if (!owner || !repo || !path || !token) {
    els.saveStatus.textContent = "설정을 모두 입력해 주세요.";
    return;
  }

  setSettings({ owner, repo, path, token });

  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const payload = JSON.stringify({ version: state.version, items: state.items }, null, 2);
  const content = btoa(unescape(encodeURIComponent(payload)));

  els.saveStatus.textContent = "GitHub에 저장 중...";

  let sha = null;
  const getRes = await fetch(api, {
    headers: { Authorization: `token ${token}` }
  });
  if (getRes.ok) {
    const getData = await getRes.json();
    sha = getData.sha;
  }

  const putRes = await fetch(api, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Update reading list",
      content,
      sha,
    })
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    els.saveStatus.textContent = `저장 실패: ${err.message || putRes.statusText}`;
    return;
  }

  els.saveStatus.textContent = "저장 완료!";
  localStorage.removeItem(STORAGE_KEY);
}

function bindEvents() {
  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filter = btn.dataset.filter;
      state.page = 1;
      render();
    });
  });

  els.search.addEventListener("input", (e) => {
    state.query = e.target.value;
    state.page = 1;
    render();
  });

  els.pagerPrev.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });

  els.pagerNext.addEventListener("click", () => {
    state.page = state.page + 1;
    render();
  });

  els.pageSize.addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value);
    state.page = 1;
    saveLocal();
    render();
  });

  els.sortBy.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    state.page = 1;
    saveLocal();
    render();
  });

  els.ratingFilter.addEventListener("change", (e) => {
    state.ratingFilter = e.target.value;
    state.page = 1;
    saveLocal();
    render();
  });

  document.getElementById("btn-add").addEventListener("click", () => {
    showPanel(els.addPanel, true);
  });
  document.getElementById("btn-add-cancel").addEventListener("click", () => {
    showPanel(els.addPanel, false);
  });
  document.getElementById("btn-add-save").addEventListener("click", addItemFromForm);

  document.getElementById("btn-export").addEventListener("click", downloadMarkdown);

  document.getElementById("btn-settings").addEventListener("click", () => {
    showPanel(els.settingsPanel, true);
    fillSettingsUI();
  });
  document.getElementById("btn-settings-close").addEventListener("click", () => {
    showPanel(els.settingsPanel, false);
  });
  document.getElementById("btn-save-settings").addEventListener("click", () => {
    const owner = document.getElementById("gh-owner").value.trim();
    const repo = document.getElementById("gh-repo").value.trim();
    const path = document.getElementById("gh-path").value.trim();
    const token = document.getElementById("gh-token").value.trim();
    setSettings({ owner, repo, path, token });
    els.saveStatus.textContent = "설정 저장됨.";
  });
  document.getElementById("btn-save-github").addEventListener("click", saveToGitHub);

  els.modalClose.addEventListener("click", closeDetail);
  els.modalBackdrop.addEventListener("click", closeDetail);
  els.modalSave.addEventListener("click", saveDetail);
  els.modalDelete.addEventListener("click", deleteDetail);

  els.detail.rating.querySelectorAll(".star").forEach(btn => {
    btn.addEventListener("mousemove", (e) => {
      hoverRating = getStarValueFromEvent(btn, e);
      syncRatingButtons(hoverRating);
    });
    btn.addEventListener("mouseleave", () => {
      hoverRating = null;
      const item = state.items.find(i => i.id === state.activeItemId);
      if (item) syncRatingButtons(item.rating);
    });
    btn.addEventListener("click", (e) => {
      const item = state.items.find(i => i.id === state.activeItemId);
      if (!item) return;
      item.rating = getStarValueFromEvent(btn, e);
      syncRatingButtons(item.rating);
      updatePreview(item);
    });
  });

  els.detail.rating.addEventListener("mouseleave", () => {
    hoverRating = null;
    const item = state.items.find(i => i.id === state.activeItemId);
    if (item) syncRatingButtons(item.rating);
  });

  els.modalClearRating.addEventListener("click", () => {
    const item = state.items.find(i => i.id === state.activeItemId);
    if (!item) return;
    item.rating = null;
    syncRatingButtons(null);
    updatePreview(item);
  });

  [els.detail.title, els.detail.author, els.detail.status, els.detail.date, els.detail.notes].forEach(input => {
    input.addEventListener("input", () => {
      const item = state.items.find(i => i.id === state.activeItemId);
      if (!item) return;
      updatePreview(item);
    });
  });

  document.addEventListener("keydown", trapModalFocus);
}

bindEvents();
loadData();
