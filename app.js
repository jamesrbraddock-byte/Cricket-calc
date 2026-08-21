(function () {
  "use strict";

  var STORAGE_KEY = "cricket-rw-calc-state-v2";
  var MAX_TEAMS = 4;
  var MAX_MATCHES_PER_TEAM = 4;

  var teamListEl = document.getElementById("team-list");
  var teamMatchesContainer = document.getElementById("team-matches-container");
  var resultsEl = document.getElementById("results-table");
  var resetBtn = document.getElementById("reset-btn");

  var state = loadState();

  function defaultState() {
    var teams = [];
    for (var i = 0; i < MAX_TEAMS; i++) {
      teams.push({ id: "t" + (i + 1), name: "Team " + (i + 1), matches: [] });
    }
    return { teams: teams };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return migrateOldState() || defaultState();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.teams)) return defaultState();
      parsed.teams.forEach(function (team) {
        if (!Array.isArray(team.matches)) team.matches = [];
      });
      return parsed;
    } catch (e) {
      return defaultState();
    }
  }

  function migrateOldState() {
    try {
      var raw = localStorage.getItem("cricket-rw-calc-state-v1");
      if (!raw) return null;
      var old = JSON.parse(raw);
      if (!old || !Array.isArray(old.teams)) return null;
      var teams = old.teams.map(function (t) {
        return { id: t.id, name: t.name, matches: [] };
      });
      (old.matches || []).forEach(function (m) {
        var teamA = teams.filter(function (t) { return t.id === m.teamAId; })[0];
        var teamB = teams.filter(function (t) { return t.id === m.teamBId; })[0];
        if (teamA && teamB && teamA !== teamB) {
          if (teamA.matches.length < MAX_MATCHES_PER_TEAM) {
            teamA.matches.push({
              id: "m" + Date.now() + Math.floor(Math.random() * 1000),
              opponent: teamB.name,
              runs: m.runsA, wickets: m.wicketsA,
              oppRuns: m.runsB, oppWickets: m.wicketsB
            });
          }
          if (teamB.matches.length < MAX_MATCHES_PER_TEAM) {
            teamB.matches.push({
              id: "m" + Date.now() + Math.floor(Math.random() * 1000) + 1,
              opponent: teamA.name,
              runs: m.runsB, wickets: m.wicketsB,
              oppRuns: m.runsA, oppWickets: m.wicketsA
            });
          }
        }
      });
      return { teams: teams };
    } catch (e) {
      return null;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function newMatch() {
    return {
      id: "m" + Date.now() + Math.floor(Math.random() * 1000),
      opponent: "",
      runs: 0,
      wickets: 0,
      oppRuns: 0,
      oppWickets: 0
    };
  }

  function clamp(num, min, max) {
    return Math.min(max, Math.max(min, num));
  }

  function rw(runs, wickets) {
    var r = Number(runs);
    var w = Number(wickets);
    if (isNaN(r) || isNaN(w)) return null;
    var divisor = w <= 0 ? 1 : w;
    return r / divisor;
  }

  function formatSigned(num, decimals) {
    if (num === null || isNaN(num)) return "-";
    var sign = num > 0 ? "+" : "";
    return sign + num.toFixed(decimals);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  var TEAM_COLORS = ["#1e7a4c", "#2b6cb0", "#b3341c", "#a5730c"];
  function teamColor(index) {
    return TEAM_COLORS[index % TEAM_COLORS.length];
  }

  function matchDiff(match) {
    var rwUs = rw(match.runs, match.wickets);
    var rwOpp = rw(match.oppRuns, match.oppWickets);
    if (rwUs === null || rwOpp === null) return null;
    return rwUs - rwOpp;
  }

  function teamTotal(team) {
    var played = 0;
    var total = 0;
    team.matches.forEach(function (match) {
      var diff = matchDiff(match);
      if (diff === null) return;
      played += 1;
      total += diff;
    });
    return { played: played, total: total };
  }

  // ---- Full render (structural changes: add/remove match, reset, first load) ----

  function render() {
    renderTeams();
    renderTeamMatches();
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
        updateTeamHeading(team);
        renderResults();
      });
      row.appendChild(input);

      teamListEl.appendChild(row);
    });
  }

  function updateTeamHeading(team) {
    var heading = teamMatchesContainer.querySelector(
      '.team-match-card[data-team-id="' + team.id + '"] .team-heading'
    );
    if (heading) heading.textContent = team.name;
  }

  function renderTeamMatches() {
    teamMatchesContainer.innerHTML = "";
    state.teams.forEach(function (team, teamIndex) {
      teamMatchesContainer.appendChild(buildTeamMatchCard(team, teamIndex));
    });
  }

  function buildTeamMatchCard(team, teamIndex) {
    var card = document.createElement("section");
    card.className = "card team-match-card";
    card.setAttribute("data-team-id", team.id);

    var header = document.createElement("div");
    header.className = "team-match-header";

    var dot = document.createElement("span");
    dot.className = "team-color";
    dot.style.background = teamColor(teamIndex);
    header.appendChild(dot);

    var heading = document.createElement("h2");
    heading.className = "team-heading";
    heading.textContent = team.name;
    header.appendChild(heading);

    var subtotal = document.createElement("span");
    subtotal.className = "team-subtotal";
    header.appendChild(subtotal);

    card.appendChild(header);

    var list = document.createElement("div");
    list.className = "match-list";
    team.matches.forEach(function (match, index) {
      list.appendChild(buildMatchCard(team, match, index));
    });
    if (team.matches.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No matches logged yet.";
      list.appendChild(empty);
    }
    card.appendChild(list);

    var addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary add-match-btn";
    addBtn.textContent = "+ Add match";
    addBtn.disabled = team.matches.length >= MAX_MATCHES_PER_TEAM;
    addBtn.addEventListener("click", function () {
      if (team.matches.length >= MAX_MATCHES_PER_TEAM) return;
      team.matches.push(newMatch());
      render();
    });
    card.appendChild(addBtn);

    var note = document.createElement("p");
    note.className = "note" + (team.matches.length >= MAX_MATCHES_PER_TEAM ? "" : " hidden");
    note.textContent = "Maximum of 4 matches reached for this team.";
    card.appendChild(note);

    updateTeamSubtotalEl(subtotal, team);

    return card;
  }

  function updateTeamSubtotalEl(el, team) {
    var t = teamTotal(team);
    if (t.played === 0) {
      el.textContent = "No results yet";
    } else {
      el.textContent = t.played + " played, total R/W " + formatSigned(t.total, 2);
    }
  }

  function buildMatchCard(team, match, index) {
    var card = document.createElement("div");
    card.className = "match-card";
    card.setAttribute("data-match-id", match.id);

    var header = document.createElement("div");
    header.className = "match-card-header";

    var title = document.createElement("h3");
    title.textContent = "Match " + (index + 1);
    header.appendChild(title);

    var removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      team.matches = team.matches.filter(function (m) {
        return m.id !== match.id;
      });
      render();
    });
    header.appendChild(removeBtn);
    card.appendChild(header);

    var opponentRow = document.createElement("div");
    opponentRow.className = "opponent-row";
    var oppLabel = document.createElement("span");
    oppLabel.className = "field-label";
    oppLabel.textContent = "Opponent";
    opponentRow.appendChild(oppLabel);
    var opponentInput = document.createElement("input");
    opponentInput.type = "text";
    opponentInput.placeholder = "Opponent name";
    opponentInput.maxLength = 40;
    opponentInput.value = match.opponent || "";
    opponentInput.setAttribute("aria-label", "Opponent name");
    opponentInput.addEventListener("input", function () {
      match.opponent = opponentInput.value;
      saveState();
      refreshMatch(team, match);
    });
    opponentRow.appendChild(opponentInput);
    card.appendChild(opponentRow);

    card.appendChild(buildScorePairRow(team, match, "us", "Us"));
    card.appendChild(buildScorePairRow(team, match, "opp", "Opp"));

    var diffEl = document.createElement("div");
    diffEl.className = "match-diff";
    card.appendChild(diffEl);
    updateDiffEl(diffEl, team, match);

    return card;
  }

  function buildScorePairRow(team, match, side, label) {
    var row = document.createElement("div");
    row.className = "score-pair-row";

    var sideLabel = document.createElement("span");
    sideLabel.className = "side-label";
    sideLabel.textContent = label;
    row.appendChild(sideLabel);

    var runsField = side === "us" ? "runs" : "oppRuns";
    var wicketsField = side === "us" ? "wickets" : "oppWickets";

    var runsWrap = document.createElement("div");
    var runsLabel = document.createElement("span");
    runsLabel.className = "field-label";
    runsLabel.textContent = "Runs";
    runsWrap.appendChild(runsLabel);
    var runsInput = document.createElement("input");
    runsInput.type = "number";
    runsInput.min = "0";
    runsInput.inputMode = "numeric";
    runsInput.value = match[runsField];
    runsInput.setAttribute("aria-label", label + " runs");
    runsInput.addEventListener("input", function () {
      var raw = runsInput.value;
      match[runsField] = raw === "" ? "" : Number(raw);
      saveState();
      refreshMatch(team, match);
    });
    runsInput.addEventListener("blur", function () {
      var val = runsInput.value === "" ? 0 : Math.max(0, Number(runsInput.value));
      match[runsField] = val;
      runsInput.value = val;
      saveState();
      refreshMatch(team, match);
    });
    runsWrap.appendChild(runsInput);
    row.appendChild(runsWrap);

    var wicketsWrap = document.createElement("div");
    var wicketsLabel = document.createElement("span");
    wicketsLabel.className = "field-label";
    wicketsLabel.textContent = "Wkts";
    wicketsWrap.appendChild(wicketsLabel);
    var wicketsInput = document.createElement("input");
    wicketsInput.type = "number";
    wicketsInput.min = "0";
    wicketsInput.max = "10";
    wicketsInput.inputMode = "numeric";
    wicketsInput.value = match[wicketsField];
    wicketsInput.setAttribute("aria-label", label + " wickets lost");
    wicketsInput.addEventListener("input", function () {
      var raw = wicketsInput.value;
      match[wicketsField] = raw === "" ? "" : Number(raw);
      saveState();
      refreshMatch(team, match);
    });
    wicketsInput.addEventListener("blur", function () {
      var val = wicketsInput.value === "" ? 0 : clamp(Number(wicketsInput.value), 0, 10);
      match[wicketsField] = val;
      wicketsInput.value = val;
      saveState();
      refreshMatch(team, match);
    });
    wicketsWrap.appendChild(wicketsInput);
    row.appendChild(wicketsWrap);

    return row;
  }

  // ---- Lightweight refresh (keystroke-level changes: no DOM rebuild of inputs) ----

  function refreshMatch(team, match) {
    var card = teamMatchesContainer.querySelector('.match-card[data-match-id="' + match.id + '"]');
    if (card) {
      var diffEl = card.querySelector(".match-diff");
      if (diffEl) updateDiffEl(diffEl, team, match);
    }
    var subtotalEl = teamMatchesContainer.querySelector(
      '.team-match-card[data-team-id="' + team.id + '"] .team-subtotal'
    );
    if (subtotalEl) updateTeamSubtotalEl(subtotalEl, team);
    renderResults();
  }

  function updateDiffEl(diffEl, team, match) {
    var diff = matchDiff(match);
    var opponentName = match.opponent && match.opponent.trim() ? match.opponent.trim() : "Opponent";
    if (diff === null) {
      diffEl.textContent = "Enter runs and wickets for both sides to calculate R/W.";
      return;
    }
    var rwUs = rw(match.runs, match.wickets);
    var rwOpp = rw(match.oppRuns, match.oppWickets);
    diffEl.innerHTML =
      "Us R/W: <span class=\"value\">" + rwUs.toFixed(2) + "</span>" +
      " &nbsp;|&nbsp; " +
      escapeHtml(opponentName) + " R/W: <span class=\"value\">" + rwOpp.toFixed(2) + "</span>" +
      " &nbsp;|&nbsp; Differential: <span class=\"value " + (diff >= 0 ? "positive" : "negative") + "\">" + formatSigned(diff, 2) + "</span>";
  }

  // ---- Aggregate summary table ----

  function renderResults() {
    var rows = state.teams.map(function (team) {
      var t = teamTotal(team);
      return { team: team, played: t.played, total: t.total };
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
    saveState();
  }

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
