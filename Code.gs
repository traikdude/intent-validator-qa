/**
 * Intent Validator for Google Sheets - Expert Edition ⚡🧠
 * Features: Batch Audit, Regex Classifier, Sidebar UI, Auto-Fix Engine
 * Author: GAS Master 🧙🏾‍♂️
 * Version: 2.1.0
 */

const CONFIG = {
  REPORT_SHEET_NAME: "QA – Intent Validation Report",
  SKIP_SHEETS: ["Trigger Matrix", "Trigger Overlaps", "Action Intent Audit", "QA – Intent Validation Report", "QA – Dashboard 📊"],
  LEGACY_MARKER: "(Legacy)",
  INTENT_RULES_FILE_ID: "10aXUKl0qKGY6a5aGRyPzpG965_vB8pqw",
  OVERRIDE_HEADER: "Action Intent Override",
  ACTION_HEADER: "Action Type/Intent",
  TRIGGER_HEADER: "Automation Trigger Phrase",
  RECOMMENDED_HEADER: "Recommended Disambiguated Phrase"
};

/**
 * Creates the custom menu on Spreadsheet Open 📂
 */
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

/**
 * Displays the Joyful Sidebar UI 🖥️✨
 */
function showSidebar() {
  const html = HtmlService.createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('Intent Validator ⚡')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Called by Sidebar.html to validate the currently selected row 🔍
 * @returns {Object} Validation results including current and predicted intent
 */
function validateActiveRow() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const rowIdx = sheet.getActiveRange().getRow();
    
    const sheetName = sheet.getName();
    const firstRowRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    const firstRow = firstRowRange.getValues()[0];
    
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
    const idxOverride = hm[CONFIG.OVERRIDE_HEADER];

    if (idxTrig === undefined || idxAct === undefined) {
      return { valid: false, message: "Missing Required Columns ❌" };
    }

    const rowData = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];
    const trig = String(rowData[idxTrig] || "");
    const rec = (idxRec !== undefined) ? String(rowData[idxRec] || "") : "";
    let current = String(rowData[idxAct] || "").trim();
    
    if (idxOverride !== undefined) {
      const override = String(rowData[idxOverride] || "").trim();
      if (override) current = override;
    }

    if (!trig) {
      return { valid: false, message: "No Trigger Phrase Found 📭" };
    }

    const rulesJson = loadIntentRules_();
    const classification = classifyAction_(trig, rec, rulesJson);

    return {
      valid: true,
      match: (current === classification.action),
      trigger: trig,
      current: current,
      predicted: classification.action,
      pattern: classification.pattern,
      row: rowIdx,
      sheet: sheetName
    };
  } catch (error) {
    console.error("Error in validateActiveRow:", error);
    return { valid: false, message: "System Error: " + error.message + " ⚠️" };
  }
}

/**
 * Directly applies the predicted intent to the active sheet 🛠️✅
 * @param {number} row - The row index to update
 * @param {string} predictedValue - The value to write to the Action Type column
 */
function applyPredictedIntent(row, predictedValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const hm = headerMap_(firstRow);
    const idxAct = hm[CONFIG.ACTION_HEADER];

    if (idxAct === undefined) throw new Error("Action Type column not found! ❌");

    // Write the value to the sheet
    sheet.getRange(row, idxAct + 1).setValue(predictedValue);
    sheet.getRange(row, idxAct + 1).setBackground("#d4edda"); // Soft Green success highlight
    
    return { success: true, message: "Intent Updated Successfully! 🎉" };
  } catch (error) {
    console.error("Error in applyPredictedIntent:", error);
    return { success: false, message: "Failed to update: " + error.message + " ⚠️" };
  }
}

/**
 * Loads intent rules from Google Drive 📂
 */
function loadIntentRules_() {
  const file = DriveApp.getFileById(CONFIG.INTENT_RULES_FILE_ID);
  return JSON.parse(file.getBlob().getDataAsString());
}

/**
 * Validates if the current sheet is a valid integration sheet 🛡️
 */
function isIntegrationSheet_(sheetName, firstRowValues) {
  if (CONFIG.SKIP_SHEETS.indexOf(sheetName) !== -1) return false;
  if (sheetName.indexOf(CONFIG.LEGACY_MARKER) !== -1) return false;
  if (!firstRowValues || firstRowValues.length < 2) return false;

  const colA = String(firstRowValues[0] || "").trim();
  const colB = String(firstRowValues[1] || "");
  return (colA === "Connected App/Integration" && colB.indexOf("Automation Trigger Phrase") !== -1);
}

/**
 * Maps header names to 0-based column indices 🗺️
 */
function headerMap_(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    if (h && String(h).trim()) map[String(h).trim()] = i;
  });
  return map;
}

/**
 * Core Regex Classifier Logic 🧠🔍
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
        const regex = new RegExp(patterns[j], 'i');
        if (regex.test(t)) {
          return { action: action, pattern: patterns[j] };
        }
      } catch (e) {
        console.warn(`Invalid Regex Pattern: ${patterns[j]}`, e);
      }
    }
  }
  return { action: "Search/Query", pattern: "Default Fallback" };
}

/**
 * Setup and Maintenance 🔐
 */
function setupIntentValidator() {
  try {
    loadIntentRules_();
    SpreadsheetApp.getUi().alert("Setup Successful! 🚀 System is ready.");
  } catch (e) {
    SpreadsheetApp.getUi().alert("Setup Failed! ⚠️ Check File ID in CONFIG.");
  }
}

/**
 * Runs a full audit and generates a mismatch report 🧪📑
 */
function runIntentAudit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rulesJson = loadIntentRules_();
  const timestamp = new Date().toISOString();
  const out = [];

  const sheets = ss.getSheets();

  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (CONFIG.SKIP_SHEETS.includes(sheetName)) return;

    const range = sheet.getDataRange();
    const values = range.getValues();
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

      const classification = classifyAction_(String(trig), String(rec), rulesJson);
      const predicted = classification.action;
      
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
          `Match Pattern: ${classification.pattern}`
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

/**
 * Ensures the Report Sheet exists and is clean 🛡️
 */
function ensureReportSheet_(ss) {
  let rep = ss.getSheetByName(CONFIG.REPORT_SHEET_NAME);
  if (rep) ss.deleteSheet(rep);
  rep = ss.insertSheet(CONFIG.REPORT_SHEET_NAME, 0);

  const headers = [
    "Timestamp", "Sheet Name", "Row Number", "Trigger Phrase",
    "Recommended Phrase", "Current Action", "Predicted Action",
    "Match Status", "Diagnostic Info"
  ];
  rep.getRange(1, 1, 1, headers.length).setValues([headers]);
  rep.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d9ead3");
  rep.setFrozenRows(1);
  return rep;
}

/**
 * Generates a visual Dashboard for QA metrics 📊📉
 */
function createSummaryDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportSheet = ss.getSheetByName(CONFIG.REPORT_SHEET_NAME);
  if (!reportSheet) return;

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
      .setOption('colors', ['#FF6B9D']) // Primary Color!
      .build();
    dash.insertChart(chart);
  }

  dash.autoResizeColumns(1, 4);
  dash.activate();
}
