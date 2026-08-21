(function () {
  "use strict";

  var STORAGE_KEY = "cricket-rw-calc-state-v1";
  var MAX_TEAMS = 4;
  var MAX_MATCHES = 4;

  var teamListEl = document.getElementById("team-list");
  var matchListEl = document.getElementById("match-list");
  var resultsEl = document.getElementById("results-table");
  var addMatchBtn = document.getElementById("add-match-btn");
  var matchLimitNote = document.getElementById("match-limit-note");
  var resetBtn = document.getElementById("reset-btn");

  var state = loadState();

  function defaultState() {
    var teams = [];
    for (var i = 0; i < MAX_TEAMS; i++) {
      teams.push({ id: "t" + (i + 1), name: "Team " + (i + 1) });
    }
    return { teams: teams, matches: [] };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.teams) || !Array.isArray(parsed.matches)) {
        return defaultState();
      }
      return parsed;
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function newMatch() {
    var teamA = state.teams[0];
    var teamB = state.teams[1] || state.teams[0];
    return {
      id: "m" + Date.now() + Math.floor(Math.random() * 1000),
      teamAId: teamA.id,
      teamBId: teamB.id,
      runsA: 0,
      wicketsA: 1,
      runsB: 0,
      wicketsB: 1
    };
  }

  function teamById(id) {
    for (var i = 0; i < state.teams.length; i++) {
      if (state.teams[i].id === id) return state.teams[i];
    }
    return null;
  }

  function rw(runs, wickets) {
    var w = Number(wickets);
    var r = Number(runs);
    if (!w || w <= 0) return null;
    return r / w;
  }

  function formatSigned(num, decimals) {
    if (num === null || isNaN(num)) return "-";
    var sign = num > 0 ? "+" : "";
    return sign + num.toFixed(decimals);
  }

  function render() {
    renderTeams();
    renderMatches();
    renderResults();
    saveState();
  }

  function renderTeams() {
    teamListEl.innerHTML = "";
    state.teams.forEach(function (team, index) {
      var row = document.createElement("div");
      row.className = "team-row";

      var dot = document.createElement("span");
      dot.className = "team-color";
      dot.style.background = teamColor(index);
      row.appendChild(dot);

      var input = document.createElement("input");
      input.type = "text";
      input.value = team.name;
      input.maxLength = 24;
      input.setAttribute("aria-label", "Team " + (index + 1) + " name");
      input.addEventListener("input", function () {
        team.name = input.value;
        saveState();
        renderMatches();
        renderResults();
      });
      row.appendChild(input);

      teamListEl.appendChild(row);
    });
  }

  var TEAM_COLORS = ["#1e7a4c", "#2b6cb0", "#b3341c", "#a5730c"];
  function teamColor(index) {
    return TEAM_COLORS[index % TEAM_COLORS.length];
  }

  function renderMatches() {
    matchListEl.innerHTML = "";

    if (state.matches.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No matches yet. Add a match to enter scores.";
      matchListEl.appendChild(empty);
    }

    state.matches.forEach(function (match, index) {
      matchListEl.appendChild(buildMatchCard(match, index));
    });

    var atLimit = state.matches.length >= MAX_MATCHES;
    addMatchBtn.disabled = atLimit;
    matchLimitNote.classList.toggle("hidden", !atLimit);
  }

  function buildMatchCard(match, index) {
    var card = document.createElement("div");
    card.className = "match-card";

    var header = document.createElement("div");
    header.className = "match-card-header";

    var title = document.createElement("h3");
    title.textContent = "Match " + (index + 1);
    header.appendChild(title);

    var removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      state.matches = state.matches.filter(function (m) {
        return m.id !== match.id;
      });
      render();
    });
    header.appendChild(removeBtn);

    card.appendChild(header);

    card.appendChild(buildTeamScoreRow(match, "A"));
    card.appendChild(buildTeamScoreRow(match, "B"));

    var diffEl = document.createElement("div");
    diffEl.className = "match-diff";
    var teamA = teamById(match.teamAId);
    var teamB = teamById(match.teamBId);
    var rwA = rw(match.runsA, match.wicketsA);
    var rwB = rw(match.runsB, match.wicketsB);

    if (rwA === null || rwB === null || match.teamAId === match.teamBId) {
      var warnMsg = match.teamAId === match.teamBId
        ? "Select two different teams for this match."
        : "Enter wickets (1-10) for both teams to calculate R/W.";
      diffEl.textContent = warnMsg;
    } else {
      var diff = rwA - rwB;
      diffEl.innerHTML =
        (teamA ? teamA.name : "Team A") + " R/W: <span class=\"value\">" + rwA.toFixed(2) + "</span>" +
        " &nbsp;|&nbsp; " +
        (teamB ? teamB.name : "Team B") + " R/W: <span class=\"value\">" + rwB.toFixed(2) + "</span>" +
        " &nbsp;|&nbsp; Differential: <span class=\"value " + (diff >= 0 ? "positive" : "negative") + "\">" + formatSigned(diff, 2) + "</span>";
    }
    card.appendChild(diffEl);

    return card;
  }

  function buildTeamScoreRow(match, side) {
    var row = document.createElement("div");
    row.className = "team-score-row";

    var teamSelect = document.createElement("select");
    state.teams.forEach(function (team) {
      var opt = document.createElement("option");
      opt.value = team.id;
      opt.textContent = team.name;
      teamSelect.appendChild(opt);
    });
    teamSelect.value = side === "A" ? match.teamAId : match.teamBId;
    teamSelect.addEventListener("change", function () {
      if (side === "A") match.teamAId = teamSelect.value;
      else match.teamBId = teamSelect.value;
      render();
    });

    var runsInput = document.createElement("input");
    runsInput.type = "number";
    runsInput.min = "0";
    runsInput.inputMode = "numeric";
    runsInput.value = side === "A" ? match.runsA : match.runsB;
    runsInput.setAttribute("aria-label", "Runs");
    runsInput.addEventListener("input", function () {
      var val = runsInput.value === "" ? 0 : Number(runsInput.value);
      if (side === "A") match.runsA = val;
      else match.runsB = val;
      saveState();
      renderMatches();
      renderResults();
    });

    var wicketsInput = document.createElement("input");
    wicketsInput.type = "number";
    wicketsInput.min = "1";
    wicketsInput.max = "10";
    wicketsInput.inputMode = "numeric";
    wicketsInput.value = side === "A" ? match.wicketsA : match.wicketsB;
    wicketsInput.setAttribute("aria-label", "Wickets lost");
    wicketsInput.addEventListener("input", function () {
      var raw = wicketsInput.value;
      var val = raw === "" ? "" : Math.max(1, Math.min(10, Number(raw)));
      if (side === "A") match.wicketsA = val === "" ? "" : val;
      else match.wicketsB = val === "" ? "" : val;
      saveState();
      renderMatches();
      renderResults();
    });

    var runsWrap = document.createElement("div");
    var runsLabel = document.createElement("span");
    runsLabel.className = "field-label";
    runsLabel.textContent = "Runs";
    runsWrap.appendChild(runsLabel);
    runsWrap.appendChild(runsInput);

    var wicketsWrap = document.createElement("div");
    var wicketsLabel = document.createElement("span");
    wicketsLabel.className = "field-label";
    wicketsLabel.textContent = "Wkts";
    wicketsWrap.appendChild(wicketsLabel);
    wicketsWrap.appendChild(wicketsInput);

    row.appendChild(teamSelect);
    row.appendChild(runsWrap);
    row.appendChild(wicketsWrap);

    return row;
  }

  function renderResults() {
    var totals = {};
    state.teams.forEach(function (team) {
      totals[team.id] = { team: team, played: 0, total: 0 };
    });

    state.matches.forEach(function (match) {
      if (match.teamAId === match.teamBId) return;
      var rwA = rw(match.runsA, match.wicketsA);
      var rwB = rw(match.runsB, match.wicketsB);
      if (rwA === null || rwB === null) return;
      var diff = rwA - rwB;
      if (totals[match.teamAId]) {
        totals[match.teamAId].played += 1;
        totals[match.teamAId].total += diff;
      }
      if (totals[match.teamBId]) {
        totals[match.teamBId].played += 1;
        totals[match.teamBId].total += -diff;
      }
    });

    var rows = Object.keys(totals).map(function (id) {
      return totals[id];
    });
    rows.sort(function (a, b) {
      return b.total - a.total;
    });

    var table = document.createElement("table");
    table.className = "results-table-el";
    table.innerHTML =
      "<thead><tr><th>Team</th><th class=\"num\">Played</th><th class=\"num\">Total R/W</th><th class=\"num\">Avg R/W</th></tr></thead>";

    var tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var avg = row.played > 0 ? row.total / row.played : null;
      var cls = row.played === 0 ? "" : (row.total >= 0 ? "positive" : "negative");
      tr.innerHTML =
        "<td>" + escapeHtml(row.team.name) + "</td>" +
        "<td class=\"num\">" + row.played + "</td>" +
        "<td class=\"num " + cls + "\">" + (row.played > 0 ? formatSigned(row.total, 2) : "-") + "</td>" +
        "<td class=\"num " + cls + "\">" + (avg !== null ? formatSigned(avg, 2) : "-") + "</td>";
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    resultsEl.innerHTML = "";
    resultsEl.appendChild(table);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  addMatchBtn.addEventListener("click", function () {
    if (state.matches.length >= MAX_MATCHES) return;
    state.matches.push(newMatch());
    render();
  });

  resetBtn.addEventListener("click", function () {
    if (!confirm("Reset all teams and matches? This cannot be undone.")) return;
    state = defaultState();
    render();
  });

  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
