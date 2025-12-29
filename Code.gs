/***************
 * Intent Validator for Google Sheets (Batch Optimized) ⚡
 * - Reads entire sheet data once per sheet 🚀
 * - Minimizes SpreadsheetApp calls 📉
 ***************/

const CONFIG = {
  REPORT_SHEET_NAME: "QA – Intent Validation Report",
  SKIP_SHEETS: ["Trigger Matrix", "Trigger Overlaps", "Action Intent Audit", "QA – Intent Validation Report"],
  LEGACY_MARKER: "(Legacy)",
  INTENT_RULES_FILE_ID: "10aXUKl0qKGY6a5aGRyPzpG965_vB8pqw",
  OVERRIDE_HEADER: "Action Intent Override",
  ACTION_HEADER: "Action Type/Intent",
  TRIGGER_HEADER: "Automation Trigger Phrase",
  RECOMMENDED_HEADER: "Recommended Disambiguated Phrase"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Validation ⚡")
    .addItem("Run Full Intent Audit 🧪", "runIntentAudit")
    .addItem("Validate Active Sheet Only 📄", "runIntentAuditActiveSheet")
    .addSeparator()
    .addItem("Generate Dashboard 📊", "createSummaryDashboard")
    .addItem("Setup / Re-Authorize 🔐", "setupIntentValidator")
    .addToUi();
}

function setupIntentValidator() {
  loadIntentRules_(); // Triggers Drive scope
  SpreadsheetApp.getActiveSpreadsheet().getSheets(); // Triggers Sheets scope
}

function loadIntentRules_() {
  const file = DriveApp.getFileById(CONFIG.INTENT_RULES_FILE_ID);
  return JSON.parse(file.getBlob().getDataAsString());
}

// ⚡ OPTIMIZED: Checks criteria against in-memory values, no API calls
function isIntegrationSheet_(sheetName, firstRowValues) {
  if (CONFIG.SKIP_SHEETS.indexOf(sheetName) !== -1) return false;
  if (sheetName.indexOf(CONFIG.LEGACY_MARKER) !== -1) return false;
  if (!firstRowValues || firstRowValues.length < 2) return false;

  const colA = String(firstRowValues[0] || "").trim();
  const colB = String(firstRowValues[1] || "");
  return (colA === "Connected App/Integration" && colB.indexOf("Automation Trigger Phrase") !== -1);
}

// ⚡ OPTIMIZED: Builds map from in-memory header row
function headerMap_(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    if (h && String(h).trim()) map[String(h).trim()] = i; // 0-based index
  });
  return map;
}

function classifyAction_(trigger, recommended, rulesJson) {
  const t = ((trigger || "") + " " + (recommended || "")).toLowerCase();
  const order = rulesJson.actions_order || [];
  const rules = rulesJson.rules || {};

  for (let i = 0; i < order.length; i++) {
    const action = order[i];
    const phrases = rules[action] || [];
    for (let j = 0; j < phrases.length; j++) {
      if (t.indexOf(phrases[j]) !== -1) return action;
    }
  }
  return "Search/Query";
}

function ensureReportSheet_(ss) {
  let rep = ss.getSheetByName(CONFIG.REPORT_SHEET_NAME);
  if (rep) ss.deleteSheet(rep);
  rep = ss.insertSheet(CONFIG.REPORT_SHEET_NAME, 0);

  const headers = [
    "Timestamp", "Sheet Name", "Row Number", "Trigger Phrase",
    "Recommended Phrase", "Current Action", "Predicted Action",
    "Match Status", "Recommendation"
  ];
  rep.getRange(1, 1, 1, headers.length).setValues([headers]);
  rep.setFrozenRows(1);
  return rep;
}

function runIntentAudit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rulesJson = loadIntentRules_();
  const timestamp = new Date().toISOString();
  const out = [];

  const sheets = ss.getSheets();

  // ⚡ BATCH PROCESSING: Loop sheets, read ONCE, process in memory
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    
    // Quick check on name before reading data
    if (CONFIG.SKIP_SHEETS.includes(sheetName)) return;

    // ⚡ READ ONCE: Get entire data range
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return; // No data or just header

    // Check integration criteria using row 0
    if (!isIntegrationSheet_(sheetName, values[0])) return;

    const hm = headerMap_(values[0]);
    // Get 0-based indices
    const idxTrig = hm[CONFIG.TRIGGER_HEADER];
    const idxRec  = hm[CONFIG.RECOMMENDED_HEADER];
    const idxAct  = hm[CONFIG.ACTION_HEADER];
    const idxOverride = hm[CONFIG.OVERRIDE_HEADER];

    // Check if essential columns exist
    if (idxTrig === undefined || idxAct === undefined) return;

    // Loop rows starting from index 1 (Row 2)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const trig = row[idxTrig];
      if (!trig) continue;

      const rec = (idxRec !== undefined) ? (row[idxRec] || "") : "";
      let current = String(row[idxAct] || "").trim();

      if (idxOverride !== undefined) {
        const overrideVal = String(row[idxOverride] || "").trim();
        if (overrideVal) current = overrideVal;
      }

      const predicted = classifyAction_(String(trig), String(rec), rulesJson);
      
      if (current !== predicted) {
        out.push([
          timestamp,
          sheetName,
          i + 1, // Row number (1-based)
          trig,
          rec,
          current,
          predicted,
          "MISMATCH ⚠️",
          "Update Action Type/Intent to Predicted Action, refine trigger wording, or set an override."
        ]);
      }
    }
  });

  const rep = ensureReportSheet_(ss);
  if (out.length === 0) {
    out.push([timestamp, "INFO", "", "", "", "", "", "ALL MATCH ✅", "No mismatches detected."]);
  }

  // ⚡ WRITE ONCE: Dump all results
  rep.getRange(2, 1, out.length, 9).setValues(out);

  // 📊 AUTOMATIC DASHBOARD REFRESH
  createSummaryDashboard();
}

/**
 * Generates a visual summary dashboard of audit results 📊
 */
function createSummaryDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportSheet = ss.getSheetByName(CONFIG.REPORT_SHEET_NAME);
  if (!reportSheet) {
    SpreadsheetApp.getUi().alert("No report found. Run an audit first! 🧪");
    return;
  }

  let dash = ss.getSheetByName("QA – Dashboard 📊");
  if (dash) ss.deleteSheet(dash);
  dash = ss.insertSheet("QA – Dashboard 📊", 0);

  const data = reportSheet.getDataRange().getValues();
  if (data.length < 2) return;

  // Process data for dashboard
  const sheetStats = {};
  let totalMismatches = 0;

  for (let i = 1; i < data.length; i++) {
    const sheetName = data[i][1];
    const status = data[i][7];
    if (sheetName === "INFO" || !sheetName) continue;

    if (!sheetStats[sheetName]) sheetStats[sheetName] = 0;
    if (status.includes("MISMATCH")) {
      sheetStats[sheetName]++;
      totalMismatches++;
    }
  }

  // Header Styling
  dash.getRange("A1:B1").setValues([["QA – INTENT AUDIT SUMMARY", "Generated: " + new Date().toLocaleString()]])
      .setFontWeight("bold").setBackground("#434343").setFontColor("white");
  
  dash.getRange("A3:B3").setValues([["Total Critical Mismatches ⚠️", totalMismatches]])
      .setFontWeight("bold").setFontSize(14).setBackground("#f4cccc");

  // Breakdown Table
  const breakdown = [["Integration Sheet", "Mismatch Count ❌"]];
  Object.keys(sheetStats).forEach(key => breakdown.push([key, sheetStats[key]]));
  
  if (breakdown.length > 1) {
    dash.getRange(5, 1, breakdown.length, 2).setValues(breakdown);
    dash.getRange(5, 1, 1, 2).setFontWeight("bold").setBackground("#efefef");
    
    // Add a simple bar chart
    const chart = dash.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(dash.getRange(5, 1, breakdown.length, 2))
      .setPosition(5, 4, 0, 0)
      .setOption('title', 'Mismatches by Integration')
      .setOption('colors', ['#e06666'])
      .build();
    dash.insertChart(chart);
  } else {
    dash.getRange("A5").setValue("✨ PERFECT MATCH! No mismatches found across all integrations. ✨")
        .setFontWeight("bold").setFontColor("#38761d");
  }

  dash.autoResizeColumns(1, 2);
  dash.activate();
}

/**
 * 🛠️ HELPER: Run this ONCE to create your Rules File!
 * It creates 'intent_rules.json' in your Drive and logs the ID.
 */
function setupRulesFile() {
  const defaultRules = {
    "actions_order": ["Create Record", "Update Record", "Search/Query"],
    "rules": {
      "Create Record": ["new", "add", "create", "insert"],
      "Update Record": ["change", "update", "modify", "edit"],
      "Search/Query": ["find", "search", "get", "lookup"]
    }
  };
  
  const fileName = "intent_rules.json";
  const content = JSON.stringify(defaultRules, null, 2);
  
  const file = DriveApp.createFile(fileName, content, MimeType.PLAIN_TEXT);
  
  console.log("✅ SUCCESS! Created file: " + fileName);
  console.log("🆔 FILE ID: " + file.getId());
  console.log("⚠️ ACTION: Copy this ID and paste it into CONFIG.INTENT_RULES_FILE_ID in Code.gs");
}
