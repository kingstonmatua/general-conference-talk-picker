const STORAGE_KEY = "conference-talk-bag-state";

const ui = {
  totalCount: document.querySelector("#total-count"),
  studiedCount: document.querySelector("#studied-count"),
  remainingCount: document.querySelector("#remaining-count"),
  topFavoritesCount: document.querySelector("#top-favorites-count"),
  filteredRemainingCount: document.querySelector("#filtered-remaining-count"),
  progressText: document.querySelector("#progress-text"),
  progressFill: document.querySelector("#progress-fill"),
  yearProgressPanel: document.querySelector("#year-progress-panel"),
  yearProgressLabel: document.querySelector("#year-progress-label"),
  yearProgressText: document.querySelector("#year-progress-text"),
  yearProgressFill: document.querySelector("#year-progress-fill"),
  drawButton: document.querySelector("#draw-button"),
  undoButton: document.querySelector("#undo-button"),
  resetButton: document.querySelector("#reset-button"),
  favoriteButton: document.querySelector("#favorite-button"),
  yearFilter: document.querySelector("#year-filter"),
  conferenceFilter: document.querySelector("#conference-filter"),
  speakerFilter: document.querySelector("#speaker-filter"),
  statusMessage: document.querySelector("#status-message"),
  emptyState: document.querySelector("#empty-state"),
  talkCard: document.querySelector("#talk-card"),
  talkSession: document.querySelector("#talk-session"),
  talkTitle: document.querySelector("#talk-title"),
  talkSpeaker: document.querySelector("#talk-speaker"),
  talkReference: document.querySelector("#talk-reference"),
  talkLink: document.querySelector("#talk-link"),
  historyCount: document.querySelector("#history-count"),
  historySearch: document.querySelector("#history-search"),
  historyList: document.querySelector("#history-list"),
  favoritesCount: document.querySelector("#favorites-count"),
  favoritesSearch: document.querySelector("#favorites-search"),
  favoritesList: document.querySelector("#favorites-list"),
  markYear: document.querySelector("#mark-year"),
  markConference: document.querySelector("#mark-conference"),
  markSpeaker: document.querySelector("#mark-speaker"),
  markTalk: document.querySelector("#mark-talk"),
  markStudiedButton: document.querySelector("#mark-studied-button"),
  clearFiltersButton: document.querySelector("#clear-filters-button"),
  fabDrawButton: document.querySelector("#fab-draw-button"),
  authOverlay: document.querySelector("#auth-overlay"),
  authForm: document.querySelector("#auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authPassword: document.querySelector("#auth-password"),
  authPasswordField: document.querySelector("#auth-password-field"),
  authConfirmField: document.querySelector("#auth-confirm-field"),
  authConfirmPassword: document.querySelector("#auth-confirm-password"),
  forgotPasswordBtn: document.querySelector("#forgot-password-btn"),
  authError: document.querySelector("#auth-error"),
  authSubmit: document.querySelector("#auth-submit"),
  userBar: document.querySelector("#user-bar"),
  userEmail: document.querySelector("#user-email"),
  syncButton: document.querySelector("#sync-button"),
  syncLabel: document.querySelector("#sync-label"),
  signoutButton: document.querySelector("#signout-button")
};

const talks = Array.isArray(window.TALKS) ? window.TALKS : [];
const availableYears = getAvailableYears();
let state = loadState();
let resetPending = false;
let markState = { year: "all", conference: "all", speaker: "all", talkId: null };

// ─── State management ────────────────────────────────────────────────────────

function createFreshState() {
  return {
    remainingIds: talks.map((talk) => talk.id),
    studiedIds: [],
    favoriteIds: [],
    currentTalkId: null,
    selectedYear: "all",
    selectedConference: "all",
    selectedSpeaker: "all"
  };
}

function loadState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.remainingIds) || !Array.isArray(saved.studiedIds)) {
      return createFreshState();
    }

    const validIds = new Set(talks.map((talk) => talk.id));
    const remainingIds = saved.remainingIds.filter((id) => validIds.has(id));
    const studiedIds = saved.studiedIds.filter((id) => validIds.has(id));
    const favoriteIds = Array.isArray(saved.favoriteIds)
      ? saved.favoriteIds.filter((id) => validIds.has(id))
      : [];
    const currentTalkId = validIds.has(saved.currentTalkId) ? saved.currentTalkId : null;

    const allKnownIds = new Set([...remainingIds, ...studiedIds]);
    const missingIds = talks.map((talk) => talk.id).filter((id) => !allKnownIds.has(id));

    const validYear = saved.selectedYear && availableYears.includes(saved.selectedYear)
      ? saved.selectedYear
      : "all";
    const conferencesForYear = validYear !== "all" ? getAvailableConferences(validYear) : [];
    const validConference = saved.selectedConference && conferencesForYear.includes(saved.selectedConference)
      ? saved.selectedConference
      : "all";
    const speakersForFilter = getAvailableSpeakers(validYear, validConference);
    const validSpeaker = saved.selectedSpeaker && speakersForFilter.includes(saved.selectedSpeaker)
      ? saved.selectedSpeaker
      : "all";

    return {
      remainingIds: [...remainingIds, ...missingIds],
      studiedIds,
      favoriteIds,
      currentTalkId,
      selectedYear: validYear,
      selectedConference: validConference,
      selectedSpeaker: validSpeaker
    };
  } catch {
    return createFreshState();
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveStateToSupabase();
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getTalkById(id) {
  return talks.find((talk) => talk.id === id) || null;
}

function getAvailableYears() {
  return [...new Set(talks.map((talk) => talk.year ? String(talk.year) : "").filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
}

function getAvailableConferences(year) {
  return [...new Set(
    talks
      .filter((talk) => String(talk.year) === year)
      .map((talk) => getConferenceKey(talk))
      .filter(Boolean)
  )].sort((a, b) => {
    if (a.startsWith("October") && !b.startsWith("October")) return -1;
    if (!a.startsWith("October") && b.startsWith("October")) return 1;
    return 0;
  });
}

function getAvailableSpeakers(year, conference) {
  let filtered = talks;
  if (conference !== "all") {
    filtered = filtered.filter((talk) => getConferenceKey(talk) === conference);
  } else if (year !== "all") {
    filtered = filtered.filter((talk) => String(talk.year) === year);
  }
  return [...new Set(filtered.map((talk) => talk.speaker).filter(Boolean))].sort();
}

function getConferenceKey(talk) {
  if (talk && talk.month && talk.year) {
    return `${talk.month} ${talk.year}`;
  }
  const match = String(talk?.reference).match(/^(April|October)\s+((?:19|20)\d{2})/);
  return match ? `${match[1]} ${match[2]}` : "";
}

function getTalksForConference(key) {
  return talks.filter((talk) => getConferenceKey(talk) === key);
}

function getRemainingTalksForFilter() {
  const remainingTalks = state.remainingIds.map((id) => getTalkById(id)).filter(Boolean);
  let filtered = remainingTalks;

  if (state.selectedConference !== "all") {
    filtered = filtered.filter((talk) => getConferenceKey(talk) === state.selectedConference);
  } else if (state.selectedYear !== "all") {
    filtered = filtered.filter((talk) => String(talk.year) === state.selectedYear);
  }

  if (state.selectedSpeaker !== "all") {
    filtered = filtered.filter((talk) => talk.speaker === state.selectedSpeaker);
  }

  return filtered;
}

function getYearConferenceRemainingCount() {
  const remainingTalks = state.remainingIds.map((id) => getTalkById(id)).filter(Boolean);
  if (state.selectedConference !== "all") {
    return remainingTalks.filter((t) => getConferenceKey(t) === state.selectedConference).length;
  }
  if (state.selectedYear !== "all") {
    return remainingTalks.filter((t) => String(t.year) === state.selectedYear).length;
  }
  return remainingTalks.length;
}

// ─── Draw filter dropdowns ────────────────────────────────────────────────────

function populateYearFilter() {
  ui.yearFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All years";
  ui.yearFilter.appendChild(allOption);
  availableYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    ui.yearFilter.appendChild(option);
  });
  ui.yearFilter.value = state.selectedYear;
}

function populateConferenceFilter(year) {
  ui.conferenceFilter.innerHTML = "";
  if (year === "all") {
    const option = document.createElement("option");
    option.value = "all";
    option.textContent = "Select a year first";
    ui.conferenceFilter.appendChild(option);
    ui.conferenceFilter.disabled = true;
    return;
  }
  ui.conferenceFilter.disabled = false;
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = `All ${year}`;
  ui.conferenceFilter.appendChild(allOption);
  getAvailableConferences(year).forEach((conf) => {
    const option = document.createElement("option");
    option.value = conf;
    option.textContent = conf;
    ui.conferenceFilter.appendChild(option);
  });
  ui.conferenceFilter.value = state.selectedConference;
}

function populateSpeakerFilter() {
  ui.speakerFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All speakers";
  ui.speakerFilter.appendChild(allOption);
  getAvailableSpeakers(state.selectedYear, state.selectedConference).forEach((speaker) => {
    const option = document.createElement("option");
    option.value = speaker;
    option.textContent = speaker;
    ui.speakerFilter.appendChild(option);
  });
  ui.speakerFilter.value = state.selectedSpeaker;
}

// ─── Mark-as-studied dropdowns ────────────────────────────────────────────────

function populateMarkYear() {
  ui.markYear.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All years";
  ui.markYear.appendChild(allOption);
  availableYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    ui.markYear.appendChild(option);
  });
  ui.markYear.value = markState.year;
}

function populateMarkConference() {
  ui.markConference.innerHTML = "";
  if (markState.year === "all") {
    const option = document.createElement("option");
    option.value = "all";
    option.textContent = "Select a year first";
    ui.markConference.appendChild(option);
    ui.markConference.disabled = true;
    return;
  }
  ui.markConference.disabled = false;
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = `All ${markState.year}`;
  ui.markConference.appendChild(allOption);
  getAvailableConferences(markState.year).forEach((conf) => {
    const option = document.createElement("option");
    option.value = conf;
    option.textContent = conf;
    ui.markConference.appendChild(option);
  });
  ui.markConference.value = markState.conference;
}

function populateMarkSpeaker() {
  ui.markSpeaker.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All speakers";
  ui.markSpeaker.appendChild(allOption);
  getAvailableSpeakers(markState.year, markState.conference).forEach((speaker) => {
    const option = document.createElement("option");
    option.value = speaker;
    option.textContent = speaker;
    ui.markSpeaker.appendChild(option);
  });
  ui.markSpeaker.value = markState.speaker;
}

function populateMarkTalk() {
  const remainingTalks = state.remainingIds.map((id) => getTalkById(id)).filter(Boolean);
  let filtered = remainingTalks;

  if (markState.conference !== "all") {
    filtered = filtered.filter((t) => getConferenceKey(t) === markState.conference);
  } else if (markState.year !== "all") {
    filtered = filtered.filter((t) => String(t.year) === markState.year);
  }

  if (markState.speaker !== "all") {
    filtered = filtered.filter((t) => t.speaker === markState.speaker);
  }

  filtered.sort((a, b) => a.title.localeCompare(b.title));

  ui.markTalk.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = !markState.talkId;
  placeholder.textContent = filtered.length === 0
    ? "No remaining talks match"
    : `Select from ${filtered.length} remaining talk${filtered.length === 1 ? "" : "s"}`;
  ui.markTalk.appendChild(placeholder);

  filtered.forEach((talk) => {
    const option = document.createElement("option");
    option.value = talk.id;
    option.textContent = talk.title;
    ui.markTalk.appendChild(option);
  });

  const stillValid = markState.talkId && filtered.some((t) => t.id === markState.talkId);
  if (stillValid) {
    ui.markTalk.value = markState.talkId;
    ui.markStudiedButton.disabled = false;
  } else {
    markState.talkId = null;
    ui.markStudiedButton.disabled = true;
  }
}

function renderMarkStudied() {
  populateMarkYear();
  populateMarkConference();
  populateMarkSpeaker();
  populateMarkTalk();
}

function updateClearFiltersVisibility() {
  const isFiltered =
    state.selectedYear !== "all" ||
    state.selectedConference !== "all" ||
    state.selectedSpeaker !== "all";
  ui.clearFiltersButton.classList.toggle("hidden", !isFiltered);
}

// ─── Counts and progress ──────────────────────────────────────────────────────

function updateCounts() {
  const filteredRemaining = getRemainingTalksForFilter().length;
  const ycRemaining = getYearConferenceRemainingCount();
  const progressPercent = talks.length === 0
    ? 0
    : Math.round((state.studiedIds.length / talks.length) * 100);

  ui.undoButton.disabled = state.studiedIds.length === 0;
  ui.totalCount.textContent = String(talks.length);
  ui.studiedCount.textContent = String(state.studiedIds.length);
  ui.remainingCount.textContent = String(state.remainingIds.length);
  ui.topFavoritesCount.textContent = String(state.favoriteIds.length);
  ui.filteredRemainingCount.textContent = String(filteredRemaining);
  ui.historyCount.textContent = `${state.studiedIds.length} talks drawn`;
  ui.favoritesCount.textContent = `${state.favoriteIds.length} favorites`;
  ui.progressText.textContent = `${progressPercent}% complete`;
  ui.progressFill.style.width = `${progressPercent}%`;

  if (state.selectedConference !== "all") {
    const totalForConf = getTalksForConference(state.selectedConference).length;
    const studiedForConf = totalForConf - ycRemaining;
    const confPercent = totalForConf === 0
      ? 0
      : Math.round((studiedForConf / totalForConf) * 100);
    ui.yearProgressPanel.classList.remove("hidden");
    ui.yearProgressLabel.textContent = `${state.selectedConference} progress`;
    ui.yearProgressText.textContent = `${confPercent}% complete (${studiedForConf} of ${totalForConf})`;
    ui.yearProgressFill.style.width = `${confPercent}%`;
    return;
  }

  if (state.selectedYear !== "all") {
    const totalForYear = talks.filter((t) => String(t.year) === state.selectedYear).length;
    const studiedForYear = totalForYear - ycRemaining;
    const yearPercent = totalForYear === 0
      ? 0
      : Math.round((studiedForYear / totalForYear) * 100);
    ui.yearProgressPanel.classList.remove("hidden");
    ui.yearProgressLabel.textContent = `${state.selectedYear} progress`;
    ui.yearProgressText.textContent = `${yearPercent}% complete (${studiedForYear} of ${totalForYear})`;
    ui.yearProgressFill.style.width = `${yearPercent}%`;
    return;
  }

  ui.yearProgressPanel.classList.add("hidden");
  ui.yearProgressFill.style.width = "0%";
}

// ─── Render talk card and lists ───────────────────────────────────────────────

function renderCurrentTalk() {
  const talk = getTalkById(state.currentTalkId);
  if (!talk) {
    ui.emptyState.classList.remove("hidden");
    ui.talkCard.classList.add("hidden");
    ui.favoriteButton.disabled = true;
    return;
  }
  ui.emptyState.classList.add("hidden");
  ui.talkCard.classList.remove("hidden");
  ui.talkSession.textContent = talk.session;
  ui.talkTitle.textContent = talk.title;
  ui.talkSpeaker.textContent = talk.speaker;
  ui.talkReference.textContent = talk.reference;
  ui.talkLink.href = talk.url;
  ui.favoriteButton.disabled = false;
  const isFav = state.favoriteIds.includes(talk.id);
  ui.favoriteButton.innerHTML = `
    <svg class="star-icon" viewBox="0 0 16 16"
      fill="${isFav ? "var(--gold)" : "none"}"
      stroke="${isFav ? "var(--gold)" : "currentColor"}"
      stroke-width="1.5" stroke-linejoin="round">
      <path d="M8 1.5l1.8 3.6 4 .58-2.9 2.83.68 3.99L8 10.5l-3.58 1.98.68-3.99L2.2 5.68l4-.58z"/>
    </svg>
    ${isFav ? "Remove from favorites" : "Add to favorites"}
  `;
  ui.favoriteButton.classList.toggle("btn-favorited", isFav);
}

function renderHistory() {
  ui.historyList.innerHTML = "";
  const query = ui.historySearch.value.trim().toLowerCase();
  let items = state.studiedIds.map((id) => getTalkById(id)).filter(Boolean).reverse();
  if (query) items = items.filter((t) => t.title.toLowerCase().includes(query) || t.speaker.toLowerCase().includes(query));

  if (state.studiedIds.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "No talks studied yet.";
    ui.historyList.appendChild(listItem);
    return;
  }

  if (items.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "No results match your search.";
    ui.historyList.appendChild(listItem);
    return;
  }

  items.forEach((talk) => {
    const listItem = document.createElement("li");
    listItem.className = "history-item";

    const copy = document.createElement("div");
    copy.className = "history-copy";

    const titleLink = document.createElement("a");
    titleLink.href = talk.url;
    titleLink.target = "_blank";
    titleLink.rel = "noreferrer";
    titleLink.className = "history-talk-link";
    const titleText = document.createElement("strong");
    titleText.textContent = talk.title;
    titleLink.appendChild(titleText);

    const details = document.createElement("div");
    details.textContent = `${talk.speaker} • ${talk.reference}`;

    copy.appendChild(titleLink);
    copy.appendChild(document.createElement("br"));
    copy.appendChild(details);

    const favButton = document.createElement("button");
    favButton.type = "button";
    favButton.className = "secondary-button history-favorite-button";
    const isHistFav = state.favoriteIds.includes(talk.id);
    favButton.innerHTML = `
      <svg class="star-icon" viewBox="0 0 16 16"
        fill="${isHistFav ? "var(--gold)" : "none"}"
        stroke="${isHistFav ? "var(--gold)" : "currentColor"}"
        stroke-width="1.5" stroke-linejoin="round">
        <path d="M8 1.5l1.8 3.6 4 .58-2.9 2.83.68 3.99L8 10.5l-3.58 1.98.68-3.99L2.2 5.68l4-.58z"/>
      </svg>
      ${isHistFav ? "Unfavorite" : "Favorite"}
    `;
    favButton.classList.toggle("btn-favorited", isHistFav);
    favButton.addEventListener("click", () => toggleFavoriteById(talk.id));

    listItem.appendChild(copy);
    listItem.appendChild(favButton);
    ui.historyList.appendChild(listItem);
  });
}

function renderFavorites() {
  ui.favoritesList.innerHTML = "";
  const query = ui.favoritesSearch.value.trim().toLowerCase();
  let items = state.favoriteIds.map((id) => getTalkById(id)).filter(Boolean).reverse();
  if (query) items = items.filter((t) => t.title.toLowerCase().includes(query) || t.speaker.toLowerCase().includes(query));

  if (state.favoriteIds.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "No favorite talks yet.";
    ui.favoritesList.appendChild(listItem);
    return;
  }

  if (items.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "No results match your search.";
    ui.favoritesList.appendChild(listItem);
    return;
  }

  items.forEach((talk) => {
    const listItem = document.createElement("li");
    listItem.className = "favorite-item";

    const copy = document.createElement("div");
    copy.className = "favorite-copy";

    const title = document.createElement("strong");
    title.textContent = talk.title;
    const details = document.createElement("div");
    details.textContent = `${talk.speaker} • ${talk.reference}`;
    copy.appendChild(title);
    copy.appendChild(document.createElement("br"));
    copy.appendChild(details);

    const openLink = document.createElement("a");
    openLink.href = talk.url;
    openLink.target = "_blank";
    openLink.rel = "noreferrer";
    openLink.className = "talk-link favorite-open-link";
    openLink.textContent = "Open talk";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary-button favorite-remove-button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => removeFavoriteById(talk.id));

    const favoriteActions = document.createElement("div");
    favoriteActions.className = "favorite-actions";
    favoriteActions.appendChild(openLink);
    favoriteActions.appendChild(removeButton);

    listItem.appendChild(copy);
    listItem.appendChild(favoriteActions);
    ui.favoritesList.appendChild(listItem);
  });
}

function render() {
  populateYearFilter();
  populateConferenceFilter(state.selectedYear);
  populateSpeakerFilter();
  updateCounts();
  renderCurrentTalk();
  renderHistory();
  renderFavorites();
  renderMarkStudied();
  updateClearFiltersVisibility();
}

// ─── Status messages ──────────────────────────────────────────────────────────

function updateStatusMessage(message) {
  ui.statusMessage.textContent = message;
}

function buildDrawStatusMessage() {
  const parts = [];
  if (state.selectedConference !== "all") parts.push(state.selectedConference);
  else if (state.selectedYear !== "all") parts.push(state.selectedYear);
  if (state.selectedSpeaker !== "all") parts.push(`by ${state.selectedSpeaker}`);
  const qualifier = parts.length > 0 ? ` ${parts.join(" ")}` : "";
  return `A new${qualifier} talk has been drawn and removed from the remaining bag.`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function drawRandomTalk() {
  if (state.remainingIds.length === 0) {
    state.currentTalkId = null;
    saveState();
    render();
    updateStatusMessage("You have finished every talk in the bag. Reset to start again.");
    return;
  }

  const filteredRemainingTalks = getRemainingTalksForFilter();
  if (filteredRemainingTalks.length === 0) {
    updateStatusMessage("There are no remaining talks for that selection. Choose a different filter or reset the bag.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredRemainingTalks.length);
  const selectedId = filteredRemainingTalks[randomIndex].id;
  const selectedIndexInBag = state.remainingIds.indexOf(selectedId);

  if (selectedIndexInBag === -1) {
    updateStatusMessage("Something went wrong while drawing the talk. Please try again.");
    return;
  }

  state.remainingIds.splice(selectedIndexInBag, 1);
  state.currentTalkId = selectedId;
  state.studiedIds.push(selectedId);
  saveState();
  render();
  updateStatusMessage(buildDrawStatusMessage());
}

function undoLastDraw() {
  if (state.studiedIds.length === 0) return;
  const lastId = state.studiedIds[state.studiedIds.length - 1];
  state.studiedIds.pop();
  state.remainingIds.push(lastId);
  if (state.currentTalkId === lastId) state.currentTalkId = null;
  saveState();
  render();
  const talk = getTalkById(lastId);
  updateStatusMessage(`"${talk.title}" has been returned to the remaining bag.`);
}

function markTalkAsStudied() {
  const talkId = markState.talkId;
  if (!talkId) return;

  const idx = state.remainingIds.indexOf(talkId);
  if (idx === -1) {
    updateStatusMessage("That talk has already been removed from the remaining bag.");
    return;
  }

  const talk = getTalkById(talkId);
  state.remainingIds.splice(idx, 1);
  state.studiedIds.push(talkId);
  markState = { year: "all", conference: "all", speaker: "all", talkId: null };
  saveState();
  render();
  updateStatusMessage(`"${talk.title}" has been marked as studied and removed from the remaining bag.`);
}

function resetBag() {
  if (!resetPending) {
    resetPending = true;
    ui.resetButton.textContent = "Are you sure? Click again to confirm.";
    ui.resetButton.classList.add("reset-pending");
    updateStatusMessage("This will clear your progress. Favorites are kept.");

    setTimeout(() => {
      if (resetPending) {
        resetPending = false;
        ui.resetButton.textContent = "Reset the bag";
        ui.resetButton.classList.remove("reset-pending");
        updateStatusMessage("Reset canceled — took too long.");
      }
    }, 4000);

    return;
  }

  resetPending = false;
  ui.resetButton.textContent = "Reset the bag";
  ui.resetButton.classList.remove("reset-pending");

  const favoriteIds = [...state.favoriteIds];
  state = createFreshState();
  state.favoriteIds = favoriteIds;
  populateYearFilter();
  saveState();
  render();
  updateStatusMessage("The bag has been reset. Your favorites are still saved.");
}

function toggleFavoriteById(talkId) {
  const favoriteIndex = state.favoriteIds.indexOf(talkId);
  if (favoriteIndex === -1) {
    state.favoriteIds.push(talkId);
    updateStatusMessage("That talk has been added to your favorites.");
  } else {
    state.favoriteIds.splice(favoriteIndex, 1);
    updateStatusMessage("That talk has been removed from your favorites.");
  }
  saveState();
  render();
}

function toggleFavorite() {
  const talkId = state.currentTalkId;
  if (!talkId) {
    updateStatusMessage("Draw a talk before adding a favorite.");
    return;
  }
  toggleFavoriteById(talkId);
}

function removeFavoriteById(talkId) {
  const favoriteIndex = state.favoriteIds.indexOf(talkId);
  if (favoriteIndex === -1) {
    updateStatusMessage("That talk is not currently in your favorites.");
    return;
  }
  state.favoriteIds.splice(favoriteIndex, 1);
  saveState();
  render();
  updateStatusMessage("The talk has been removed from your favorites.");
}

// ─── Event listeners ──────────────────────────────────────────────────────────

ui.drawButton.addEventListener("click", drawRandomTalk);
ui.undoButton.addEventListener("click", undoLastDraw);
ui.resetButton.addEventListener("click", resetBag);
ui.favoriteButton.addEventListener("click", toggleFavorite);

ui.yearFilter.addEventListener("change", (event) => {
  state.selectedYear = event.target.value;
  state.selectedConference = "all";
  state.selectedSpeaker = "all";
  saveState();
  render();
  updateStatusMessage(
    state.selectedYear === "all"
      ? "Now drawing from every remaining talk."
      : `Now drawing from all remaining ${state.selectedYear} talks.`
  );
});

ui.conferenceFilter.addEventListener("change", (event) => {
  state.selectedConference = event.target.value;
  state.selectedSpeaker = "all";
  saveState();
  render();
  updateStatusMessage(
    state.selectedConference === "all"
      ? `Now drawing from all remaining ${state.selectedYear} talks.`
      : `Now drawing from the remaining ${state.selectedConference} talks.`
  );
});

ui.speakerFilter.addEventListener("change", (event) => {
  state.selectedSpeaker = event.target.value;
  saveState();
  render();
  updateStatusMessage(
    state.selectedSpeaker === "all"
      ? "Speaker filter cleared."
      : `Now drawing talks by ${state.selectedSpeaker}.`
  );
});

ui.markYear.addEventListener("change", (event) => {
  markState.year = event.target.value;
  markState.conference = "all";
  markState.speaker = "all";
  markState.talkId = null;
  renderMarkStudied();
});

ui.markConference.addEventListener("change", (event) => {
  markState.conference = event.target.value;
  markState.speaker = "all";
  markState.talkId = null;
  renderMarkStudied();
});

ui.markSpeaker.addEventListener("change", (event) => {
  markState.speaker = event.target.value;
  markState.talkId = null;
  renderMarkStudied();
});

ui.markTalk.addEventListener("change", (event) => {
  markState.talkId = event.target.value || null;
  ui.markStudiedButton.disabled = !markState.talkId;
});

ui.markStudiedButton.addEventListener("click", markTalkAsStudied);

ui.historySearch.addEventListener("input", renderHistory);
ui.favoritesSearch.addEventListener("input", renderFavorites);

ui.clearFiltersButton.addEventListener("click", () => {
  state.selectedYear = "all";
  state.selectedConference = "all";
  state.selectedSpeaker = "all";
  saveState();
  render();
  updateStatusMessage("Filters cleared. Drawing from all remaining talks.");
});

// ─── Supabase data sync ───────────────────────────────────────────────────────

async function saveStateToSupabase() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  await supabaseClient
    .from("user_progress")
    .upsert({
      user_id: user.id,
      remaining_ids: state.remainingIds,
      studied_ids: state.studiedIds,
      favorite_ids: state.favoriteIds,
      current_talk_id: state.currentTalkId,
      selected_year: state.selectedYear,
      selected_conference: state.selectedConference,
      selected_speaker: state.selectedSpeaker,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
}

async function loadStateFromSupabase() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  const { data, error } = await supabaseClient
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error || !data) return;
  const validIds = new Set(talks.map(t => t.id));
  const remainingIds = (data.remaining_ids || []).filter(id => validIds.has(id));
  const studiedIds = (data.studied_ids || []).filter(id => validIds.has(id));
  const allKnownIds = new Set([...remainingIds, ...studiedIds]);
  const missingIds = talks.map(t => t.id).filter(id => !allKnownIds.has(id));
  state.remainingIds = [...remainingIds, ...missingIds];
  state.studiedIds = studiedIds;
  state.favoriteIds = (data.favorite_ids || []).filter(id => validIds.has(id));
  state.currentTalkId = validIds.has(data.current_talk_id) ? data.current_talk_id : null;
  state.selectedYear = data.selected_year || "all";
  state.selectedConference = data.selected_conference || "all";
  state.selectedSpeaker = data.selected_speaker || "all";
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

let authMode = "signin";

function showAuthModal() { ui.authOverlay.classList.remove("hidden"); }
function hideAuthModal() { ui.authOverlay.classList.add("hidden"); }

function setUserBar(user) {
  ui.userBar.classList.toggle("hidden", !user);
  ui.userEmail.textContent = user ? user.email : "";
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll(".auth-toggle-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  ui.authPasswordField.classList.toggle("hidden", mode === "reset");
  ui.authConfirmField.classList.toggle("hidden", mode !== "signup");
  ui.forgotPasswordBtn.classList.toggle("hidden", mode !== "signin");
  ui.authConfirmPassword.value = "";
  ui.authError.classList.add("hidden");
  ui.authError.style.color = "";
  if (mode === "signin") ui.authSubmit.textContent = "Sign In";
  else if (mode === "signup") ui.authSubmit.textContent = "Create Account";
  else ui.authSubmit.textContent = "Send Reset Link";
}

document.querySelectorAll(".auth-toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => setAuthMode(btn.dataset.mode));
});

ui.forgotPasswordBtn.addEventListener("click", () => setAuthMode("reset"));

ui.authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = ui.authEmail.value.trim();
  const password = ui.authPassword.value;
  ui.authError.classList.add("hidden");
  ui.authError.style.color = "";

  if (authMode === "signup" && password !== ui.authConfirmPassword.value) {
    ui.authError.textContent = "Passwords don't match. Please try again.";
    ui.authError.classList.remove("hidden");
    return;
  }

  ui.authSubmit.disabled = true;
  ui.authSubmit.textContent = authMode === "signin" ? "Signing in…" : authMode === "signup" ? "Creating account…" : "Sending…";

  try {
    if (authMode === "reset") {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password.html"
      });
      if (error) {
        ui.authError.textContent = error.message;
        ui.authError.classList.remove("hidden");
      } else {
        ui.authError.style.color = "green";
        ui.authError.textContent = "Check your email for a password reset link.";
        ui.authError.classList.remove("hidden");
      }
      ui.authSubmit.disabled = false;
      ui.authSubmit.textContent = "Send Reset Link";
      return;
    }

    if (authMode === "signin") {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        ui.authError.textContent = error.message;
        ui.authError.classList.remove("hidden");
        ui.authSubmit.disabled = false;
        ui.authSubmit.textContent = "Sign In";
      }
      // success: onAuthStateChange handles hiding the modal
    } else {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) {
        ui.authError.textContent = error.message;
        ui.authError.classList.remove("hidden");
      } else {
        ui.authError.style.color = "green";
        ui.authError.textContent = "Account created! Please check your email to confirm your account.";
        ui.authError.classList.remove("hidden");
      }
      ui.authSubmit.disabled = false;
      ui.authSubmit.textContent = "Create Account";
    }
  } catch {
    ui.authError.textContent = "Something went wrong. Please try again.";
    ui.authError.classList.remove("hidden");
    ui.authSubmit.disabled = false;
    ui.authSubmit.textContent = authMode === "signin" ? "Sign In" : authMode === "signup" ? "Create Account" : "Send Reset Link";
  }
});

ui.syncButton.addEventListener("click", async () => {
  ui.syncButton.disabled = true;
  ui.syncButton.classList.add("syncing");
  ui.syncLabel.textContent = "Syncing…";
  await loadStateFromSupabase();
  ui.syncButton.classList.remove("syncing");
  ui.syncLabel.textContent = "Synced";
  setTimeout(() => {
    ui.syncLabel.textContent = "Sync";
    ui.syncButton.disabled = false;
  }, 2000);
});

ui.signoutButton.addEventListener("click", () => supabaseClient.auth.signOut());

async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    hideAuthModal();
    setUserBar(session.user);
    await loadStateFromSupabase();
  } else {
    showAuthModal();
  }
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      hideAuthModal();
      setUserBar(session.user);
      await loadStateFromSupabase();
    } else if (event === "SIGNED_OUT") {
      setUserBar(null);
      showAuthModal();
    }
  });
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });
  history.replaceState(null, "", tabName === "home" ? location.pathname : `#${tabName}`);
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

ui.fabDrawButton.addEventListener("click", () => {
  drawRandomTalk();
  switchTab("home");
});

const initialTab = ["home", "library"].includes(location.hash.slice(1))
  ? location.hash.slice(1)
  : "home";
switchTab(initialTab);

render();
initAuth();

// Re-sync from Supabase whenever the user returns to this tab/app window,
// so the bag stays consistent across devices without a manual Sync click.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadStateFromSupabase();
});
