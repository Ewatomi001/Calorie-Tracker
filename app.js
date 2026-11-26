// ============================================================
//  Calorie Tracker – Vanilla JS with localStorage persistence
// ============================================================

(function () {
  'use strict';

  // ---- Constants -----------------------------------------------------------
  const STORAGE_ENTRIES = 'calorieTracker_entries';
  const STORAGE_GOAL = 'calorieTracker_goal';
  const DEFAULT_GOAL = 2000;

  const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
  const MEAL_LABELS = {
    breakfast: '🌅 Breakfast',
    lunch: '☀️ Lunch',
    dinner: '🌙 Dinner',
    snack: '🍿 Snack',
  };

  // ---- State ---------------------------------------------------------------
  let currentDate = todayString();
  let goal = loadGoal();

  // ---- DOM refs ------------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);

  const headerDate = $('#header-date');
  const prevDayBtn = $('#prev-day');
  const nextDayBtn = $('#next-day');
  const todayBtn = $('#today-btn');

  const summaryGoal = $('#summary-goal');
  const summaryConsumed = $('#summary-consumed');
  const summaryRemaining = $('#summary-remaining');
  const summaryRemainingCard = document.querySelector('.summary-remaining');

  const progressBar = $('#progress-bar');
  const progressText = $('#progress-text');

  const entryForm = $('#entry-form');
  const foodNameInput = $('#food-name');
  const foodCaloriesInput = $('#food-calories');
  const foodMealSelect = $('#food-meal');

  const mealsSection = $('#meals-section');
  const emptyState = $('#empty-state');

  const goalModal = $('#goal-modal');
  const editGoalBtn = $('#edit-goal-btn');
  const goalForm = $('#goal-form');
  const goalInput = $('#goal-input');
  const goalCancelBtn = $('#goal-cancel');

  const editModal = $('#edit-modal');
  const editForm = $('#edit-form');
  const editIdInput = $('#edit-id');
  const editNameInput = $('#edit-name');
  const editCaloriesInput = $('#edit-calories');
  const editMealSelect = $('#edit-meal');
  const editCancelBtn = $('#edit-cancel');

  const weeklyChart = $('#weekly-chart');
  const clearDayBtn = $('#clear-day-btn');

  // ---- Helpers -------------------------------------------------------------

  /** Return today as YYYY-MM-DD */
  function todayString() {
    return new Date().toISOString().slice(0, 10);
  }

  /** Shift a YYYY-MM-DD string by `days` */
  function shiftDate(dateStr, days) {
    const d = new Date(dateStr + 'T12:00:00'); // noon avoids DST edge
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /** Pretty format for header */
  function formatDateHeader(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', opts);
  }

  /** Pretty short day label */
  function shortDay(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  /** Generate a simple unique ID */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Current time as HH:MM */
  function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // ---- Storage -------------------------------------------------------------

  function loadAllEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_ENTRIES)) || {};
    } catch {
      return {};
    }
  }

  function saveAllEntries(all) {
    localStorage.setItem(STORAGE_ENTRIES, JSON.stringify(all));
  }

  function getEntriesForDate(dateStr) {
    const all = loadAllEntries();
    return all[dateStr] || [];
  }

  function setEntriesForDate(dateStr, entries) {
    const all = loadAllEntries();
    if (entries.length === 0) {
      delete all[dateStr];
    } else {
      all[dateStr] = entries;
    }
    saveAllEntries(all);
  }

  function loadGoal() {
    const stored = localStorage.getItem(STORAGE_GOAL);
    return stored ? parseInt(stored, 10) : DEFAULT_GOAL;
  }

  function saveGoal(value) {
    localStorage.setItem(STORAGE_GOAL, value);
  }

  // ---- Core logic ----------------------------------------------------------

  function addEntry(name, calories, meal) {
    const entries = getEntriesForDate(currentDate);
    entries.push({
      id: uid(),
      name,
      calories: parseInt(calories, 10),
      meal,
      time: nowTime(),
    });
    setEntriesForDate(currentDate, entries);
  }

  function deleteEntry(id) {
    let entries = getEntriesForDate(currentDate);
    entries = entries.filter((e) => e.id !== id);
    setEntriesForDate(currentDate, entries);
  }

  function updateEntry(id, name, calories, meal) {
    const entries = getEntriesForDate(currentDate);
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      entry.name = name;
      entry.calories = parseInt(calories, 10);
      entry.meal = meal;
    }
    setEntriesForDate(currentDate, entries);
  }

  function totalCalories(dateStr) {
    const entries = getEntriesForDate(dateStr);
    return entries.reduce((sum, e) => sum + e.calories, 0);
  }

  // ---- Rendering -----------------------------------------------------------

  function render() {
    renderHeader();
    renderSummary();
    renderProgress();
    renderMeals();
    renderWeeklyChart();
  }

  function renderHeader() {
    const isToday = currentDate === todayString();
    const label = isToday ? 'Today' : formatDateHeader(currentDate);
    headerDate.textContent = isToday
      ? formatDateHeader(currentDate)
      : formatDateHeader(currentDate);
    todayBtn.textContent = isToday ? 'Today' : 'Go to Today';
    todayBtn.classList.toggle('btn-today--active', isToday);
  }

  function renderSummary() {
    const consumed = totalCalories(currentDate);
    const remaining = goal - consumed;

    summaryGoal.textContent = goal.toLocaleString();
    summaryConsumed.textContent = consumed.toLocaleString();
    summaryRemaining.textContent = Math.abs(remaining).toLocaleString();

    if (remaining < 0) {
      summaryRemainingCard.classList.add('over');
      summaryRemaining.textContent = '+' + Math.abs(remaining).toLocaleString();
    } else {
      summaryRemainingCard.classList.remove('over');
    }
  }

  function renderProgress() {
    const consumed = totalCalories(currentDate);
    const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
    const displayPct = goal > 0 ? Math.round((consumed / goal) * 100) : 0;

    progressBar.style.width = pct + '%';
    progressText.textContent = displayPct + '%';

    if (consumed > goal) {
      progressBar.classList.add('over');
    } else {
      progressBar.classList.remove('over');
    }
  }

  function renderMeals() {
    const entries = getEntriesForDate(currentDate);

    if (entries.length === 0) {
      mealsSection.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    // Group by meal
    const groups = {};
    for (const entry of entries) {
      if (!groups[entry.meal]) groups[entry.meal] = [];
      groups[entry.meal].push(entry);
    }

    let html = '';

    for (const meal of MEAL_ORDER) {
      if (!groups[meal]) continue;

      const mealTotal = groups[meal].reduce((s, e) => s + e.calories, 0);

      html += `
        <div class="meal-group">
          <div class="meal-header">
            <span class="meal-title">${MEAL_LABELS[meal]}</span>
            <span class="meal-total">${mealTotal.toLocaleString()} kcal</span>
          </div>
          <ul class="entry-list">
      `;

      for (const entry of groups[meal]) {
        html += `
          <li class="entry-item" data-id="${entry.id}">
            <div class="entry-info">
              <span class="entry-name">${escapeHTML(entry.name)}</span>
              <span class="entry-time">${entry.time || ''}</span>
            </div>
            <div class="entry-actions">
              <span class="entry-calories">${entry.calories} kcal</span>
              <button class="btn-entry-action btn-edit" data-id="${entry.id}" title="Edit">✏️</button>
              <button class="btn-entry-action btn-delete" data-id="${entry.id}" title="Delete">🗑️</button>
            </div>
          </li>
        `;
      }

      html += `</ul></div>`;
    }

    mealsSection.innerHTML = html;

    // Bind entry actions
    mealsSection.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        // Animate out
        const item = btn.closest('.entry-item');
        item.style.transition = 'opacity 0.2s, transform 0.2s';
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        setTimeout(() => {
          deleteEntry(id);
          render();
        }, 200);
      });
    });

    mealsSection.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEditModal(btn.dataset.id);
      });
    });
  }

  function renderWeeklyChart() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(shiftDate(todayString(), -i));
    }

    const totals = days.map((d) => totalCalories(d));
    const maxVal = Math.max(...totals, goal) || 1;

    let html = '';
    for (let i = 0; i < 7; i++) {
      const d = days[i];
      const cal = totals[i];
      const heightPct = (cal / maxVal) * 100;
      const isToday = d === todayString();
      const isOver = cal > goal;

      html += `
        <div class="week-day ${isToday ? 'is-today' : ''}">
          <span class="week-value">${cal > 0 ? cal : ''}</span>
          <div class="week-bar-track">
            <div class="week-bar ${isOver ? 'over' : ''}" style="height:${heightPct}%"></div>
          </div>
          <span class="week-label">${shortDay(d)}</span>
        </div>
      `;
    }

    weeklyChart.innerHTML = html;
  }

  // ---- Escape HTML ---------------------------------------------------------
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Modals --------------------------------------------------------------

  function openGoalModal() {
    goalInput.value = goal;
    goalModal.hidden = false;
    goalInput.focus();
  }

  function closeGoalModal() {
    goalModal.hidden = true;
  }

  function openEditModal(id) {
    const entries = getEntriesForDate(currentDate);
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    editIdInput.value = entry.id;
    editNameInput.value = entry.name;
    editCaloriesInput.value = entry.calories;
    editMealSelect.value = entry.meal;
    editModal.hidden = false;
    editNameInput.focus();
  }

  function closeEditModal() {
    editModal.hidden = true;
  }

  // ---- Event Handlers ------------------------------------------------------

  // Date navigation
  prevDayBtn.addEventListener('click', () => {
    currentDate = shiftDate(currentDate, -1);
    render();
  });

  nextDayBtn.addEventListener('click', () => {
    currentDate = shiftDate(currentDate, 1);
    render();
  });

  todayBtn.addEventListener('click', () => {
    currentDate = todayString();
    render();
  });

  // Add entry
  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = foodNameInput.value.trim();
    const cal = foodCaloriesInput.value;
    const meal = foodMealSelect.value;

    if (!name || !cal || parseInt(cal, 10) <= 0) return;

    addEntry(name, cal, meal);
    entryForm.reset();
    foodNameInput.focus();
    render();
  });

  // Goal modal
  editGoalBtn.addEventListener('click', openGoalModal);
  goalCancelBtn.addEventListener('click', closeGoalModal);

  goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = parseInt(goalInput.value, 10);
    if (val && val > 0) {
      goal = val;
      saveGoal(goal);
      closeGoalModal();
      render();
    }
  });

  goalModal.addEventListener('click', (e) => {
    if (e.target === goalModal) closeGoalModal();
  });

  // Edit modal
  editCancelBtn.addEventListener('click', closeEditModal);

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editIdInput.value;
    const name = editNameInput.value.trim();
    const cal = editCaloriesInput.value;
    const meal = editMealSelect.value;

    if (!name || !cal || parseInt(cal, 10) <= 0) return;

    updateEntry(id, name, parseInt(cal, 10), meal);
    closeEditModal();
    render();
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // Clear day
  clearDayBtn.addEventListener('click', () => {
    const entries = getEntriesForDate(currentDate);
    if (entries.length === 0) return;

    if (confirm('Delete all entries for this day?')) {
      setEntriesForDate(currentDate, []);
      render();
    }
  });

  // Keyboard: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!goalModal.hidden) closeGoalModal();
      if (!editModal.hidden) closeEditModal();
    }
  });

  // ---- Init ----------------------------------------------------------------
  render();
})();
