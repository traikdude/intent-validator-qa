/***************
 * Intent Validator for Google Sheets (Regex + Sidebar Edition) ⚡🧠
 * - Batch Processing 🚀
 * - Regex Pattern Matching 🔍
 * - Real-time Sidebar UI 🖥️
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
    .addItem("Show Validation Sidebar 🖥️", "showSidebar")
    .addSeparator()
    .addItem("Generate Dashboard 📊", "createSummaryDashboard")
    .addItem("Setup / Re-Authorize 🔐", "setupIntentValidator")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Intent Validator ⚡')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Called by Sidebar.html to validate the currently selected row
 */
function validateActiveRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const rowIdx = sheet.getActiveRange().getRow();
  
  // Basic validation checks
  const sheetName = sheet.getName();
  const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (!isIntegrationSheet_(sheetName, firstRow)) {
    return { valid: false, message: "Not an Integration Sheet 🚫" };
  }
  
  if (rowIdx < 2) {
    return { valid: false, message: "Header Row Selected 📑" };
  }

  const hm = headerMap_(firstRow);
  const idxTrig = hm[CONFIG.TRIGGER_HEADER];
  const idxRec  = hm[CONFIG.RECOMMENDED_HEADER];
  const idxAct  = hm[CONFIG.ACTION_HEADER];
  const idxOverride = hm[CONFIG.OVERRIDE_HEADER]; // 0-based indices

  if (idxTrig === undefined || idxAct === undefined) {
    return { valid: false, message: "Missing Required Columns ❌" };
  }

  // Fetch row data
  const rowData = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];
  const trig = String(rowData[idxTrig] || "");
  const rec = (idxRec !== undefined) ? String(rowData[idxRec] || "") : "";
  let current = String(rowData[idxAct] || "").trim();
  
  if (idxOverride !== undefined) {
    const override = String(rowData[idxOverride] || "").trim();
    if (override) current = override;
  }

  if (!trig) {
    return { valid: false, message: "No Trigger Phrase 📭" };
  }

  const rulesJson = loadIntentRules_();
  const predicted = classifyAction_(trig, rec, rulesJson);

  return {
    valid: true,
    match: (current === predicted),
    trigger: trig,
    current: current,
    predicted: predicted
  };
}

function setupIntentValidator() {
  loadIntentRules_();
  SpreadsheetApp.getActiveSpreadsheet().getSheets();
}

function loadIntentRules_() {
  const file = DriveApp.getFileById(CONFIG.INTENT_RULES_FILE_ID);
  return JSON.parse(file.getBlob().getDataAsString());
}

function isIntegrationSheet_(sheetName, firstRowValues) {
  if (CONFIG.SKIP_SHEETS.indexOf(sheetName) !== -1) return false;
  if (sheetName.indexOf(CONFIG.LEGACY_MARKER) !== -1) return false;
  if (!firstRowValues || firstRowValues.length < 2) return false;

  const colA = String(firstRowValues[0] || "").trim();
  const colB = String(firstRowValues[1] || "");
  return (colA === "Connected App/Integration" && colB.indexOf("Automation Trigger Phrase") !== -1);
}

function headerMap_(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    if (h && String(h).trim()) map[String(h).trim()] = i;
  });
  return map;
}

/**
 * ⚡ REGEX ENABLED CLASSIFIER 🧠
 * Now treats rule phrases as Regular Expressions!
 */
function classifyAction_(trigger, recommended, rulesJson) {
  const t = ((trigger || "") + " " + (recommended || "")).trim();
  const order = rulesJson.actions_order || [];
  const rules = rulesJson.rules || {};

  for (let i = 0; i < order.length; i++) {
    const action = order[i];
    const patterns = rules[action] || [];
    
    for (let j = 0; j < patterns.length; j++) {
      try {
        // Create regex from pattern, case-insensitive
        const regex = new RegExp(patterns[j], 'i');
        if (regex.test(t)) return action;
      } catch (e) {
        console.warn(`Invalid Regex Pattern: ${patterns[j]}`, e);
      }
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

  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (CONFIG.SKIP_SHEETS.includes(sheetName)) return;

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return;

    if (!isIntegrationSheet_(sheetName, values[0])) return;

    const hm = headerMap_(values[0]);
    const idxTrig = hm[CONFIG.TRIGGER_HEADER];
    const idxRec  = hm[CONFIG.RECOMMENDED_HEADER];
    const idxAct  = hm[CONFIG.ACTION_HEADER];
    const idxOverride = hm[CONFIG.OVERRIDE_HEADER];

    if (idxTrig === undefined || idxAct === undefined) return;

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
          i + 1,
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
  rep.getRange(2, 1, out.length, 9).setValues(out);
  createSummaryDashboard();
}

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

  dash.getRange("A1:B1").setValues([["QA – INTENT AUDIT SUMMARY", "Generated: " + new Date().toLocaleString()]])
      .setFontWeight("bold").setBackground("#434343").setFontColor("white");
  
  dash.getRange("A3:B3").setValues([["Total Critical Mismatches ⚠️", totalMismatches]])
      .setFontWeight("bold").setFontSize(14).setBackground("#f4cccc");

  const breakdown = [["Integration Sheet", "Mismatch Count ❌"]];
  Object.keys(sheetStats).forEach(key => breakdown.push([key, sheetStats[key]]));
  
  if (breakdown.length > 1) {
    dash.getRange(5, 1, breakdown.length, 2).setValues(breakdown);
    dash.getRange(5, 1, 1, 2).setFontWeight("bold").setBackground("#efefef");
    
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
      "Create Record": ["new", "add", "create", "insert", "^post\\s"], // Added regex example
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