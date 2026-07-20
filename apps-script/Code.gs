const SHEET_NAME = 'Registrations';
const TEAMS_SHEET_NAME = 'Teams';
const SCHEDULE_SHEET_NAME = 'Schedule';
const PLAYOFFS_SHEET_NAME = 'Playoffs';
const PLAYERS_PER_TEAM = 3; // 3v3 tournament — base team size
const MAX_PLAYERS_PER_TEAM = 4; // the forced-teammates team and the substitute's team carry a 4th player

// First match Saturday of the Group Stage. Matches run weekly from here — edit this
// if the actual kickoff date/time changes, then re-run "Generate Match Schedule".
const SCHEDULE_START_DATE = new Date(2026, 6, 25, 8, 30); // July 25, 2026, 8:30 AM (Saturday)

// Groups of IGNs that must always land on the same team when teams are (re)generated.
// Matching is exact after trimming + lowercasing, so these must match the IGNs exactly
// as registered — double-check spelling/spacing against the Registrations sheet.
// Add more entries here for other forced groupings. teamSize defaults to PLAYERS_PER_TEAM
// when omitted; the entry below has all 4 members named explicitly, so no random fill is needed.
const FORCED_TEAMMATES = [
  { members: ['sir Jay', 'BoknoyDaGreat', 'sir frank', 'Dash'], teamSize: 4 },
  { members: ['Ayay!_NkaTug_ko!', 'FishTea'], teamSize: 3 },
];

// Registrants added as a 4th member to a normal (non-forced) random team, to balance
// roster sizes against the forced-teammates team above. Each substitute lands on a
// different normal team (never on a forced-teammates team).
const SUBSTITUTE_IGNS = ['janajevb', 'Gab²'];

// Fixed playoff match slots. Which teams actually play each slot is decided by Group
// Stage standings (computed on the frontend), so this sheet only tracks per-game
// scores by slot ID — not team names. Semifinals are single matches; the Final is a
// Best of 3, so it gets up to 3 game-score columns.
const PLAYOFF_MATCHES = [
  { id: 'SF1', name: 'Semifinal 1', bestOf: 1 },
  { id: 'SF2', name: 'Semifinal 2', bestOf: 1 },
  { id: 'F', name: 'Final', bestOf: 3 },
];

// 1. Run this ONCE from the editor to create the sheet + headers.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, 4).setValues([['Timestamp', 'Name', 'IGN', 'Department']]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
}

// 2. Custom Admin Menu for Google Sheets
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎮 Esports Admin')
    .addItem('Generate Random Teams', 'generateTeams')
    .addItem('Generate Match Schedule', 'generateSchedule')
    .addItem('Setup Playoffs Sheet', 'setupPlayoffs')
    .addToUi();
}

// Creates (or resets) the 'Playoffs' sheet with one row per fixed slot (SF1, SF2, F).
// Run this once the bracket is ready to be scored, then fill in Score A / Score B for
// each game as it's played — Game 2/3 only apply to the Final's Best of 3.
function setupPlayoffs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PLAYOFFS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PLAYOFFS_SHEET_NAME);
  } else {
    sheet.clear();
  }

  const headers = [
    'Match ID', 'Match Name', 'Best Of',
    'Game 1 Score A', 'Game 1 Score B',
    'Game 2 Score A', 'Game 2 Score B',
    'Game 3 Score A', 'Game 3 Score B',
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  PLAYOFF_MATCHES.forEach(({ id, name, bestOf }) => {
    sheet.appendRow([id, name, bestOf, '', '', '', '', '', '']);
  });

  sheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert(
    `Playoffs sheet ready. Fill in Score A / Score B for each game as it's played — ` +
    `the site figures out the series winner and advances them automatically. Semifinal ` +
    `rows only need Game 1; the Final uses however many of its 3 games are needed to decide it.`
  );
}

// 3. Logic to randomly assign teams into Group A / Group B
function generateTeams() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const regSheet = ss.getSheetByName(SHEET_NAME);
  if (!regSheet) return;

  const data = regSheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('No registrations found.');
    return;
  }

  // Extract IGNs (Column C / Index 2), trim, and filter out empties
  let players = data.slice(1).map(row => row[2].toString().trim()).filter(String);

  // Fisher-Yates Shuffle — randomizes everyone except the forced pairs below
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  // Pull forced teammates out of the shuffled pool first, so they always land on
  // the same team regardless of the random draw. A group only "locks" if 2+ of its
  // members actually registered this time — a solo entrant just rejoins the pool.
  const remaining = [...players];

  // Pull the designated substitutes out of the pool too — they're added as a 4th
  // member to normal random teams below, never to the forced-teammates team.
  const substitutes = [];
  SUBSTITUTE_IGNS.forEach(ign => {
    const idx = remaining.findIndex(p => p.toLowerCase() === ign.trim().toLowerCase());
    if (idx !== -1) {
      substitutes.push(remaining[idx]);
      remaining.splice(idx, 1);
    }
  });

  const lockedGroups = [];

  FORCED_TEAMMATES.forEach(({ members, teamSize }) => {
    const matched = [];
    members.forEach(ign => {
      const idx = remaining.findIndex(p => p.toLowerCase() === ign.trim().toLowerCase());
      if (idx !== -1) {
        matched.push(remaining[idx]);
        remaining.splice(idx, 1);
      }
    });
    if (matched.length > 1) lockedGroups.push({ members: matched, teamSize: teamSize || PLAYERS_PER_TEAM });
  });

  // Seed one team per locked group, filling any remaining slots from the shuffled pool.
  const teams = [];
  lockedGroups.forEach(({ members, teamSize }) => {
    const team = [...members];
    while (team.length < teamSize && remaining.length) {
      team.push(remaining.shift());
    }
    teams.push(team);
  });

  // Everyone else forms teams normally, in chunks of PLAYERS_PER_TEAM.
  for (let i = 0; i < remaining.length; i += PLAYERS_PER_TEAM) {
    teams.push(remaining.slice(i, i + PLAYERS_PER_TEAM));
  }

  // Add each substitute as a 4th member of its own normal (non-forced) team, to
  // balance rosters against the forced-teammates teams' extra players.
  const normalTeamsStart = lockedGroups.length;
  substitutes.forEach((substitute, i) => {
    const targetIndex = normalTeamsStart + i;
    if (teams.length > targetIndex) {
      teams[targetIndex].push(substitute);
    } else {
      teams.push([substitute]);
    }
  });

  // Pad any short team (including a locked group that ran out of free players) with blanks.
  teams.forEach(team => {
    while (team.length < PLAYERS_PER_TEAM) team.push('');
  });

  // Shuffle team order (not composition) so a locked-group team isn't always "Team 1".
  for (let i = teams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teams[i], teams[j]] = [teams[j], teams[i]];
  }

  // Split evenly into Group A / Group B — first half A, second half B.
  const groupSplitIndex = Math.ceil(teams.length / 2);

  let teamsSheet = ss.getSheetByName(TEAMS_SHEET_NAME);
  if (!teamsSheet) {
    teamsSheet = ss.insertSheet(TEAMS_SHEET_NAME);
  } else {
    teamsSheet.clear(); // Clears previous generation
  }

  // Set up Headers — sized for the largest possible team (4), so the forced-teammates
  // team and the substitute's team don't get truncated. Shorter teams leave trailing blanks.
  const headers = ['Team ID', 'Team Name', 'Group', ...Array.from({length: MAX_PLAYERS_PER_TEAM}, (_, i) => `Player ${i+1}`)];
  teamsSheet.appendRow(headers);
  teamsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // Default Team Name is TBD. You can manually type over this in Google Sheets later!
  teams.forEach((team, i) => {
    const group = i < groupSplitIndex ? 'A' : 'B';
    const paddedTeam = [...team];
    while (paddedTeam.length < MAX_PLAYERS_PER_TEAM) paddedTeam.push('');
    teamsSheet.appendRow([`Team ${i + 1}`, 'TBD', group, ...paddedTeam]);
  });

  SpreadsheetApp.getUi().alert(
    `Success! Generated ${teams.length} teams in the 'Teams' sheet.\n\n` +
    `Next: run "Generate Match Schedule" to build the Saturday-by-Saturday fixture list.`
  );
}

// 4. Builds the full Saturday-by-Saturday Group Stage schedule from the Teams sheet.
// One match per group per week (Group A and Group B each play once every Saturday),
// so this seeds the 'Schedule' sheet — fill in Score A / Score B there after each match.
function generateSchedule() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName(TEAMS_SHEET_NAME);
  if (!teamsSheet) {
    SpreadsheetApp.getUi().alert('Generate teams first.');
    return;
  }

  const data = teamsSheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('No teams found. Generate teams first.');
    return;
  }

  // Pair matches by Team ID, not Team Name — every team starts out named the same
  // literal "TBD" until an admin renames it, so matching by name would collide
  // multiple teams together. The ID (e.g. "Team 3") is always unique.
  const groupAIds = [];
  const groupBIds = [];
  for (let i = 1; i < data.length; i++) {
    const teamId = data[i][0].toString();
    const group = data[i][2];
    if (group === 'A') groupAIds.push(teamId);
    else if (group === 'B') groupBIds.push(teamId);
  }

  const matchesA = buildRoundRobinFlat(groupAIds);
  const matchesB = buildRoundRobinFlat(groupBIds);
  const totalWeeks = Math.max(matchesA.length, matchesB.length);

  if (totalWeeks === 0) {
    SpreadsheetApp.getUi().alert('Not enough teams in a group to schedule any matches yet.');
    return;
  }

  let scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET_NAME);
  if (!scheduleSheet) {
    scheduleSheet = ss.insertSheet(SCHEDULE_SHEET_NAME);
  } else {
    scheduleSheet.clear();
  }

  // Team A / Team B hold the Team ID (e.g. "Team 3") — matches the Teams sheet's
  // Team ID column. Current team names are resolved for display at read-time.
  const headers = ['Week', 'Date', 'Match ID', 'Group', 'Team A', 'Team B', 'Score A', 'Score B'];
  scheduleSheet.appendRow(headers);
  scheduleSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  const tz = Session.getScriptTimeZone();
  for (let week = 0; week < totalWeeks; week++) {
    const matchDate = new Date(SCHEDULE_START_DATE);
    matchDate.setDate(matchDate.getDate() + week * 7);
    const dateStr = Utilities.formatDate(matchDate, tz, 'yyyy-MM-dd HH:mm');

    if (matchesA[week]) {
      scheduleSheet.appendRow([week + 1, dateStr, `A-${week + 1}`, 'A', matchesA[week][0], matchesA[week][1], '', '']);
    }
    if (matchesB[week]) {
      scheduleSheet.appendRow([week + 1, dateStr, `B-${week + 1}`, 'B', matchesB[week][0], matchesB[week][1], '', '']);
    }
  }

  scheduleSheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert(
    `Schedule created: ${totalWeeks} week(s), starting ${Utilities.formatDate(SCHEDULE_START_DATE, tz, 'MMMM d, yyyy')}.\n\n` +
    `Fill in Score A / Score B in the 'Schedule' sheet after each match — standings and the ` +
    `playoff bracket on the site update from those scores automatically.`
  );
}

// Flat (non-simultaneous) round-robin match list for one group, in play order.
// Byes are dropped entirely — there's no match to schedule against a Bye.
function buildRoundRobinFlat(teamNames) {
  const roster = [...teamNames];
  if (roster.length < 2) return [];
  if (roster.length % 2 !== 0) roster.push('Bye');

  const matches = [];
  const rotation = [...roster];

  for (let round = 0; round < roster.length - 1; round++) {
    for (let i = 0; i < rotation.length / 2; i++) {
      const home = rotation[i];
      const away = rotation[rotation.length - 1 - i];
      if (home !== 'Bye' && away !== 'Bye') {
        matches.push([home, away]);
      }
    }
    const last = rotation.pop();
    rotation.splice(1, 0, last);
  }

  return matches;
}

// 5. Endpoint for your frontend to fetch teams + the match schedule/scores
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName(TEAMS_SHEET_NAME);

  if (!teamsSheet) {
    return json({ result: 'error', message: 'Teams not generated yet. Waiting for Admin.' });
  }

  const teamsData = teamsSheet.getDataRange().getValues();
  const teams = [];
  const nameById = {};
  for (let i = 1; i < teamsData.length; i++) {
    const teamId = teamsData[i][0].toString();
    const teamName = teamsData[i][1]; // The frontend will display this
    nameById[teamId] = teamName;
    teams.push({
      id: teamId,
      name: teamName,
      group: teamsData[i][2],
      players: teamsData[i].slice(3).filter(String)
    });
  }

  const schedule = [];
  const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET_NAME);
  if (scheduleSheet) {
    const scheduleData = scheduleSheet.getDataRange().getValues();
    for (let i = 1; i < scheduleData.length; i++) {
      const row = scheduleData[i];
      const date = row[1] instanceof Date
        ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
        : row[1];
      const teamAId = row[4].toString();
      const teamBId = row[5].toString();
      schedule.push({
        week: row[0],
        date: date,
        id: row[2],
        group: row[3],
        teamAId: teamAId,
        teamBId: teamBId,
        // Resolved from the Teams sheet at read-time, so a later rename shows up
        // immediately without needing to regenerate the schedule.
        teamA: nameById[teamAId] || teamAId,
        teamB: nameById[teamBId] || teamBId,
        scoreA: row[6] === '' ? null : Number(row[6]),
        scoreB: row[7] === '' ? null : Number(row[7]),
      });
    }
  }

  const playoffs = {};
  const playoffsSheet = ss.getSheetByName(PLAYOFFS_SHEET_NAME);
  if (playoffsSheet) {
    const playoffsData = playoffsSheet.getDataRange().getValues();
    for (let i = 1; i < playoffsData.length; i++) {
      const row = playoffsData[i];
      const matchId = row[0].toString();
      const games = [];
      // Columns 3-4, 5-6, 7-8 (0-indexed) are Game 1/2/3's Score A/Score B. A game only
      // counts once both of its scores are filled in — a half-entered game is ignored.
      for (let g = 0; g < 3; g++) {
        const scoreA = row[3 + g * 2];
        const scoreB = row[4 + g * 2];
        if (scoreA !== '' && scoreB !== '') {
          games.push({ a: Number(scoreA), b: Number(scoreB) });
        }
      }
      playoffs[matchId] = { name: row[1], bestOf: Number(row[2]), games };
    }
  }

  return json({ result: 'success', teams, schedule, playoffs });
}

// 6. Registration POST endpoint
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const data = JSON.parse(e.postData.contents);
    if (data.website) return json({ result: 'success' }); // Honeypot

    const name = (data.name || '').toString().trim();
    const ign  = (data.ign  || '').toString().trim();
    const department = (data.department || '').toString().trim();

    if (!name || !ign || !department) {
      return json({ result: 'error', message: 'Name, IGN, and Department are required.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();

    // Duplicate check — case-insensitive match against Name (column B).
    // Runs inside the lock so two near-simultaneous submissions can't both slip through.
    if (lastRow > 1) {
      const existingNames = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
      const isDuplicate = existingNames.some(
        (existing) => existing.toString().trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        return json({ result: 'error', message: 'This name is already registered.' });
      }
    }

    sheet.appendRow([new Date(), name, ign, department]);
    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: err.message });
  } finally {
    lock.releaseLock();
  }
}

// 7. JSON Helper
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
