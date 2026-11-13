// feedback.js
// Shows each stall's average rating and latest comments, read from the
// Google Sheet that your feedback form fills in.
// This file is separate from script.js, so your search code is not touched.

// 1) Paste your published CSV link between the quotes (it ends with output=csv)
const FEEDBACK_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCaHqfd46sgvcxB9SBv18uZngdSRii7SSkad8zLIP2MrYvbEDxN9DvbKGdI_Wg1IN_yIWxnIwstvx-/pub?gid=334660777&single=true&output=csv";

// 2) How many recent comments to show per stall
const MAX_COMMENTS = 3;

// Reads CSV text into rows. Handles commas and new lines inside quoted comments.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Fills one stall's feedback box.
// textContent is used (never innerHTML), so a comment can never inject code.
function renderFeedback(box, entries) {
  box.textContent = "";

  const ratings = entries
    .map((e) => e.rating)
    .filter((n) => n >= 1 && n <= 5);

  const summary = document.createElement("p");
  summary.className = "feedback-summary";

  if (ratings.length === 0) {
    summary.textContent = "No ratings yet";
    box.appendChild(summary);
    return;
  }

  const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const label = ratings.length === 1 ? "rating" : "ratings";
  summary.textContent = "⭐ " + average.toFixed(1) + " / 5 (" + ratings.length + " " + label + ")";
  box.appendChild(summary);


}

async function loadFeedback() {
  const boxes = document.querySelectorAll(".feedback");
  if (boxes.length === 0) return;
  if (FEEDBACK_CSV_URL.startsWith("PASTE")) return; // link not added yet

  try {
    const response = await fetch(FEEDBACK_CSV_URL);
    if (!response.ok) throw new Error("Could not load the sheet");

    const rows = parseCSV(await response.text());
    const headers = rows[0].map((h) => h.toLowerCase());

    // Find columns by their question text, so column order does not matter
    const stallCol = headers.findIndex((h) => h.includes("stall name"));
    const ratingCol = headers.findIndex((h) => h.includes("rate"));
    const commentCol = headers.findIndex((h) => h.includes("feedback"));

    if (stallCol === -1 || ratingCol === -1) {
      throw new Error("Sheet columns not recognised");
    }

    // Group the rows by stall name
    const byStall = {};
    rows.slice(1).forEach((r) => {
      const name = (r[stallCol] || "").trim().toLowerCase();
      if (name === "") return;
      if (!byStall[name]) byStall[name] = [];
      byStall[name].push({
        rating: Number(r[ratingCol]),
        comment: commentCol === -1 ? "" : (r[commentCol] || "").trim(),
      });
    });

    boxes.forEach((box) => {
      const key = (box.dataset.stall || "").trim().toLowerCase();
      renderFeedback(box, byStall[key] || []);
    });
  } catch (error) {
    console.error("Feedback error:", error);
    // If anything fails, the page still works; the boxes just stay empty
  }
}

loadFeedback();