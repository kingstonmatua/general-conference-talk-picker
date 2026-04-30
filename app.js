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
  resetButton: document.querySelector("#reset-button"),
  favoriteButton: document.querySelector("#favorite-button"),
  yearFilter: document.querySelector("#year-filter"),
  statusMessage: document.querySelector("#status-message"),
  emptyState: document.querySelector("#empty-state"),
  talkCard: document.querySelector("#talk-card"),
  talkSession: document.querySelector("#talk-session"),
  talkTitle: document.querySelector("#talk-title"),
  talkSpeaker: document.querySelector("#talk-speaker"),
  talkReference: document.querySelector("#talk-reference"),
  talkLink: document.querySelector("#talk-link"),
  historyCount: document.querySelector("#history-count"),
  historyList: document.querySelector("#history-list"),
  favoritesCount: document.querySelector("#favorites-count"),
  favoritesList: document.querySelector("#favorites-list")
};

const talks = Array.isArray(window.TALKS) ? window.TALKS : [];
const availableYears = getAvailableYears();
let state = loadState();

function createFreshState() {
  return {
    remainingIds: talks.map((talk) => talk.id),
    studiedIds: [],
    favoriteIds: [],
    currentTalkId: null,
    selectedYear: "all"
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

    return {
      remainingIds: [...remainingIds, ...missingIds],
      studiedIds,
      favoriteIds,
      currentTalkId,
      selectedYear: saved.selectedYear && availableYears.includes(saved.selectedYear)
        ? saved.selectedYear
        : "all"
    };
  } catch {
    return createFreshState();
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTalkById(id) {
  return talks.find((talk) => talk.id === id) || null;
}

function getAvailableYears() {
  return [...new Set(
    talks
      .map((talk) => getTalkYear(talk))
      .filter(Boolean)
  )].sort((a, b) => Number(b) - Number(a));
}

function getTalkYear(talk) {
  if (talk && talk.year) {
    return String(talk.year);
  }

  const match = String(talk?.reference).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function getSelectedYear() {
  return state.selectedYear || "all";
}

function getTalksForYear(year) {
  return talks.filter((talk) => getTalkYear(talk) === year);
}

function getRemainingTalksForFilter() {
  const selectedYear = getSelectedYear();
  const remainingTalks = state.remainingIds
    .map((id) => getTalkById(id))
    .filter(Boolean);

  if (selectedYear === "all") {
    return remainingTalks;
  }

  return remainingTalks.filter((talk) => getTalkYear(talk) === selectedYear);
}

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

  ui.yearFilter.value = getSelectedYear();
}

function updateCounts() {
  const filteredRemaining = getRemainingTalksForFilter().length;
  const progressPercent = talks.length === 0
    ? 0
    : Math.round((state.studiedIds.length / talks.length) * 100);
  const selectedYear = getSelectedYear();

  ui.totalCount.textContent = String(talks.length);
  ui.studiedCount.textContent = String(state.studiedIds.length);
  ui.remainingCount.textContent = String(state.remainingIds.length);
  ui.topFavoritesCount.textContent = String(state.favoriteIds.length);
  ui.filteredRemainingCount.textContent = String(filteredRemaining);
  ui.historyCount.textContent = `${state.studiedIds.length} talks drawn`;
  ui.favoritesCount.textContent = `${state.favoriteIds.length} favorites`;
  ui.progressText.textContent = `${progressPercent}% complete`;
  ui.progressFill.style.width = `${progressPercent}%`;

  if (selectedYear === "all") {
    ui.yearProgressPanel.classList.add("hidden");
    ui.yearProgressFill.style.width = "0%";
    return;
  }

  const totalTalksForYear = getTalksForYear(selectedYear).length;
  const remainingTalksForYear = filteredRemaining;
  const studiedTalksForYear = totalTalksForYear - remainingTalksForYear;
  const yearProgressPercent = totalTalksForYear === 0
    ? 0
    : Math.round((studiedTalksForYear / totalTalksForYear) * 100);

  ui.yearProgressPanel.classList.remove("hidden");
  ui.yearProgressLabel.textContent = `${selectedYear} progress`;
  ui.yearProgressText.textContent = `${yearProgressPercent}% complete (${studiedTalksForYear} of ${totalTalksForYear})`;
  ui.yearProgressFill.style.width = `${yearProgressPercent}%`;
}

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
  ui.favoriteButton.textContent = state.favoriteIds.includes(talk.id)
    ? "Remove from favorites"
    : "Add to favorites";
}

function renderHistory() {
  ui.historyList.innerHTML = "";

  const items = state.studiedIds
    .map((id) => getTalkById(id))
    .filter(Boolean)
    .reverse();

  if (items.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "No talks studied yet.";
    ui.historyList.appendChild(listItem);
    return;
  }

  items.forEach((talk) => {
    const listItem = document.createElement("li");
    listItem.className = "history-item";
    const title = document.createElement("strong");
    title.textContent = talk.title;

    const details = document.createElement("div");
    details.textContent = `${talk.speaker} • ${talk.reference}`;

    listItem.appendChild(title);
    listItem.appendChild(document.createElement("br"));
    listItem.appendChild(details);
    ui.historyList.appendChild(listItem);
  });
}

function renderFavorites() {
  ui.favoritesList.innerHTML = "";

  const items = state.favoriteIds
    .map((id) => getTalkById(id))
    .filter(Boolean)
    .reverse();

  if (items.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "No favorite talks yet.";
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

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary-button favorite-remove-button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      removeFavoriteById(talk.id);
    });

    listItem.appendChild(copy);
    listItem.appendChild(removeButton);
    ui.favoritesList.appendChild(listItem);
  });
}

function updateStatusMessage(message) {
  ui.statusMessage.textContent = message;
}

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
    updateStatusMessage("There are no remaining talks for that year. Choose another year or reset the bag.");
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
  updateStatusMessage(
    getSelectedYear() === "all"
      ? "A new talk has been drawn and removed from the remaining bag."
      : `A new ${getSelectedYear()} talk has been drawn and removed from the remaining bag.`
  );
}

function resetBag() {
  const confirmed = window.confirm(
    "Are you sure you want to reset? This will put every talk back in the bag and clear your current progress, but your favorites will stay saved."
  );

  if (!confirmed) {
    updateStatusMessage("Reset canceled. Your progress is unchanged.");
    return;
  }

  const favoriteIds = [...state.favoriteIds];
  state = createFreshState();
  state.favoriteIds = favoriteIds;
  populateYearFilter();
  saveState();
  render();
  updateStatusMessage("The bag has been reset. Your favorites are still saved.");
}

function toggleFavorite() {
  const talkId = state.currentTalkId;

  if (!talkId) {
    updateStatusMessage("Draw a talk before adding a favorite.");
    return;
  }

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

function render() {
  populateYearFilter();
  updateCounts();
  renderCurrentTalk();
  renderHistory();
  renderFavorites();
}

ui.drawButton.addEventListener("click", drawRandomTalk);
ui.resetButton.addEventListener("click", resetBag);
ui.favoriteButton.addEventListener("click", toggleFavorite);
ui.yearFilter.addEventListener("change", (event) => {
  state.selectedYear = event.target.value;
  saveState();
  render();
  updateStatusMessage(
    state.selectedYear === "all"
      ? "Now drawing from every remaining talk."
      : `Now drawing from the remaining talks in ${state.selectedYear}.`
  );
});

render();
