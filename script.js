
const SHEET_ID = "1tiTt11IvkuOyBklV70P7-RPZYTAUYiBjXtekvOpvwSI";

const CSV_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=counter`;

let colleges = [];

async function loadLeaderboard() {
  const status = document.getElementById("status");

  try {
    status.textContent = "Loading college data...";

    const response = await fetch(CSV_URL);

    if (!response.ok) {
      throw new Error("Unable to access the Google Sheet.");
    }

    const csv = await response.text();
    const rows = parseCSV(csv);

    // Skip headers if present
    const start = rows.length &&
      (/college/i.test(rows[0][0]) ||
       /count/i.test(rows[0][1])) ? 1 : 0;

    colleges = rows.slice(start)
      .filter(row =>
        row[0]?.trim() &&
        row[1]?.trim() !== "" &&
        Number.isFinite(Number(row[1]))
      )
      .map(row => ({
        college: row[0].trim(),
        count: Number(row[1])
      }))
      .sort((a, b) =>
        b.count - a.count ||
        a.college.localeCompare(b.college)
      )
      .map((item, index, list) => ({
        ...item,
        rank: list.findIndex(x => x.count === item.count) + 1
      }));

    renderSearch();
    renderLeaderboard();

    document.getElementById("total").textContent =
      `${colleges.length} COLLEGES`;

    status.textContent = "Leaderboard updated successfully.";

  } catch (error) {
    status.textContent = error.message;
  }
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (
      (char === "\n" || char === "\r") && !quoted
    ) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);

      if (row.some(value => value.trim())) rows.push(row);

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);

  return rows;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderSearch() {
  const query = document
    .getElementById("query")
    .value.trim().toLowerCase();

  const results = colleges.filter(item =>
    item.college.toLowerCase().includes(query)
  );

  document.getElementById("searchRows").innerHTML =
    results.length
      ? results.map(item => `
          <tr>
            <td class="name">${escapeHTML(item.college)}</td>
            <td>${item.count.toLocaleString("en-IN")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="2" class="empty">
           No matching colleges found.
         </td></tr>`;

  document.getElementById("match").textContent =
    `${results.length} college(s) found`;
}

function renderLeaderboard() {
  document.getElementById("leaderRows").innerHTML =
    colleges.length
      ? colleges.map(item => `
          <tr>
            <td><span class="rank ${
              item.rank <= 3 ? "r" + item.rank : ""
            }">${item.rank}</span></td>
            <td class="name">${escapeHTML(item.college)}</td>
            <td>${item.count.toLocaleString("en-IN")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="3" class="empty">
           No data available.
         </td></tr>`;
}

function show(view) {
  const search = view === "search";

  document.getElementById("searchView")
    .classList.toggle("hidden", !search);

  document.getElementById("leaderView")
    .classList.toggle("hidden", search);

  document.getElementById("searchTab")
    .classList.toggle("active", search);

  document.getElementById("leaderTab")
    .classList.toggle("active", !search);
}

loadLeaderboard();
