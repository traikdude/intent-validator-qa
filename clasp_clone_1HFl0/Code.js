
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * ðŸ§ ðŸ“Š GAS MASTER â€” UNIFIED SALES DASHBOARD + MASTER AUTOMATION FRAMEWORK
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * âœ… Includes:
 *  - Master Automation Framework (logging dashboard, UI suite, link + folder managers)
 *  - Sales Dashboard Generator (Monthly + Weekly dashboards, dropdown sheet, query ref)
 *  - â€œExcel Backboneâ€ helper columns (Oâ€“V) + Query blocks that rely on P/Q/R + T/U/V
 *  - Debug Harness (timed runs, env dump, document locks)
 *
 * âœ… Key fixes included:
 *  1) Correct date filtering: dashboard date range filters on SALE DATE (A) (not month bucket)
 *  2) Aligned headers with constants
 *  3) Safe filter literals (handles apostrophes)
 *  4) Helper boolean columns (P/Q/R and T/U/V) as formulas (not hard-coded TRUE)
 *
 * Version: 2.2.0
 * Created: 2026-01-10
 * Updated: 2026-01-11
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

/** =======================================================================
 *  A) MASTER AUTOMATION CONFIG ðŸ§©
 *  ======================================================================= */
const MASTER_CONFIG = {
  MENU_NAME: "âš™ï¸ Master Automation",
  MENU_EMOJI: "âš™ï¸",
  ENABLE_TOASTS: true,

  LINKS: {
    COLAB: "",
    GITHUB: "",
    WEBAPP: "",
    PARENT_FOLDER: ""
  },

  THEME: {
    BRAND_NAME: "GAS Master Suite âœ¨",
    PRIMARY: "#6D28D9",
    SECONDARY: "#06B6D4",
    ACCENT: "#F59E0B",
    BG: "#0B1220",
    CARD: "#111A2E",
    TEXT: "#E5E7EB",
    MUTED: "#9CA3AF",
    SUCCESS: "#22C55E",
    WARNING: "#F59E0B",
    DANGER: "#EF4444"
  },

  DASHBOARD_SHEET_NAME: "Master Dashboard",
  DASHBOARD_FREEZE_ROWS: 1,

  LOG_MAX_ROWS: 20000,
  LOG_AUTO_TRIM_ENABLED: true,
  LOG_INCLUDE_EDIT_EVENTS: true
};

/** =======================================================================
 *  B) SALES DASHBOARD CONFIG ðŸ“Š
 *  ======================================================================= */
const SALES_CONFIG = {
  VERSION: "2.2.0",
  MENU_NAME: "ðŸ“Š Dashboard Tools",

  SHEETS: {
    SALES_DATA: "sales data",
    MONTHLY_DASHBOARD: "MONTHLY DASHBOARD",
    WEEKLY_DASHBOARD: "WEEKLY DASHBOARD",
    DROPDOWN: "dropdown",
    QUERY_REFERENCE: "QUERY REFERENCE",
    ERROR_LOG: "_ERROR_LOG"
  },

  // Column indices in "sales data" (1-based)
  COL: {
    SALE_DATE: 1,                // A
    CLIENT_NAME: 2,              // B
    ADDRESS_CITY: 3,             // C
    STATES: 4,                   // D
    ZIP: 5,                      // E
    EMAIL: 6,                    // F
    SALES_PERSON: 7,             // G
    SALE_AMOUNT: 8,              // H
    COMMISSION_PCT: 9,           // I
    COMMISSION_AMT: 10,          // J
    PRODUCT_TYPE: 11,            // K
    STATUS: 12,                  // L
    LEAD_SOURCE: 13,             // M
    NOTES: 14,                   // N
    MONTH: 15,                   // O (month bucket)
    MONTHLY_AGENT_FILTER: 16,    // P (boolean)
    MONTHLY_STATUS_FILTER: 17,   // Q (boolean)
    MONTHLY_LEAD_FILTER: 18,     // R (boolean)
    WEEK_ENDING: 19,             // S (week bucket)
    WEEKLY_AGENT_FILTER: 20,     // T (boolean)
    WEEKLY_STATUS_FILTER: 21,    // U (boolean)
    WEEKLY_LEAD_FILTER: 22       // V (boolean)
  },

  CACHE: {
    TTL_SECONDS: 600,
    KEY_PREFIX: "SALES_DASH_"
  },

  DEFAULTS: {
    FILTER_ALL: "ALL"
  }
};

/** =======================================================================
 *  C) UNIFIED ENTRYPOINTS (onOpen + onEdit + doGet + doPost) ðŸ§­
 *  ======================================================================= */

/**
 * Unified onOpen(e): builds menus + ensures master framework initialized.
 * Apps Script allows only one top-level onOpen.
 * @param {GoogleAppsScript.Events.SheetsOnOpen} e
 */
function onOpen(e) {
  MASTER_ensureInitialized_({ reason: "onOpen" });
  SALES_ensureCoreSheetsExist_();
  GASMASTER_buildUnifiedMenu_();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "âœ… GAS Master loaded! Use the menus to initialize/refresh dashboards âœ¨",
    "Ready ðŸš€",
    5
  );
}

/**
 * Unified onEdit(e): handles dashboard filter edits (simple trigger).
 * Installable edit logging is handled by MASTER_onEditHandler when enabled.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 */
function onEdit(e) {
  try {
    SALES_onEditFilterRefresh_(e);
  } catch (err) {
    console.log("onEdit error:", err && err.message);
  }
}

/**
 * Web app entry (optional).
 * @param {Object} e
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  MASTER_ensureInitialized_({ reason: "doGet" });
  const html = MASTER_renderUi_("webapp");
  html.setTitle(String(MASTER_CONFIG.THEME.BRAND_NAME));
  html.addMetaTag("viewport", "width=device-width, initial-scale=1");
  return html;
}

/**
 * Optional: doPost for webhook-style calls.
 * Returns JSON with ok=false unless you extend it.
 * @param {Object} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    const payload = e && e.postData && e.postData.contents ? e.postData.contents : "";
    const out = { ok: false, message: "doPost is not enabled for business actions in this project.", received: payload };
    return ContentService
      .createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const out2 = { ok: false, message: String(err && err.message ? err.message : err) };
    return ContentService
      .createTextOutput(JSON.stringify(out2))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** =======================================================================
 *  D) UNIFIED MENU BUILDER ðŸ§­âœ¨
 *  ======================================================================= */

/**
 * Builds the full unified menu (Sales + Master + Debug).
 * @private
 */
function GASMASTER_buildUnifiedMenu_() {
  const ui = SpreadsheetApp.getUi();
  const root = ui.createMenu("ðŸ§  GAS Master");

  const dash = ui.createMenu(SALES_CONFIG.MENU_NAME)
    .addItem("ðŸ—ï¸ Initialize Dashboard Structure", "SALES_initializeDashboardStructure")
    .addItem("ðŸ”§ Fix Backbone Like Excel (Helper Columns + Queries)", "SALES_fixBackboneLikeExcel")
    .addSeparator()
    .addItem("ðŸ”„ Refresh All Dashboards", "SALES_refreshAllDashboards")
    .addSubMenu(
      ui.createMenu("ðŸ“ˆ Monthly Dashboard")
        .addItem("Refresh Monthly Data", "SALES_refreshMonthlyDashboard")
        .addItem("Generate Monthly Report (Preview)", "SALES_generateMonthlyReport")
    )
    .addSubMenu(
      ui.createMenu("ðŸ“… Weekly Dashboard")
        .addItem("Refresh Weekly Data", "SALES_refreshWeeklyDashboard")
        .addItem("Generate Weekly Report (Preview)", "SALES_generateWeeklyReport")
    )
    .addSeparator()
    .addSubMenu(
      ui.createMenu("âš™ï¸ Setup & Maintenance")
        .addItem("ðŸ“‹ Setup Data Validation", "SALES_setupDataValidation")
        .addItem("ðŸ”¢ Recalculate Derived Columns", "SALES_recalculateDerivedColumns")
        .addItem("ðŸ§  Apply Helper Column Formulas (Oâ€“V)", "SALES_applyHelperColumnFormulas")
        .addItem("ðŸ§ª Import Sample Data", "SALES_importSampleData")
        .addItem("ðŸ§¹ Clear Sales Cache", "SALES_clearAllCache")
    )
    .addSeparator()
    .addItem("â“ Help & Documentation", "SALES_showHelp");

  const master = ui.createMenu(`${MASTER_CONFIG.MENU_NAME} ${MASTER_CONFIG.MENU_EMOJI}`)
    .addItem("ðŸ  Open Sidebar (Quick Panel)", "MASTER_showSidebar")
    .addItem("ðŸŒ Open Web App UI", "MASTER_openWebAppLink")
    .addSeparator()
    .addItem("ðŸ§ª Google Colab", "MASTER_openColab")
    .addItem("ðŸ™ GitHub Repo", "MASTER_openGitHub")
    .addItem("ðŸš€ Web App Deployment", "MASTER_openDeploymentHub")
    .addItem("ðŸ—‚ï¸ Folder Manager", "MASTER_openFolderManager")
    .addSeparator()
    .addItem("ðŸ“Š Open Master Dashboard (Logs)", "MASTER_openDashboard")
    .addItem("ðŸ§¾ View Recent Logs (Dialog)", "MASTER_showRecentLogsDialog")
    .addSeparator()
    .addItem("ðŸ”— Link Manager (Set URLs)", "MASTER_showLinkManagerDialog")
    .addItem("ðŸ”„ Reset Links to Blank", "MASTER_resetLinks")
    .addSeparator()
    .addItem("ðŸ’¡ About / Help", "MASTER_showAboutDialog");

  const dbg = ui.createMenu("ðŸž Debug")
    .addItem("ENV Dump", "DEBUG_menuEnvDump")
    .addItem("Run Sales Init (timed)", "DEBUG_runSalesInit")
    .addItem("Run Master Init (timed)", "DEBUG_runMasterInit")
    .addItem("Run Sample Import (timed)", "DEBUG_runSampleImport")
    .addItem("Run Fix Backbone Like Excel (timed)", "DEBUG_runFixBackbone");

  root.addSubMenu(dash).addSubMenu(master).addSubMenu(dbg).addToUi();
}

/** =======================================================================
 *  E) SALES DASHBOARD â€” HELP UI ðŸ“–
 *  ======================================================================= */

/**
 * Shows a help dialog for the Sales Dashboard.
 */
function SALES_showHelp() {
  const html = HtmlService.createHtmlOutput(
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; line-height: 1.5; }
      h2 { color: #1a73e8; margin: 0 0 10px 0; }
      h3 { color: #34a853; margin-top: 16px; }
      code { background: #f1f3f4; padding: 2px 6px; border-radius: 4px; }
      .tip { background:#e8f5e9; padding:10px; border-radius:8px; margin-top:12px; }
      ul { margin: 6px 0 0 18px; }
    </style>
  </head>
  <body>
    <h2>ðŸ“Š Sales Dashboard Help</h2>

    <h3>ðŸ—ï¸ Initialization</h3>
    <ul>
      <li><b>Initialize Dashboard Structure</b> creates/repairs all required sheets and formulas.</li>
      <li><b>Fix Backbone Like Excel</b> applies helper column formulas (Oâ€“V) and correct QUERY blocks.</li>
      <li><b>Setup Data Validation</b> applies dropdown rules to the Sales Data sheet.</li>
      <li><b>Recalculate Derived Columns</b> rebuilds month/week/commission + helper filters.</li>
    </ul>

    <h3>ðŸ”„ Refreshing</h3>
    <ul>
      <li><b>Refresh All</b> updates timestamps and flushes formulas.</li>
      <li>Changing filter cells (dates / agent / status / lead) will auto-refresh timestamps.</li>
    </ul>

    <div class="tip">
      ðŸ’¡ <b>Pro Tip:</b> QUERY date literals should be <code>date 'yyyy-MM-dd'</code>.
      Keep filter cells as real dates ðŸ—“ï¸âœ¨
    </div>
  </body>
</html>`
  ).setWidth(540).setHeight(520);

  SpreadsheetApp.getUi().showModalDialog(html, "ðŸ“Š Dashboard Help");
}

/** =======================================================================
 *  F) SALES DASHBOARD â€” CORE OPERATIONS ðŸ”„
 *  ======================================================================= */

/**
 * Refreshes both dashboards.
 */
function SALES_refreshAllDashboards() {
  return MASTER_runWithLogging_("dashboard", "refresh_all_dashboards", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast("ðŸ”„ Refreshing dashboards...", "Processing â³", -1);

    SALES_clearAllCache();
    SpreadsheetApp.flush();
    SALES_refreshMonthlyDashboard();
    SALES_refreshWeeklyDashboard();

    ss.toast("âœ… All dashboards refreshed!", "Done ðŸŽ‰", 4);
  });
}

/**
 * Refresh Monthly dashboard timestamp.
 */
function SALES_refreshMonthlyDashboard() {
  return MASTER_runWithLogging_("dashboard", "refresh_monthly_dashboard", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD);
    if (!sheet) throw new Error("Monthly Dashboard sheet not found!");
    SpreadsheetApp.flush();
    sheet.getRange("A1").setValue("Last Updated: " + new Date().toLocaleString());
  });
}

/**
 * Refresh Weekly dashboard timestamp.
 */
function SALES_refreshWeeklyDashboard() {
  return MASTER_runWithLogging_("dashboard", "refresh_weekly_dashboard", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD);
    if (!sheet) throw new Error("Weekly Dashboard sheet not found!");
    SpreadsheetApp.flush();
    sheet.getRange("A1").setValue("Last Updated: " + new Date().toLocaleString());
  });
}

/** =======================================================================
 *  G) SALES DASHBOARD â€” INITIALIZATION ðŸ—ï¸
 *  ======================================================================= */

/**
 * Creates/repairs sheets, formulas, validations, and dashboard structures.
 */
function SALES_initializeDashboardStructure() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const resp = ui.alert(
    "ðŸ—ï¸ Initialize Dashboard Structure",
    "This will create/repair all sheets, formulas, and validations.\nExisting data will be preserved where possible. Continue?",
    ui.ButtonSet.YES_NO
  );

  if (resp !== ui.Button.YES) {
    ss.toast("âŒ Initialization cancelled.", "Cancelled", 3);
    return;
  }

  return Debug.withDocumentLock(() => {
    return MASTER_runWithLogging_("dashboard", "initialize_dashboard_structure", () => {
      ss.toast("ðŸ”„ Initializing dashboard structure...", "Working â³", -1);

      const salesSheet = SALES_getOrCreateSheet_(ss, SALES_CONFIG.SHEETS.SALES_DATA);
      const monthlySheet = SALES_getOrCreateSheet_(ss, SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD);
      const weeklySheet = SALES_getOrCreateSheet_(ss, SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD);
      const dropdownSheet = SALES_getOrCreateSheet_(ss, SALES_CONFIG.SHEETS.DROPDOWN);
      const queryRefSheet = SALES_getOrCreateSheet_(ss, SALES_CONFIG.SHEETS.QUERY_REFERENCE);
      SALES_getOrCreateSheet_(ss, SALES_CONFIG.SHEETS.ERROR_LOG);

      SALES_setupSalesDataHeaders_(salesSheet);
      SALES_setupDropdownSheet_(dropdownSheet);
      SALES_setupQueryReference_(queryRefSheet);

      SALES_setupMonthlyDashboard_(monthlySheet);
      SALES_setupWeeklyDashboard_(weeklySheet);

      SALES_setupDataValidation();

      // Derived columns (includes helper columns Oâ€“V)
      SALES_recalculateDerivedColumns();

      // Ensure backbone queries match helper columns
      SALES_fixBackboneLikeExcel();

      ss.toast("âœ… Dashboard initialized successfully!", "Done ðŸŽ‰", 5);
    });
  });
}

/**
 * Checks for core sheets without creating them automatically on open.
 * @private
 */
function SALES_ensureCoreSheetsExist_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const names = Object.values(SALES_CONFIG.SHEETS).filter(n => !String(n).startsWith("_"));
  names.forEach(n => {
    if (!ss.getSheetByName(n)) {
      // do not auto-create on open
    }
  });
}

/**
 * Gets or creates a sheet by name.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} name
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 * @private
 */
function SALES_getOrCreateSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

/** =======================================================================
 *  H) SALES DATA SHEET â€” HEADERS + FORMATTING ðŸ“„
 *  ======================================================================= */

/**
 * Ensures the sales data headers match the configured columns.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @private
 */
function SALES_setupSalesDataHeaders_(sheet) {
  const headers = [[
    "SALE DATE",               // A 1
    "CLIENT NAME",             // B 2
    "ADDRESS CITY",            // C 3
    "STATES",                  // D 4
    "ZIP",                     // E 5
    "EMAIL",                   // F 6
    "SALES PERSON",            // G 7
    "SALE AMOUNT",             // H 8
    "COMMISSION PCT",          // I 9
    "COMMISSION AMOUNT",       // J 10
    "PRODUCT TYPE",            // K 11
    "STATUS",                  // L 12
    "LEAD SOURCE",             // M 13
    "NOTES",                   // N 14
    "MONTH",                   // O 15
    "MONTHLY AGENT FILTER",    // P 16 (boolean)
    "MONTHLY STATUS FILTER",   // Q 17 (boolean)
    "MONTHLY LEAD FILTER",     // R 18 (boolean)
    "WEEK ENDING",             // S 19
    "WEEKLY AGENT FILTER",     // T 20 (boolean)
    "WEEKLY STATUS FILTER",    // U 21 (boolean)
    "WEEKLY LEAD FILTER"       // V 22 (boolean)
  ]];

  const existing = sheet.getRange(1, 1, 1, headers[0].length).getValues()[0];
  const existingJoined = existing.map(x => String(x || "").trim()).join("|");
  const targetJoined = headers[0].join("|");

  const shouldWrite = existingJoined !== targetJoined;
  if (shouldWrite) {
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  }

  const hr = sheet.getRange(1, 1, 1, headers[0].length);
  hr.setFontWeight("bold")
    .setBackground("#4285f4")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers[0].length);
}


/** =======================================================================
 *  I) DROPDOWN SHEET â€” LISTS ðŸ“‹
 *  ======================================================================= */

/**
 * Builds/refreshes the dropdown list sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @private
 */
function SALES_setupDropdownSheet_(sheet) {
  sheet.clear();

  sheet.getRange("A1").setValue("sales person list").setFontWeight("bold").setBackground("#4285f4").setFontColor("#ffffff");
  sheet.getRange("C1").setValue("lead source list").setFontWeight("bold").setBackground("#34a853").setFontColor("#ffffff");
  sheet.getRange("E1").setValue("product type list").setFontWeight("bold").setBackground("#fbbc04").setFontColor("#000000");
  sheet.getRange("G1").setValue("status list").setFontWeight("bold").setBackground("#ea4335").setFontColor("#ffffff");
  sheet.getRange("I1").setValue("Month list").setFontWeight("bold").setBackground("#9c27b0").setFontColor("#ffffff");
  sheet.getRange("K1").setValue("WEEK list").setFontWeight("bold").setBackground("#1a73e8").setFontColor("#ffffff");

  const salesPersons = [
    "nichola tesla", "margerette cho", "lori gispert", "timmithy bradshaw",
    "danny devito", "alaska thunderfuck", "just jan", "janet mock",
    "gwen arajo", "ben de la creme"
  ];
  salesPersons.forEach((name, i) => sheet.getRange(i + 2, 1).setValue(name));

  const leadSources = ["cold call", "client referral", "purchased client"];
  leadSources.forEach((s, i) => sheet.getRange(i + 2, 3).setValue(s));

  const productTypes = [
    "CAR", "BASEBALL", "TENNIS BALL", "KITE", "SAILBOAT", "SNOWMAN", "SCYTHE",
    "ALCOHOL", "SUITCASE", "PURSE", "WALLET", "WATCH", "AIRPLANE", "LUGGAGE"
  ];
  productTypes.forEach((t, i) => sheet.getRange(i + 2, 5).setValue(t));

  const statuses = ["PROCESSING", "DELIVERED", "IN-TRANSIT"];
  statuses.forEach((st, i) => sheet.getRange(i + 2, 7).setValue(st));

  let monthRow = 2;
  for (let year = 2017; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      sheet.getRange(monthRow, 9).setValue(new Date(year, month, 1));
      monthRow++;
    }
  }
  sheet.getRange("I2:I" + (monthRow - 1)).setNumberFormat("yyyy-mm");

  let weekRow = 2;
  let d = new Date(2017, 0, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getFullYear() <= 2026) {
    sheet.getRange(weekRow, 11).setValue(new Date(d));
    d.setDate(d.getDate() + 7);
    weekRow++;
  }
  sheet.getRange("K2:K" + (weekRow - 1)).setNumberFormat("yyyy-mm-dd");

  sheet.autoResizeColumns(1, 11);
}

/** =======================================================================
 *  J) QUERY REFERENCE SHEET â€” MINI GUIDE ðŸ“š
 *  ======================================================================= */

/**
 * Writes a QUERY reference guide sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @private
 */
function SALES_setupQueryReference_(sheet) {
  sheet.clear();

  sheet.getRange("A1").setValue("#").setFontWeight("bold").setBackground("#4285f4").setFontColor("#ffffff");
  sheet.getRange("B1").setValue("QUERY SYNTAX").setFontWeight("bold").setBackground("#4285f4").setFontColor("#ffffff");
  sheet.getRange("C1").setValue("DESCRIPTION").setFontWeight("bold").setBackground("#4285f4").setFontColor("#ffffff");
  sheet.getRange("D1").setValue("EXAMPLE").setFontWeight("bold").setBackground("#4285f4").setFontColor("#ffffff");

  const rows = [
    ["1", "SELECT", "Choose which columns to return", "SELECT A, B, C"],
    ["2", "WHERE", "Filter rows (use WHERE A IS NOT NULL before GROUP BY)", "WHERE A IS NOT NULL AND B > 100"],
    ["3", "GROUP BY", "Aggregate data by column", "GROUP BY A ORDER BY SUM(B) DESC"],
    ["4", "PIVOT", "Transform row values into columns", "PIVOT C"],
    ["5", "ORDER BY", "Sort results", "ORDER BY A DESC"],
    ["6", "LIMIT", "Limit number of results", "LIMIT 10"],
    ["7", "OFFSET", "Skip first N rows", "OFFSET 5"],
    ["8", "LABEL", "Rename output headers", "LABEL COUNT(H) 'NUM', SUM(H) 'TOTAL'"],
    ["9", "FORMAT", "Format returned values", "FORMAT A 'yyyy-MM-dd'"],
    ["10", "DATE LITERAL", "Use date 'yyyy-MM-dd' inside query", "WHERE A >= date '2026-01-01'"]
  ];

  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  for (let r = 2; r <= rows.length + 1; r++) {
    if (r % 2 === 0) sheet.getRange(r, 1, 1, 4).setBackground("#f8f9fa");
  }
  sheet.autoResizeColumns(1, 4);
}

/** =======================================================================
 *  K) DERIVED COLUMNS â€” COMMISSION / MONTH / WEEK + HELPER FILTERS ðŸ”¢
 *  ======================================================================= */

/**
 * Recalculates derived columns and helper filter columns.
 * Includes:
 *  - Month bucket (O)
 *  - Week ending (S)
 *  - Commission amount (J)
 *  - Helper boolean filter columns (P/Q/R and T/U/V)
 */
function SALES_recalculateDerivedColumns() {
  return MASTER_runWithLogging_("dashboard", "recalculate_derived_columns", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sales = ss.getSheetByName(SALES_CONFIG.SHEETS.SALES_DATA);
    if (!sales) throw new Error("Sales data sheet not found!");

    const lastRow = sales.getLastRow();
    if (lastRow < 2) {
      console.log("No data rows to process.");
      return;
    }

    const rows = lastRow - 1;

    // Commission amount (J)
    const commFormula = '=IF($H2="","",$H2*$I2)';
    sales.getRange(2, SALES_CONFIG.COL.COMMISSION_AMT, 1, 1).setFormula(commFormula);
    if (rows > 1) {
      sales.getRange(2, SALES_CONFIG.COL.COMMISSION_AMT, 1, 1)
        .copyTo(sales.getRange(2, SALES_CONFIG.COL.COMMISSION_AMT, rows, 1), { contentsOnly: false });
    }

    // Formats
    sales.getRange(2, SALES_CONFIG.COL.SALE_AMOUNT, rows, 1).setNumberFormat("$#,##0.00");
    sales.getRange(2, SALES_CONFIG.COL.COMMISSION_AMT, rows, 1).setNumberFormat("$#,##0.00");
    sales.getRange(2, SALES_CONFIG.COL.COMMISSION_PCT, rows, 1).setNumberFormat("0.00%");

    // Month/week + helper booleans
    SALES_applyHelperColumnFormulas();

    ss.toast(`âœ… Derived + helper columns rebuilt for ${rows} rows!`, "Derived Columns ðŸ”¢", 4);
  });
}

/** =======================================================================
 *  L) DATA VALIDATION â€” DROPDOWNS âœ…
 *  ======================================================================= */

/**
 * Applies data validation rules to the sales data sheet.
 */
function SALES_setupDataValidation() {
  return MASTER_runWithLogging_("dashboard", "setup_data_validation", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sales = ss.getSheetByName(SALES_CONFIG.SHEETS.SALES_DATA);
    const dd = ss.getSheetByName(SALES_CONFIG.SHEETS.DROPDOWN);

    if (!sales || !dd) {
      console.log("Required sheets missing for data validation.");
      return;
    }

    const lastRow = Math.max(sales.getLastRow(), 100);

    const salesPersonRange = dd.getRange("A2:A11");
    const salesPersonRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(salesPersonRange, true)
      .setAllowInvalid(false)
      .build();
    sales.getRange(2, SALES_CONFIG.COL.SALES_PERSON, lastRow - 1, 1).setDataValidation(salesPersonRule);

    const productRange = dd.getRange("E2:E15");
    const productRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(productRange, true)
      .setAllowInvalid(false)
      .build();
    sales.getRange(2, SALES_CONFIG.COL.PRODUCT_TYPE, lastRow - 1, 1).setDataValidation(productRule);

    const statusRange = dd.getRange("G2:G4");
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(statusRange, true)
      .setAllowInvalid(false)
      .build();
    sales.getRange(2, SALES_CONFIG.COL.STATUS, lastRow - 1, 1).setDataValidation(statusRule);

    const leadRange = dd.getRange("C2:C4");
    const leadRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(leadRange, true)
      .setAllowInvalid(false)
      .build();
    sales.getRange(2, SALES_CONFIG.COL.LEAD_SOURCE, lastRow - 1, 1).setDataValidation(leadRule);

    ss.toast("âœ… Data validation applied!", "Validation âœ…", 4);
  });
}

/** =======================================================================
 *  M) DASHBOARD BUILDERS â€” MONTHLY + WEEKLY ðŸ“ˆðŸ“…
 *  ======================================================================= */

/**
 * Builds the Monthly Dashboard sheet layout (titles/filters/blocks).
 * Queries are placed and later re-built by SALES_fixBackboneLikeExcel().
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @private
 */
function SALES_setupMonthlyDashboard_(sheet) {
  sheet.clear();

  sheet.getRange("A1").setValue("Last Updated: " + new Date().toLocaleString());
  sheet.getRange("B2").setValue("ðŸ“Š MONTHLY SALES DASHBOARD").setFontSize(18).setFontWeight("bold");

  sheet.getRange("D2").setValue("Start Date:").setFontWeight("bold");
  sheet.getRange("E2").setValue(new Date(new Date().getFullYear(), 0, 1));
  sheet.getRange("D3").setValue("End Date:").setFontWeight("bold");
  sheet.getRange("E3").setValue(new Date());

  sheet.getRange("H2").setValue("Agent Filter:").setFontWeight("bold");
  sheet.getRange("I2").setValue(SALES_CONFIG.DEFAULTS.FILTER_ALL);
  sheet.getRange("H3").setValue("Status Filter:").setFontWeight("bold");
  sheet.getRange("I3").setValue(SALES_CONFIG.DEFAULTS.FILTER_ALL);
  sheet.getRange("H4").setValue("Lead Source:").setFontWeight("bold");
  sheet.getRange("I4").setValue(SALES_CONFIG.DEFAULTS.FILTER_ALL);

  sheet.getRange("E2:E3").setNumberFormat("yyyy-mm-dd");

  sheet.getRange("B5").setValue("ðŸ“Š KEY METRICS").setFontWeight("bold").setFontSize(14);
  sheet.getRange("B6").setValue("Total Sales");
  sheet.getRange("C6").setValue("Avg Sale");
  sheet.getRange("D6").setValue("Total Revenue");
  sheet.getRange("E6").setValue("Transactions");
  sheet.getRange("B6:E6").setBackground("#e8f0fe").setFontWeight("bold");

  sheet.getRange("B7").setFormula("=IFERROR(L33,0)");
  sheet.getRange("C7").setFormula("=IFERROR(K33,0)");
  sheet.getRange("D7").setFormula("=IFERROR(L33,0)");
  sheet.getRange("E7").setFormula("=IFERROR(J33,0)");
  sheet.getRange("B7:D7").setNumberFormat("$#,##0.00");
  sheet.getRange("E7").setNumberFormat("#,##0");

  // STATUS table frame
  sheet.getRange("I9").setValue("ðŸ“‹ STATUS BREAKDOWN").setFontWeight("bold").setFontSize(12);
  sheet.getRange("I10").setValue("STATUS");
  sheet.getRange("J10").setValue("NUM OF SALES");
  sheet.getRange("K10").setValue("AVG.SALE");
  sheet.getRange("L10").setValue("TOTAL SALES");
  sheet.getRange("I10:L10").setBackground("#34a853").setFontColor("#ffffff").setFontWeight("bold");

  // LEAD SOURCE table frame
  sheet.getRange("P9").setValue("ðŸ“£ LEAD SOURCE BREAKDOWN").setFontWeight("bold").setFontSize(12);
  sheet.getRange("P10").setValue("LEAD SOURCE");
  sheet.getRange("Q10").setValue("NUM OF SALES");
  sheet.getRange("R10").setValue("AVG.SALE");
  sheet.getRange("S10").setValue("TOTAL SALES");
  sheet.getRange("P10:S10").setBackground("#fbbc04").setFontColor("#000000").setFontWeight("bold");

  // MONTH trend frame
  sheet.getRange("B30").setValue("ðŸ“ˆ MONTHLY TREND").setFontWeight("bold").setFontSize(12);
  sheet.getRange("B31").setValue("SPARKLINE");
  sheet.getRange("C31").setValue("MONTH");
  sheet.getRange("D31").setValue("NUM OF SALES");
  sheet.getRange("E31").setValue("AVG.SALE");
  sheet.getRange("F31").setValue("TOTAL SALES");
  sheet.getRange("B31:F31").setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold");

  sheet.getRange("B33").setFormula('=IFERROR(SPARKLINE(F33,{"charttype","bar";"max",MAX($F$33:$F$200)}),"")');

  // AGENT frame
  sheet.getRange("I30").setValue("ðŸ‘¤ AGENT ANALYSIS").setFontWeight("bold").setFontSize(12);
  sheet.getRange("I31").setValue("SALES PERSON");
  sheet.getRange("J31").setValue("NUM OF SALES");
  sheet.getRange("K31").setValue("AVG.SALE");
  sheet.getRange("L31").setValue("TOTAL SALES");
  sheet.getRange("I31:L31").setBackground("#ea4335").setFontColor("#ffffff").setFontWeight("bold");

  // PRODUCT frame
  sheet.getRange("P30").setValue("ðŸ›ï¸ PRODUCT ANALYSIS").setFontWeight("bold").setFontSize(12);
  sheet.getRange("P31").setValue("PRODUCT TYPE");
  sheet.getRange("Q31").setValue("NUM OF SALES");
  sheet.getRange("R31").setValue("AVG.SALE");
  sheet.getRange("S31").setValue("TOTAL SALES");
  sheet.getRange("P31:S31").setBackground("#9c27b0").setFontColor("#ffffff").setFontWeight("bold");

  sheet.autoResizeColumns(1, 20);
}

/**
 * Builds the Weekly Dashboard sheet layout (titles/filters/blocks).
 * Queries are placed and later re-built by SALES_fixBackboneLikeExcel().
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @private
 */
function SALES_setupWeeklyDashboard_(sheet) {
  sheet.clear();

  sheet.getRange("A1").setValue("Last Updated: " + new Date().toLocaleString());
  sheet.getRange("B2").setValue("ðŸ“… WEEKLY SALES DASHBOARD").setFontSize(18).setFontWeight("bold");

  sheet.getRange("D2").setValue("Start Date:").setFontWeight("bold");
  sheet.getRange("E2").setValue(new Date(new Date().getFullYear(), 0, 1));
  sheet.getRange("D3").setValue("End Date:").setFontWeight("bold");
  sheet.getRange("E3").setValue(new Date());

  sheet.getRange("H2").setValue("Agent Filter:").setFontWeight("bold");
  sheet.getRange("I2").setValue(SALES_CONFIG.DEFAULTS.FILTER_ALL);
  sheet.getRange("H3").setValue("Status Filter:").setFontWeight("bold");
  sheet.getRange("I3").setValue(SALES_CONFIG.DEFAULTS.FILTER_ALL);
  sheet.getRange("H4").setValue("Lead Source:").setFontWeight("bold");
  sheet.getRange("I4").setValue(SALES_CONFIG.DEFAULTS.FILTER_ALL);

  sheet.getRange("E2:E3").setNumberFormat("yyyy-mm-dd");

  sheet.getRange("B5").setValue("ðŸ“Š KEY METRICS").setFontWeight("bold").setFontSize(14);
  sheet.getRange("B6").setValue("Total Sales");
  sheet.getRange("C6").setValue("Avg Sale");
  sheet.getRange("D6").setValue("Total Revenue");
  sheet.getRange("E6").setValue("Transactions");
  sheet.getRange("B6:E6").setBackground("#e8f0fe").setFontWeight("bold");

  sheet.getRange("B7").setFormula("=IFERROR(L33,0)");
  sheet.getRange("C7").setFormula("=IFERROR(K33,0)");
  sheet.getRange("D7").setFormula("=IFERROR(L33,0)");
  sheet.getRange("E7").setFormula("=IFERROR(J33,0)");
  sheet.getRange("B7:D7").setNumberFormat("$#,##0.00");
  sheet.getRange("E7").setNumberFormat("#,##0");

  sheet.getRange("I9").setValue("ðŸ“‹ STATUS BREAKDOWN").setFontWeight("bold").setFontSize(12);
  sheet.getRange("I10").setValue("STATUS");
  sheet.getRange("J10").setValue("NUM OF SALES");
  sheet.getRange("K10").setValue("AVG.SALE");
  sheet.getRange("L10").setValue("TOTAL SALES");
  sheet.getRange("I10:L10").setBackground("#34a853").setFontColor("#ffffff").setFontWeight("bold");

  sheet.getRange("P9").setValue("ðŸ“£ LEAD SOURCE BREAKDOWN").setFontWeight("bold").setFontSize(12);
  sheet.getRange("P10").setValue("LEAD SOURCE");
  sheet.getRange("Q10").setValue("NUM OF SALES");
  sheet.getRange("R10").setValue("AVG.SALE");
  sheet.getRange("S10").setValue("TOTAL SALES");
  sheet.getRange("P10:S10").setBackground("#fbbc04").setFontColor("#000000").setFontWeight("bold");

  sheet.getRange("B30").setValue("ðŸ“ˆ WEEKLY TREND").setFontWeight("bold").setFontSize(12);
  sheet.getRange("B31").setValue("SPARKLINE");
  sheet.getRange("C31").setValue("WEEK ENDING");
  sheet.getRange("D31").setValue("NUM OF SALES");
  sheet.getRange("E31").setValue("AVG.SALE");
  sheet.getRange("F31").setValue("TOTAL SALES");
  sheet.getRange("B31:F31").setBackground("#1a73e8").setFontColor("#ffffff").setFontWeight("bold");

  sheet.getRange("B33").setFormula('=IFERROR(SPARKLINE(F33,{"charttype","bar";"max",MAX($F$33:$F$500)}),"")');

  sheet.getRange("I30").setValue("ðŸ‘¤ AGENT ANALYSIS").setFontWeight("bold").setFontSize(12);
  sheet.getRange("I31").setValue("SALES PERSON");
  sheet.getRange("J31").setValue("NUM OF SALES");
  sheet.getRange("K31").setValue("AVG.SALE");
  sheet.getRange("L31").setValue("TOTAL SALES");
  sheet.getRange("I31:L31").setBackground("#ea4335").setFontColor("#ffffff").setFontWeight("bold");

  sheet.getRange("P30").setValue("ðŸ›ï¸ PRODUCT ANALYSIS").setFontWeight("bold").setFontSize(12);
  sheet.getRange("P31").setValue("PRODUCT TYPE");
  sheet.getRange("Q31").setValue("NUM OF SALES");
  sheet.getRange("R31").setValue("AVG.SALE");
  sheet.getRange("S31").setValue("TOTAL SALES");
  sheet.getRange("P31:S31").setBackground("#9c27b0").setFontColor("#ffffff").setFontWeight("bold");

  sheet.autoResizeColumns(1, 20);
}

/** =======================================================================
 *  N) â€œEXCEL BACKBONEâ€ â€” HELPER COLUMNS Oâ€“V + QUERY BLOCKS ðŸ”§
 *  ======================================================================= */

/**
 * Applies helper formulas in "sales data" columns Oâ€“V.
 * Treats blank OR "ALL" as no-filter.
 */
function SALES_applyHelperColumnFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sales = ss.getSheetByName(SALES_CONFIG.SHEETS.SALES_DATA);
  if (!sales) throw new Error(`Missing sheet: ${SALES_CONFIG.SHEETS.SALES_DATA}`);

  const lastRow = Math.max(sales.getLastRow(), 2);
  const fillRows = lastRow - 1;
  if (fillRows < 1) return;

  const monthly = SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD;
  const weekly = SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD;

  const noFilterMonthlyAgent = `OR('${monthly}'!$I$2="",'${monthly}'!$I$2="${SALES_CONFIG.DEFAULTS.FILTER_ALL}")`;
  const noFilterMonthlyStatus = `OR('${monthly}'!$I$3="",'${monthly}'!$I$3="${SALES_CONFIG.DEFAULTS.FILTER_ALL}")`;
  const noFilterMonthlyLead = `OR('${monthly}'!$I$4="",'${monthly}'!$I$4="${SALES_CONFIG.DEFAULTS.FILTER_ALL}")`;

  const noFilterWeeklyAgent = `OR('${weekly}'!$I$2="",'${weekly}'!$I$2="${SALES_CONFIG.DEFAULTS.FILTER_ALL}")`;
  const noFilterWeeklyStatus = `OR('${weekly}'!$I$3="",'${weekly}'!$I$3="${SALES_CONFIG.DEFAULTS.FILTER_ALL}")`;
  const noFilterWeeklyLead = `OR('${weekly}'!$I$4="",'${weekly}'!$I$4="${SALES_CONFIG.DEFAULTS.FILTER_ALL}")`;

  const fO = `=IF($A2="","",DATE(YEAR($A2),MONTH($A2),1))`;

  // Monthly booleans P/Q/R
  const fP = `=IF($A2="","",IF(${noFilterMonthlyAgent},TRUE,$G2='${monthly}'!$I$2))`;
  const fQ = `=IF($A2="","",IF(${noFilterMonthlyStatus},TRUE,$L2='${monthly}'!$I$3))`;
  const fR = `=IF($A2="","",IF(${noFilterMonthlyLead},TRUE,$M2='${monthly}'!$I$4))`;

  const fS = `=IF($A2="","",$A2-WEEKDAY($A2,2)+7)`;

  // Weekly booleans T/U/V
  const fT = `=IF($A2="","",IF(${noFilterWeeklyAgent},TRUE,$G2='${weekly}'!$I$2))`;
  const fU = `=IF($A2="","",IF(${noFilterWeeklyStatus},TRUE,$L2='${weekly}'!$I$3))`;
  const fV = `=IF($A2="","",IF(${noFilterWeeklyLead},TRUE,$M2='${weekly}'!$I$4))`;

  sales.getRange(2, SALES_CONFIG.COL.MONTH, 1, 1).setFormula(fO);
  sales.getRange(2, SALES_CONFIG.COL.MONTHLY_AGENT_FILTER, 1, 1).setFormula(fP);
  sales.getRange(2, SALES_CONFIG.COL.MONTHLY_STATUS_FILTER, 1, 1).setFormula(fQ);
  sales.getRange(2, SALES_CONFIG.COL.MONTHLY_LEAD_FILTER, 1, 1).setFormula(fR);
  sales.getRange(2, SALES_CONFIG.COL.WEEK_ENDING, 1, 1).setFormula(fS);
  sales.getRange(2, SALES_CONFIG.COL.WEEKLY_AGENT_FILTER, 1, 1).setFormula(fT);
  sales.getRange(2, SALES_CONFIG.COL.WEEKLY_STATUS_FILTER, 1, 1).setFormula(fU);
  sales.getRange(2, SALES_CONFIG.COL.WEEKLY_LEAD_FILTER, 1, 1).setFormula(fV);

  if (fillRows > 1) {
    sales.getRange(2, SALES_CONFIG.COL.MONTH, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.MONTH, fillRows, 1), { contentsOnly: false });
    sales.getRange(2, SALES_CONFIG.COL.MONTHLY_AGENT_FILTER, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.MONTHLY_AGENT_FILTER, fillRows, 1), { contentsOnly: false });
    sales.getRange(2, SALES_CONFIG.COL.MONTHLY_STATUS_FILTER, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.MONTHLY_STATUS_FILTER, fillRows, 1), { contentsOnly: false });
    sales.getRange(2, SALES_CONFIG.COL.MONTHLY_LEAD_FILTER, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.MONTHLY_LEAD_FILTER, fillRows, 1), { contentsOnly: false });
    sales.getRange(2, SALES_CONFIG.COL.WEEK_ENDING, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.WEEK_ENDING, fillRows, 1), { contentsOnly: false });
    sales.getRange(2, SALES_CONFIG.COL.WEEKLY_AGENT_FILTER, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.WEEKLY_AGENT_FILTER, fillRows, 1), { contentsOnly: false });
    sales.getRange(2, SALES_CONFIG.COL.WEEKLY_STATUS_FILTER, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.WEEKLY_STATUS_FILTER, fillRows, 1), { contentsOnly: false });
    sales.getRange(2, SALES_CONFIG.COL.WEEKLY_LEAD_FILTER, 1, 1)
      .copyTo(sales.getRange(2, SALES_CONFIG.COL.WEEKLY_LEAD_FILTER, fillRows, 1), { contentsOnly: false });
  }

  sales.getRange(2, SALES_CONFIG.COL.MONTH, fillRows, 1).setNumberFormat("yyyy-mm");
  sales.getRange(2, SALES_CONFIG.COL.WEEK_ENDING, fillRows, 1).setNumberFormat("yyyy-mm-dd");

  ss.toast("âœ… Helper columns Oâ€“V rebuilt (month/week + filter booleans)!", "Backbone Fixed ðŸ§ ", 4);
}

/**
 * Rebuild Monthly dashboard QUERY blocks to use helper booleans P/Q/R.
 * Filters on SALE DATE (A) to avoid mid-month filtering bugs.
 */
function SALES_rebuildMonthlyDashboardQueries_usingHelperColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD);
  if (!sh) throw new Error(`Missing sheet: ${SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD}`);

  const where =
    `where A is not null ` +
    `and A >= date '"&TEXT($E$2,"yyyy-MM-dd")&"' ` +
    `and A <= date '"&TEXT($E$3,"yyyy-MM-dd")&"' ` +
    `and P = TRUE and Q = TRUE and R = TRUE`;

  sh.getRange("I11").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select L, count(H), avg(H), sum(H) ${where} ` +
    `group by L order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("P11").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select M, count(H), avg(H), sum(H) ${where} ` +
    `group by M order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("C32").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select O, count(H), avg(H), sum(H) ${where} ` +
    `group by O order by O asc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("I32").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select G, count(H), avg(H), sum(H) ${where} ` +
    `group by G order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("P32").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select K, count(H), avg(H), sum(H) ${where} ` +
    `group by K order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("K11:K500").setNumberFormat("$#,##0.00");
  sh.getRange("L11:L500").setNumberFormat("$#,##0.00");
  sh.getRange("R11:R500").setNumberFormat("$#,##0.00");
  sh.getRange("S11:S500").setNumberFormat("$#,##0.00");
  sh.getRange("E32:E800").setNumberFormat("$#,##0.00");
  sh.getRange("F32:F800").setNumberFormat("$#,##0.00");
  sh.getRange("K32:K800").setNumberFormat("$#,##0.00");
  sh.getRange("L32:L800").setNumberFormat("$#,##0.00");
  sh.getRange("R32:R800").setNumberFormat("$#,##0.00");
  sh.getRange("S32:S800").setNumberFormat("$#,##0.00");

  ss.toast("âœ… Monthly QUERY blocks rebuilt (uses P/Q/R helper filters)!", "Monthly Fixed ðŸ“Š", 4);
}

/**
 * Rebuild Weekly dashboard QUERY blocks to use helper booleans T/U/V.
 * Filters on SALE DATE (A) to avoid mid-week filtering bugs.
 */
function SALES_rebuildWeeklyDashboardQueries_usingHelperColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD);
  if (!sh) throw new Error(`Missing sheet: ${SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD}`);

  const where =
    `where A is not null ` +
    `and A >= date '"&TEXT($E$2,"yyyy-MM-dd")&"' ` +
    `and A <= date '"&TEXT($E$3,"yyyy-MM-dd")&"' ` +
    `and T = TRUE and U = TRUE and V = TRUE`;

  sh.getRange("I11").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select L, count(H), avg(H), sum(H) ${where} ` +
    `group by L order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("P11").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select M, count(H), avg(H), sum(H) ${where} ` +
    `group by M order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("C32").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select S, count(H), avg(H), sum(H) ${where} ` +
    `group by S order by S asc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("I32").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select G, count(H), avg(H), sum(H) ${where} ` +
    `group by G order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("P32").setFormula(
    `=IFERROR(QUERY('sales data'!A:V,` +
    `"select K, count(H), avg(H), sum(H) ${where} ` +
    `group by K order by sum(H) desc ` +
    `label count(H) 'NUM OF SALES', avg(H) 'AVG.SALE', sum(H) 'TOTAL SALES'",1),` +
    `"No data")`
  );

  sh.getRange("K11:K900").setNumberFormat("$#,##0.00");
  sh.getRange("L11:L900").setNumberFormat("$#,##0.00");
  sh.getRange("R11:R900").setNumberFormat("$#,##0.00");
  sh.getRange("S11:S900").setNumberFormat("$#,##0.00");
  sh.getRange("E32:E1200").setNumberFormat("$#,##0.00");
  sh.getRange("F32:F1200").setNumberFormat("$#,##0.00");
  sh.getRange("K32:K1200").setNumberFormat("$#,##0.00");
  sh.getRange("L32:L1200").setNumberFormat("$#,##0.00");
  sh.getRange("R32:R1200").setNumberFormat("$#,##0.00");
  sh.getRange("S32:S1200").setNumberFormat("$#,##0.00");

  ss.toast("âœ… Weekly QUERY blocks rebuilt (uses T/U/V helper filters)!", "Weekly Fixed ðŸ“…", 4);
}

/**
 * Optional: adds bar sparklines next to â€œTOTAL SALESâ€ columns.
 */
function SALES_addDashboardSparklines_optional() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const monthly = ss.getSheetByName(SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD);
  if (monthly) {
    monthly.getRange("M10").setValue("BAR").setFontWeight("bold");
    monthly.getRange("M11").setFormula(`=IFERROR(SPARKLINE(L11,{"charttype","bar";"max",MAX($L$11:$L$200)}),"")`);
    monthly.getRange("M11").copyTo(monthly.getRange("M11:M200"), { contentsOnly: false });

    monthly.getRange("T10").setValue("BAR").setFontWeight("bold");
    monthly.getRange("T11").setFormula(`=IFERROR(SPARKLINE(S11,{"charttype","bar";"max",MAX($S$11:$S$200)}),"")`);
    monthly.getRange("T11").copyTo(monthly.getRange("T11:T200"), { contentsOnly: false });

    monthly.getRange("M31").setValue("BAR").setFontWeight("bold");
    monthly.getRange("M32").setFormula(`=IFERROR(SPARKLINE(L32,{"charttype","bar";"max",MAX($L$32:$L$500)}),"")`);
    monthly.getRange("M32").copyTo(monthly.getRange("M32:M500"), { contentsOnly: false });

    monthly.getRange("T31").setValue("BAR").setFontWeight("bold");
    monthly.getRange("T32").setFormula(`=IFERROR(SPARKLINE(S32,{"charttype","bar";"max",MAX($S$32:$S$500)}),"")`);
    monthly.getRange("T32").copyTo(monthly.getRange("T32:T500"), { contentsOnly: false });
  }

  const weekly = ss.getSheetByName(SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD);
  if (weekly) {
    weekly.getRange("M10").setValue("BAR").setFontWeight("bold");
    weekly.getRange("M11").setFormula(`=IFERROR(SPARKLINE(L11,{"charttype","bar";"max",MAX($L$11:$L$500)}),"")`);
    weekly.getRange("M11").copyTo(weekly.getRange("M11:M500"), { contentsOnly: false });

    weekly.getRange("T10").setValue("BAR").setFontWeight("bold");
    weekly.getRange("T11").setFormula(`=IFERROR(SPARKLINE(S11,{"charttype","bar";"max",MAX($S$11:$S$500)}),"")`);
    weekly.getRange("T11").copyTo(weekly.getRange("T11:T500"), { contentsOnly: false });

    weekly.getRange("M31").setValue("BAR").setFontWeight("bold");
    weekly.getRange("M32").setFormula(`=IFERROR(SPARKLINE(L32,{"charttype","bar";"max",MAX($L$32:$L$800)}),"")`);
    weekly.getRange("M32").copyTo(weekly.getRange("M32:M800"), { contentsOnly: false });

    weekly.getRange("T31").setValue("BAR").setFontWeight("bold");
    weekly.getRange("T32").setFormula(`=IFERROR(SPARKLINE(S32,{"charttype","bar";"max",MAX($S$32:$S$800)}),"")`);
    weekly.getRange("T32").copyTo(weekly.getRange("T32:T800"), { contentsOnly: false });
  }

  ss.toast("âœ… Sparklines added (optional)!", "Visuals ðŸ“Š", 4);
}

/**
 * One-click â€œmatch Excel backboneâ€ runner:
 * 1) helper columns
 * 2) rebuild monthly queries
 * 3) rebuild weekly queries
 * 4) optional sparklines (comment out if not wanted)
 */
function SALES_fixBackboneLikeExcel() {
  SALES_applyHelperColumnFormulas();
  SALES_rebuildMonthlyDashboardQueries_usingHelperColumns();
  SALES_rebuildWeeklyDashboardQueries_usingHelperColumns();
  // SALES_addDashboardSparklines_optional();
}

/** =======================================================================
 *  O) FILTER EDIT AUTO-REFRESH (simple onEdit) âŒ¨ï¸
 *  ======================================================================= */

/**
 * Updates A1 timestamp when filter cells change.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 * @private
 */
function SALES_onEditFilterRefresh_(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  const name = sheet.getName();
  if (name !== SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD && name !== SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD) return;

  const a1 = e.range.getA1Notation();
  const watch = ["E2", "E3", "I2", "I3", "I4"];
  if (!watch.includes(a1)) return;

  sheet.getRange("A1").setValue("Last Updated: " + new Date().toLocaleString());
  SpreadsheetApp.getActiveSpreadsheet().toast("âœ… Filters updated â€” dashboards refreshed!", "Filter Changed ðŸ“Œ", 3);
}

/** =======================================================================
 *  P) REPORT PREVIEWS (HTML) ðŸ“„âœ¨
 *  ======================================================================= */

/**
 * Opens a preview dialog for a monthly report.
 */
function SALES_generateMonthlyReport() {
  return MASTER_runWithLogging_("report", "generate_monthly_report_preview", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SALES_CONFIG.SHEETS.MONTHLY_DASHBOARD);
    if (!sh) {
      SpreadsheetApp.getUi().alert("âŒ Monthly Dashboard sheet not found!");
      return;
    }

    const start = sh.getRange("E2").getValue();
    const end = sh.getRange("E3").getValue();

    const html = HtmlService.createHtmlOutput(
      `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:14px;">
  <h2>ðŸ“Š Monthly Sales Report</h2>
  <p><b>Period:</b> ${SALES_formatDate_(start)} â€” ${SALES_formatDate_(end)}</p>
  <p><b>Generated:</b> ${new Date().toLocaleString()}</p>
  <hr>
  <p>Open the dashboard here: <a href="${ss.getUrl()}" target="_blank" rel="noopener">Open Dashboard</a></p>
</body></html>`
    ).setWidth(460).setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, "ðŸ“Š Monthly Report Preview");
  });
}

/**
 * Opens a preview dialog for a weekly report.
 */
function SALES_generateWeeklyReport() {
  return MASTER_runWithLogging_("report", "generate_weekly_report_preview", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SALES_CONFIG.SHEETS.WEEKLY_DASHBOARD);
    if (!sh) {
      SpreadsheetApp.getUi().alert("âŒ Weekly Dashboard sheet not found!");
      return;
    }

    const start = sh.getRange("E2").getValue();
    const end = sh.getRange("E3").getValue();

    const html = HtmlService.createHtmlOutput(
      `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:14px;">
  <h2>ðŸ“… Weekly Sales Report</h2>
  <p><b>Period:</b> ${SALES_formatDate_(start)} â€” ${SALES_formatDate_(end)}</p>
  <p><b>Generated:</b> ${new Date().toLocaleString()}</p>
  <hr>
  <p>Open the dashboard here: <a href="${ss.getUrl()}" target="_blank" rel="noopener">Open Dashboard</a></p>
</body></html>`
    ).setWidth(460).setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, "ðŸ“… Weekly Report Preview");
  });
}

/**
 * Formats a date for reports.
 * @param {Date} date
 * @return {string}
 * @private
 */
function SALES_formatDate_(date) {
  if (!date) return "N/A";
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), "MMM dd, yyyy");
}

/** =======================================================================
 *  Q) SAMPLE DATA IMPORT ðŸ“¥
 *  ======================================================================= */

/**
 * Imports sample data into the sales data sheet.
 */
function SALES_importSampleData() {
  return MASTER_runWithLogging_("data", "import_sample_data", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sales = ss.getSheetByName(SALES_CONFIG.SHEETS.SALES_DATA);
    if (!sales) {
      SpreadsheetApp.getUi().alert("âŒ Sales data sheet not found! Run Initialize first.");
      return;
    }

    const sample = [
      [new Date(2017, 0, 1), "ERIK GATON", "MIAMI", "FL", "33147", "erik@example.com", "nichola tesla", 11000, 0.1, "", "CAR", "PROCESSING", "cold call", ""],
      [new Date(2017, 1, 1), "JULIO GATON", "ORLANDO", "FL", "32801", "julio@example.com", "nichola tesla", 2000, 0.1, "", "BASEBALL", "DELIVERED", "client referral", ""],
      [new Date(2017, 2, 1), "MARIBEL GATON", "TAMPA", "FL", "33601", "maribel@example.com", "nichola tesla", 13000, 0.1, "", "TENNIS BALL", "DELIVERED", "purchased client", ""],
      [new Date(2017, 3, 1), "JOHN DOE", "JACKSONVILLE", "FL", "32099", "john@example.com", "margerette cho", 5500, 0.1, "", "KITE", "IN-TRANSIT", "cold call", ""],
      [new Date(2017, 4, 1), "JANE SMITH", "MIAMI", "FL", "33101", "jane@example.com", "lori gispert", 8000, 0.1, "", "SAILBOAT", "PROCESSING", "client referral", ""],
      [new Date(2017, 5, 1), "BOB JONES", "ORLANDO", "FL", "32802", "bob@example.com", "timmithy bradshaw", 3500, 0.1, "", "WATCH", "DELIVERED", "purchased client", ""],
      [new Date(2017, 6, 1), "ALICE BROWN", "TAMPA", "FL", "33602", "alice@example.com", "danny devito", 12000, 0.1, "", "AIRPLANE", "IN-TRANSIT", "cold call", ""],
      [new Date(2017, 7, 1), "CHARLIE WHITE", "JACKSONVILLE", "FL", "32100", "charlie@example.com", "alaska thunderfuck", 4500, 0.1, "", "LUGGAGE", "PROCESSING", "client referral", ""],
      [new Date(2017, 8, 1), "DIANA GREEN", "MIAMI", "FL", "33102", "diana@example.com", "just jan", 7000, 0.1, "", "PURSE", "DELIVERED", "purchased client", ""],
      [new Date(2017, 9, 1), "EVE BLACK", "ORLANDO", "FL", "32803", "eve@example.com", "janet mock", 9500, 0.1, "", "WALLET", "IN-TRANSIT", "cold call", ""]
    ];

    if (sales.getLastRow() > 1) {
      const ui = SpreadsheetApp.getUi();
      const r = ui.alert("âš ï¸ Existing Data Found", "Sample data will be appended. Continue?", ui.ButtonSet.YES_NO);
      if (r !== ui.Button.YES) return;
    }

    const startRow = sales.getLastRow() + 1;
    sales.getRange(startRow, 1, sample.length, sample[0].length).setValues(sample);

    SALES_recalculateDerivedColumns();
    SALES_fixBackboneLikeExcel();

    ss.toast(`âœ… Imported ${sample.length} sample records!`, "Import Complete ðŸ“¥", 5);
  });
}

/** =======================================================================
 *  R) SALES CACHE (lightweight) ðŸ§ âš¡
 *  ======================================================================= */

/**
 * Clears lightweight cache keys for the sales system.
 */
function SALES_clearAllCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll([
      SALES_CONFIG.CACHE.KEY_PREFIX + "dropdown_salesPersons",
      SALES_CONFIG.CACHE.KEY_PREFIX + "dropdown_statuses",
      SALES_CONFIG.CACHE.KEY_PREFIX + "dropdown_products",
      SALES_CONFIG.CACHE.KEY_PREFIX + "dropdown_leads"
    ]);
  } catch (err) {
    console.log("Cache clear warning:", err && err.message);
  }
}

/** =======================================================================
 *  S) SALES ERROR LOGGING (optional sheet) ðŸ§¾
 *  ======================================================================= */

/**
 * Logs a sales-related error to _ERROR_LOG.
 * @param {string} action
 * @param {Error} err
 * @param {Object} meta
 * @private
 */
function SALES_logError_(action, err, meta) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = SALES_getOrCreateSheet_(ss, SALES_CONFIG.SHEETS.ERROR_LOG);
    const now = new Date();
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, 6).setValues([["timestamp", "action", "message", "stack", "user", "meta_json"]]);
      sh.setFrozenRows(1);
    }
    const row = [
      now.toISOString(),
      String(action || ""),
      String(err && err.message ? err.message : err),
      String(err && err.stack ? err.stack : ""),
      MASTER_safeUserEmail_(),
      JSON.stringify(meta || {})
    ];
    sh.appendRow(row);
  } catch (e) {
    console.log("SALES_logError_ failed:", e && e.message);
  }
}


/** =======================================================================
 *  T) DEBUG HARNESS ðŸž
 *  ======================================================================= */

const DEBUG_ENABLED = true;

const Debug = (() => {
  const MAX_JSON_CHARS = 9000;

  function nowIso_() { return new Date().toISOString(); }

  function getCircularReplacer_() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      if (value && typeof value === "object") {
        const type = Object.prototype.toString.call(value);
        if (type.includes("Date")) return value;
        if (type.includes("Object")) return value;
        if (String(value).match(/Class|Service|Range|Sheet|Spreadsheet/i)) return String(value);
      }
      return value;
    };
  }

  function stringifySafe(value) {
    try {
      if (typeof value === "string") return value;
      const json = JSON.stringify(value, getCircularReplacer_(), 2);
      if (json && json.length > MAX_JSON_CHARS) return json.slice(0, MAX_JSON_CHARS) + "â€¦(truncated)";
      return json;
    } catch (e) {
      return `[Unstringifiable: ${Object.prototype.toString.call(value)}]`;
    }
  }

  function log_(...args) {
    if (!DEBUG_ENABLED) return;
    const msg = args.map(a => stringifySafe(a)).join(" ");
    console.log(`[${nowIso_()}] ${msg}`);
  }

  function info(...args) { log_("â„¹ï¸", ...args); }
  function warn(...args) { log_("âš ï¸", ...args); }
  function error(...args) { log_("âŒ", ...args); }

  function formatError(e) {
    return { name: e && e.name, message: e && e.message, stack: e && e.stack };
  }

  function time(label, fn) {
    const start = Date.now();
    info(`â±ï¸ START: ${label}`);
    try {
      const result = fn();
      info(`âœ… END: ${label} (${Date.now() - start} ms)`);
      return result;
    } catch (e) {
      error(`ðŸ’¥ FAIL: ${label} (${Date.now() - start} ms)`, formatError(e));
      throw e;
    }
  }

  function run(functionName, ...args) {
    if (!functionName || typeof functionName !== "string") {
      throw new Error("Debug.run(functionName, ...args) requires a function name string.");
    }
    const fn = globalThis[functionName];
    if (typeof fn !== "function") throw new Error(`Function "${functionName}" not found on global scope.`);
    return time(`Debug.run -> ${functionName}`, () => fn(...args));
  }

  function envDump() {
    const dump = {
      scriptTimeZone: Session.getScriptTimeZone(),
      user: safeGet_(() => Session.getActiveUser().getEmail()),
      effectiveUser: safeGet_(() => Session.getEffectiveUser().getEmail()),
      locale: Session.getActiveUserLocale()
    };
    const ss = safeGet_(() => SpreadsheetApp.getActiveSpreadsheet());
    if (ss) {
      dump.spreadsheet = {
        id: ss.getId(),
        name: ss.getName(),
        url: ss.getUrl(),
        activeSheet: safeGet_(() => ss.getActiveSheet().getName())
      };
    }
    info("ðŸ§¾ ENV DUMP:", dump);
    return dump;
  }

  function safeGet_(fn) {
    try { return fn(); } catch (e) { return `Unavailable (${e.message})`; }
  }

  function withDocumentLock(fn, timeoutMs = 30000) {
    const lock = LockService.getDocumentLock();
    const locked = lock.tryLock(timeoutMs);
    if (!locked) throw new Error(`Could not acquire document lock within ${timeoutMs}ms.`);
    try { return fn(); } finally { lock.releaseLock(); }
  }

  return { info, warn, error, time, run, envDump, withDocumentLock, formatError };
})();

function DEBUG_menuEnvDump() { Debug.envDump(); }
function DEBUG_runSalesInit() { Debug.run("SALES_initializeDashboardStructure"); }
function DEBUG_runMasterInit() { Debug.run("MASTER_initManually"); }
function DEBUG_runSampleImport() { Debug.run("SALES_importSampleData"); }
function DEBUG_runFixBackbone() { Debug.run("SALES_fixBackboneLikeExcel"); }

/** =======================================================================
 *  U) MASTER AUTOMATION FRAMEWORK (logging + UI + link/folder managers) âš™ï¸âœ¨
 *  ======================================================================= */

function MASTER_initManually() {
  MASTER_ensureInitialized_({ reason: "manual" });
}

/**
 * Ensures master framework is initialized (dashboard sheet, formatting, triggers).
 * @param {Object} meta
 */
function MASTER_ensureInitialized_(meta) {
  const props = PropertiesService.getDocumentProperties();
  const isInit = props.getProperty("MASTER_INIT_DONE") === "true";
  if (isInit) return;

  const perf = MASTER_perfStart_();
  try {
    MASTER_ensureDashboardSheet_();
    MASTER_applyDashboardFormatting_();
    MASTER_ensureTriggers_();

    props.setProperty("MASTER_INIT_DONE", "true");
    props.setProperty("MASTER_INIT_AT_ISO", MASTER_nowIsoMs_());
    props.setProperty("MASTER_INIT_AT_EPOCH_MS", String(Date.now()));

    MASTER_logEvent_({
      eventType: "system",
      action: "initialize_framework",
      status: "success",
      durationMs: MASTER_perfEnd_(perf),
      meta: meta || {}
    });

    if (MASTER_CONFIG.ENABLE_TOASTS) {
      SpreadsheetApp.getActive().toast("âœ… Master framework initialized!", "Master Automation âœ¨", 4);
    }
  } catch (err) {
    MASTER_logEvent_({
      eventType: "system",
      action: "initialize_framework",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err,
      meta: meta || {}
    });
    throw err;
  }
}

/**
 * Unified logging wrapper.
 * @param {string} eventType
 * @param {string} action
 * @param {Function} fn
 * @return {*}
 * @private
 */
function MASTER_runWithLogging_(eventType, action, fn) {
  const perf = MASTER_perfStart_();
  try {
    const out = fn();
    MASTER_logEvent_({
      eventType: String(eventType || "task"),
      action: String(action || "run"),
      status: "success",
      durationMs: MASTER_perfEnd_(perf)
    });
    return out;
  } catch (err) {
    MASTER_logEvent_({
      eventType: String(eventType || "task"),
      action: String(action || "run"),
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
    throw err;
  }
}

/** --------------------------
 *  Navigation / Link actions
 *  -------------------------- */
function MASTER_openColab() { MASTER_openLinkKey_("COLAB", { from: "menu" }); }
function MASTER_openGitHub() { MASTER_openLinkKey_("GITHUB", { from: "menu" }); }
function MASTER_openWebAppLink() { MASTER_openLinkKey_("WEBAPP", { from: "menu" }); }

function MASTER_openDeploymentHub() {
  const url = MASTER_getLink_("WEBAPP");
  if (url) {
    MASTER_openUrlDirect_(url, "ðŸš€ Web App");
    return;
  }
  MASTER_openUrlDirect_("https://script.google.com/home", "ðŸš€ Deployment Hub");
}

function MASTER_openFolderManager() { MASTER_showFolderManagerDialog(); }

function MASTER_openDashboard() {
  const perf = MASTER_perfStart_();
  try {
    MASTER_ensureDashboardSheet_();
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(MASTER_CONFIG.DASHBOARD_SHEET_NAME);
    ss.setActiveSheet(sheet);

    MASTER_logEvent_({
      eventType: "navigation",
      action: "open_master_dashboard_sheet",
      status: "success",
      durationMs: MASTER_perfEnd_(perf),
      meta: { from: "menu" }
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "navigation",
      action: "open_master_dashboard_sheet",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err,
      meta: { from: "menu" }
    });
    throw err;
  }
}

/**
 * Opens link by key; if missing opens link manager dialog.
 * @param {string} key
 * @param {Object} meta
 */
function MASTER_openLinkKey_(key, meta) {
  const perf = MASTER_perfStart_();
  try {
    const url = MASTER_getLink_(key);
    if (!url) {
      MASTER_logEvent_({
        eventType: "navigation",
        action: `open_link_missing_${key}`,
        status: "warning",
        durationMs: MASTER_perfEnd_(perf),
        meta: meta || {}
      });
      MASTER_showLinkManagerDialog();
      return;
    }

    MASTER_openUrlDirect_(url, `ðŸ”— ${key}`);
    MASTER_logEvent_({
      eventType: "navigation",
      action: `open_link_${key}`,
      status: "success",
      durationMs: MASTER_perfEnd_(perf),
      meta: Object.assign({ url: url }, meta || {})
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "navigation",
      action: `open_link_${key}`,
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err,
      meta: meta || {}
    });
    throw err;
  }
}

/**
 * Opens a URL in a small dialog that triggers window.open.
 * @param {string} url
 * @param {string} title
 * @private
 */
function MASTER_openUrlDirect_(url, title) {
  const safeUrl = String(url || "").trim();
  if (!safeUrl) return;

  const html = HtmlService.createHtmlOutput(
    `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:system-ui;margin:16px;">
  <div>ðŸ”— Openingâ€¦</div>
  <script>
    (function(){
      var url = ${JSON.stringify(safeUrl)};
      try { window.open(url, "_blank", "noopener,noreferrer"); } catch(e) {}
      setTimeout(function(){ google.script.host.close(); }, 150);
    })();
  </script>
</body></html>`
  ).setWidth(260).setHeight(90);

  SpreadsheetApp.getUi().showModelessDialog(html, title || "Open Link");
}

/** --------------------------
 *  UI: Sidebar + Dialogs
 *  -------------------------- */

/**
 * Shows the Sidebar UI.
 */
function MASTER_showSidebar() {
  const perf = MASTER_perfStart_();
  try {
    const html = MASTER_renderUi_("sidebar");
    SpreadsheetApp.getUi().showSidebar(html);

    MASTER_logEvent_({
      eventType: "ui",
      action: "show_sidebar",
      status: "success",
      durationMs: MASTER_perfEnd_(perf),
      meta: { from: "menu" }
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "ui",
      action: "show_sidebar",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err,
      meta: { from: "menu" }
    });
    throw err;
  }
}

/**
 * Shows the About dialog.
 */
function MASTER_showAboutDialog() {
  const perf = MASTER_perfStart_();
  try {
    const html = MASTER_renderUi_("about").setWidth(520).setHeight(520);
    SpreadsheetApp.getUi().showModalDialog(html, "ðŸ’¡ About GAS Master Suite");

    MASTER_logEvent_({
      eventType: "ui",
      action: "show_about_dialog",
      status: "success",
      durationMs: MASTER_perfEnd_(perf)
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "ui",
      action: "show_about_dialog",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
    throw err;
  }
}

/**
 * Shows recent logs dialog.
 */
function MASTER_showRecentLogsDialog() {
  const perf = MASTER_perfStart_();
  try {
    const html = MASTER_renderUi_("logs").setWidth(820).setHeight(560);
    SpreadsheetApp.getUi().showModalDialog(html, "ðŸ§¾ Recent Activity");

    MASTER_logEvent_({
      eventType: "ui",
      action: "show_recent_logs_dialog",
      status: "success",
      durationMs: MASTER_perfEnd_(perf)
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "ui",
      action: "show_recent_logs_dialog",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
    throw err;
  }
}

/**
 * Shows link manager dialog.
 */
function MASTER_showLinkManagerDialog() {
  const perf = MASTER_perfStart_();
  try {
    const html = MASTER_renderUi_("links").setWidth(600).setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(html, "ðŸ”— Link Manager");

    MASTER_logEvent_({
      eventType: "ui",
      action: "show_link_manager_dialog",
      status: "success",
      durationMs: MASTER_perfEnd_(perf)
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "ui",
      action: "show_link_manager_dialog",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
    throw err;
  }
}

/**
 * Shows folder manager dialog.
 */
function MASTER_showFolderManagerDialog() {
  const perf = MASTER_perfStart_();
  try {
    const html = MASTER_renderUi_("folders").setWidth(600).setHeight(560);
    SpreadsheetApp.getUi().showModalDialog(html, "ðŸ—‚ï¸ Folder Manager");

    MASTER_logEvent_({
      eventType: "ui",
      action: "show_folder_manager_dialog",
      status: "success",
      durationMs: MASTER_perfEnd_(perf)
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "ui",
      action: "show_folder_manager_dialog",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
    throw err;
  }
}

/**
 * Renders the UI HTML from UI.html template.
 * @param {"webapp"|"sidebar"|"about"|"links"|"logs"|"folders"} surface
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 * @private
 */
function MASTER_renderUi_(surface) {
  const t = HtmlService.createTemplateFromFile("UI");
  const data = MASTER_configForUi_();
  t.appDataJson = JSON.stringify({
    surface: String(surface || "sidebar"),
    theme: data.theme,
    links: data.links,
    brand: data.brand,
    menuName: data.menuName
  });
  const html = t.evaluate();
  html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

/** --------------------------
 *  Logging Dashboard Sheet
 *  -------------------------- */

/**
 * Ensures the Master Dashboard sheet exists and has correct headers.
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 * @private
 */
function MASTER_ensureDashboardSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(MASTER_CONFIG.DASHBOARD_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(MASTER_CONFIG.DASHBOARD_SHEET_NAME);

  const headers = MASTER_dashboardHeaders_();
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = firstRow.join("").trim() !== headers.join("").trim();
  if (needsHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.setFrozenRows(MASTER_CONFIG.DASHBOARD_FREEZE_ROWS);

  const lastCol = headers.length;
  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), lastCol).createFilter();
  }

  sheet.setColumnWidths(1, 3, 160);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 220);
  sheet.setColumnWidth(7, 220);
  sheet.setColumnWidth(8, 110);
  sheet.setColumnWidth(9, 120);
  sheet.setColumnWidth(10, 160);
  sheet.setColumnWidth(11, 280);
  sheet.setColumnWidth(12, 380);
  sheet.setColumnWidth(13, 320);

  return sheet;
}

function MASTER_dashboardHeaders_() {
  return [
    "timestamp_iso_ms",
    "date_local",
    "time_local",
    "epoch_ms",
    "event_type",
    "action",
    "user",
    "status",
    "duration_ms",
    "quota_hint",
    "error_message",
    "stack_trace",
    "meta_json"
  ];
}

/**
 * Applies formatting and conditional rules to the master dashboard.
 * @private
 */
function MASTER_applyDashboardFormatting_() {
  const sheet = MASTER_ensureDashboardSheet_();
  const headers = MASTER_dashboardHeaders_();
  const headerRange = sheet.getRange(1, 1, 1, headers.length);

  headerRange.setFontWeight("bold").setBackground("#111827").setFontColor("#F9FAFB");

  const statusCol = 8;
  const newRules = [];

  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("success")
      .setBackground(MASTER_CONFIG.THEME.SUCCESS)
      .setFontColor("#0B1220")
      .setRanges([sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1)])
      .build()
  );

  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("warning")
      .setBackground(MASTER_CONFIG.THEME.WARNING)
      .setFontColor("#0B1220")
      .setRanges([sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1)])
      .build()
  );

  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("failure")
      .setBackground(MASTER_CONFIG.THEME.DANGER)
      .setFontColor("#F9FAFB")
      .setRanges([sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1)])
      .build()
  );

  sheet.setConditionalFormatRules(newRules);
  sheet.setRowHeights(2, Math.min(sheet.getMaxRows() - 1, 200), 24);
}

/**
 * Appends a log event to the master dashboard.
 * @param {Object} payload
 * @private
 */
function MASTER_logEvent_(payload) {
  const sheet = MASTER_ensureDashboardSheet_();
  const now = new Date();
  const iso = MASTER_nowIsoMs_(now);
  const epochMs = now.getTime();

  const dateLocal = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const timeLocal = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
  const user = MASTER_safeUserEmail_();

  const row = [
    iso,
    dateLocal,
    timeLocal,
    epochMs,
    String(payload && payload.eventType ? payload.eventType : "unknown"),
    String(payload && payload.action ? payload.action : "unknown"),
    user,
    String(payload && payload.status ? payload.status : "success"),
    (typeof payload && payload.durationMs === "number") ? payload.durationMs : (payload && typeof payload.durationMs === "number" ? payload.durationMs : ""),
    MASTER_quotaHint_(),
    payload && payload.error ? MASTER_errorMessage_(payload.error) : "",
    payload && payload.error ? MASTER_errorStack_(payload.error) : "",
    JSON.stringify(payload && payload.meta ? payload.meta : {})
  ];

  sheet.appendRow(row);

  if (MASTER_CONFIG.LOG_AUTO_TRIM_ENABLED) MASTER_trimLogsIfNeeded_(sheet);
}

/**
 * Trims logs above max rows.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @private
 */
function MASTER_trimLogsIfNeeded_(sheet) {
  const max = MASTER_CONFIG.LOG_MAX_ROWS;
  if (!max || max < 1000) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= max) return;

  const rowsToDelete = lastRow - max;
  if (rowsToDelete > 0) sheet.deleteRows(2, rowsToDelete);
}

/**
 * Ensures installable triggers.
 * @private
 */
function MASTER_ensureTriggers_() {
  if (!MASTER_CONFIG.LOG_INCLUDE_EDIT_EVENTS) return;
  const ss = SpreadsheetApp.getActive();
  const triggers = ScriptApp.getProjectTriggers();
  const hasEdit = triggers.some(t => t.getHandlerFunction() === "MASTER_onEditHandler");
  if (!hasEdit) {
    ScriptApp.newTrigger("MASTER_onEditHandler").forSpreadsheet(ss).onEdit().create();
  }
}

/**
 * Installable trigger handler for edit logging.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 */
function MASTER_onEditHandler(e) {
  const perf = MASTER_perfStart_();
  try {
    const sheetName = e && e.range ? e.range.getSheet().getName() : "";
    const a1 = e && e.range ? e.range.getA1Notation() : "";
    const oldValue = (e && typeof e.oldValue !== "undefined") ? e.oldValue : "";
    const value = e && e.range ? e.range.getDisplayValue() : "";

    MASTER_logEvent_({
      eventType: "edit",
      action: "sheet_edit",
      status: "success",
      durationMs: MASTER_perfEnd_(perf),
      meta: { sheet: sheetName, range: a1, oldValue: oldValue, newValue: value }
    });
  } catch (err) {
    MASTER_logEvent_({
      eventType: "edit",
      action: "sheet_edit",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
  }
}

/** --------------------------
 *  Link + Folder APIs for UI
 *  -------------------------- */

function MASTER_getLink_(key) {
  const props = PropertiesService.getDocumentProperties();
  const stored = props.getProperty(`MASTER_LINK_${key}`);
  if (stored !== null && stored !== undefined) return String(stored).trim();
  return String((MASTER_CONFIG.LINKS && MASTER_CONFIG.LINKS[key]) || "").trim();
}

function MASTER_setLink_(key, url) {
  const perf = MASTER_perfStart_();
  try {
    const cleanKey = String(key || "").trim().toUpperCase();
    const cleanUrl = String(url || "").trim();
    PropertiesService.getDocumentProperties().setProperty(`MASTER_LINK_${cleanKey}`, cleanUrl);

    MASTER_logEvent_({
      eventType: "config",
      action: `set_link_${cleanKey}`,
      status: "success",
      durationMs: MASTER_perfEnd_(perf),
      meta: { url: cleanUrl }
    });

    if (MASTER_CONFIG.ENABLE_TOASTS) SpreadsheetApp.getActive().toast(`âœ… Saved link for ${cleanKey}`, "Link Manager ðŸ”—", 3);
    return { ok: true };
  } catch (err) {
    MASTER_logEvent_({
      eventType: "config",
      action: "set_link",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err,
      meta: { key: key, url: url }
    });
    return { ok: false, message: MASTER_errorMessage_(err) };
  }
}

function MASTER_resetLinks() {
  const perf = MASTER_perfStart_();
  try {
    const props = PropertiesService.getDocumentProperties();
    Object.keys(MASTER_CONFIG.LINKS).forEach(k => props.deleteProperty(`MASTER_LINK_${k}`));

    MASTER_logEvent_({
      eventType: "config",
      action: "reset_links",
      status: "success",
      durationMs: MASTER_perfEnd_(perf)
    });

    if (MASTER_CONFIG.ENABLE_TOASTS) SpreadsheetApp.getActive().toast("ðŸ”„ Links reset to blank defaults", "Link Manager ðŸ”—", 3);
  } catch (err) {
    MASTER_logEvent_({
      eventType: "config",
      action: "reset_links",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
    throw err;
  }
}

function MASTER_apiGetLinks() {
  const links = {};
  Object.keys(MASTER_CONFIG.LINKS).forEach(k => (links[k] = MASTER_getLink_(k)));
  return { ok: true, links: links, theme: MASTER_CONFIG.THEME, menuName: MASTER_CONFIG.MENU_NAME };
}

function MASTER_apiSetLink(payload) {
  const key = payload && payload.key ? payload.key : "";
  const url = payload && payload.url ? payload.url : "";
  return MASTER_setLink_(key, url);
}

/**
 * Creates a tidy Drive folder structure under PARENT_FOLDER (or root).
 * @return {{ok:boolean,folderId?:string,folderUrl?:string,folderName?:string,message?:string}}
 */
function MASTER_createProjectFolder() {
  const perf = MASTER_perfStart_();
  try {
    const ss = SpreadsheetApp.getActive();
    const name = ss.getName();
    const parentId = MASTER_getLink_("PARENT_FOLDER");
    const parent = parentId ? DriveApp.getFolderById(parentId) : DriveApp.getRootFolder();
    const projectFolder = parent.createFolder(`ðŸ—‚ï¸ ${name} â€” Project Assets`);

    ["ðŸ“¦ Exports", "ðŸ§¾ Logs", "ðŸ§ª Colab", "ðŸ™ GitHub", "ðŸŒ WebApp", "ðŸ—ƒï¸ Archive"].forEach(n => projectFolder.createFolder(n));

    PropertiesService.getDocumentProperties().setProperty("MASTER_PROJECT_FOLDER_ID", projectFolder.getId());

    MASTER_logEvent_({
      eventType: "drive",
      action: "create_project_folder",
      status: "success",
      durationMs: MASTER_perfEnd_(perf),
      meta: { folderId: projectFolder.getId(), folderName: projectFolder.getName() }
    });

    if (MASTER_CONFIG.ENABLE_TOASTS) SpreadsheetApp.getActive().toast("âœ… Project folder created in Drive!", "Folder Manager ðŸ—‚ï¸", 4);

    return { ok: true, folderId: projectFolder.getId(), folderUrl: projectFolder.getUrl(), folderName: projectFolder.getName() };
  } catch (err) {
    MASTER_logEvent_({
      eventType: "drive",
      action: "create_project_folder",
      status: "failure",
      durationMs: MASTER_perfEnd_(perf),
      error: err
    });
    return { ok: false, message: MASTER_errorMessage_(err) };
  }
}

function MASTER_getProjectFolderInfo() {
  const id = PropertiesService.getDocumentProperties().getProperty("MASTER_PROJECT_FOLDER_ID");
  if (!id) return { ok: false, message: "No project folder created yet." };
  try {
    const f = DriveApp.getFolderById(id);
    return { ok: true, folderId: id, folderUrl: f.getUrl(), folderName: f.getName() };
  } catch (err) {
    return { ok: false, message: MASTER_errorMessage_(err) };
  }
}

/**
 * Returns recent logs for UI preview.
 * @param {number} limit
 * @return {Array<Object>}
 */
function MASTER_apiGetRecentLogs(limit) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(MASTER_CONFIG.DASHBOARD_SHEET_NAME);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const headers = MASTER_dashboardHeaders_();
  const n = Math.max(1, Math.min(Number(limit || 30), 200));
  const startRow = Math.max(2, lastRow - n + 1);
  const numRows = lastRow - startRow + 1;

  const values = sheet.getRange(startRow, 1, numRows, headers.length).getValues();
  values.reverse();

  return values.map(r => ({
    timestamp: r[0],
    eventType: r[4],
    action: r[5],
    user: r[6],
    status: r[7],
    meta: r[12]
  }));
}

/** --------------------------
 *  UI Config object for template
 *  -------------------------- */
function MASTER_configForUi_() {
  return {
    theme: MASTER_CONFIG.THEME,
    links: (() => {
      const out = {};
      Object.keys(MASTER_CONFIG.LINKS).forEach(k => (out[k] = MASTER_getLink_(k)));
      return out;
    })(),
    brand: MASTER_CONFIG.THEME.BRAND_NAME,
    menuName: MASTER_CONFIG.MENU_NAME
  };
}

/** =======================================================================
 *  V) MASTER UTILITIES ðŸ§°
 *  ======================================================================= */
function MASTER_perfStart_() { return Date.now(); }
function MASTER_perfEnd_(startMs) { return Date.now() - Number(startMs || Date.now()); }

function MASTER_nowIsoMs_(d) {
  const dt = d ? new Date(d) : new Date();
  return dt.toISOString();
}

function MASTER_quotaHint_() { return ""; }

function MASTER_safeUserEmail_() {
  try {
    const email = Session.getActiveUser().getEmail();
    if (email) return email;
  } catch (e) { }
  try {
    const email2 = Session.getEffectiveUser().getEmail();
    if (email2) return email2;
  } catch (e) { }
  return "unknown";
}

function MASTER_errorMessage_(err) {
  try {
    if (!err) return "";
    if (typeof err === "string") return err;
    return String(err.message || err);
  } catch (e) {
    return "Unknown error";
  }
}

function MASTER_errorStack_(err) {
  try {
    return err && err.stack ? String(err.stack) : "";
  } catch (e) {
    return "";
  }
}


/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * ðŸ›¡ï¸ðŸŽ¯ GAS MASTER â€” PIXEL-PERFECT DASHBOARD LAYOUT + COMPLETE CHART REBUILDER
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * âœ… Guarantees consistent visuals every run ðŸ”ðŸ“Šâœ¨:
 *   - Column widths + row heights set explicitly ðŸ“ðŸ§±
 *   - Merges applied for consistent header spacing ðŸ§©âœ…
 *   - Trend line chart (B9â†’H28) sized in pixels ðŸ“ˆðŸ–¥ï¸
 *   - Status doughnut chart (I16â†’N26) sized in pixels ðŸ©ðŸ–¥ï¸
 *   - Sparklines rebuilt + aligned ðŸ“Šâœ…
 *
 * âœ… Uses EmbeddedChartBuilder with setPosition + setOption(width/height) ðŸ§ ðŸ› ï¸
 * Ref: Apps Script EmbeddedChart / EmbeddedChartBuilder docs ðŸ§¾âœ…
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

/** =======================================================================
 *  1) PIXEL-PERFECT LAYOUT CONFIG ðŸŽ¯ðŸ“
 *  ======================================================================= */

const GASMASTER_VISUAL_LAYOUT = {
  MONTHLY: {
    sheetName: "MONTHLY DASHBOARD",
    maxSparkRows: 800,
    // ðŸ“ˆ Trend chart anchor + pixel size
    trend: { anchorA1: "B9", spanA1: "B9:H28", widthPx: 497, heightPx: 403, title: "GASMASTER: Sales by Month ðŸ“ˆ" },
    // ðŸ© Doughnut chart anchor + pixel size
    doughnut: { anchorA1: "I16", spanA1: "I16:N26", widthPx: 402, heightPx: 227, title: "GASMASTER: Status Breakdown ðŸ©" },
    // Helper table locations (hidden columns)
    helper: { trendA1: "X1:Z900", statusA1: "AA1:AB600" }
  },

  WEEKLY: {
    sheetName: "WEEKLY DASHBOARD",
    maxSparkRows: 1200,
    trend: { anchorA1: "B9", spanA1: "B9:H28", widthPx: 497, heightPx: 403, title: "GASMASTER: Sales by Week ðŸ“ˆ" },
    doughnut: { anchorA1: "I16", spanA1: "I16:N26", widthPx: 402, heightPx: 227, title: "GASMASTER: Status Breakdown ðŸ©" },
    helper: { trendA1: "X1:Z1400", statusA1: "AA1:AB900" }
  }
};

/** =======================================================================
 *  2) ONE-CLICK RUNNER ðŸš€ðŸ“Š
 *  ======================================================================= */

/**
 * âœ… Runs pixel-perfect layout + charts + sparklines for BOTH dashboards ðŸš€ðŸ“Šâœ¨
 */
function SALES_rebuildAllDashboardVisuals_PixelPerfect() {
  return MASTER_runWithLogging_("visuals", "rebuild_visuals_pixel_perfect", () => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    Object.keys(GASMASTER_VISUAL_LAYOUT).forEach(k => {
      const cfg = GASMASTER_VISUAL_LAYOUT[k];
      const sh = ss.getSheetByName(cfg.sheetName);
      if (!sh) return;

      // 1) ðŸ“ Apply layout grid (widths/heights/merges)
      GASMASTER_applyPixelPerfectGrid_(sh);

      // 2) ðŸ§  Build helper tables (keeps charts accurate + predictable)
      GASMASTER_buildHelperTables_(sh, cfg);

      // 3) ðŸ“Š Rebuild charts (managed only)
      GASMASTER_rebuildManagedCharts_(sh, cfg);

      // 4) ðŸ“Š Rebuild sparklines (aligned bars)
      GASMASTER_rebuildSparklines_(sh, cfg.maxSparkRows);
    });

    ss.toast("âœ… Pixel-perfect visuals rebuilt (layout + charts + sparklines)!", "Done ðŸŽ‰", 5);
  });
}

/** =======================================================================
 *  3) GRID SYSTEM (COLUMN WIDTHS + ROW HEIGHTS + MERGES) ðŸ§±ðŸ“
 *  ======================================================================= */

/**
 * âœ… Applies deterministic column widths + row heights so chart spans are consistent ðŸŽ¯ðŸ“
 * Notes:
 * - Charts are placed using setPosition(anchorRow, anchorCol, offsetX, offsetY) ðŸ§­
 * - Chart size is set via setOption('width'/'height') ðŸ–¥ï¸
 */
function GASMASTER_applyPixelPerfectGrid_(sh) {
  // ðŸ§± Column widths (Aâ€“T) tuned so:
  // - B..H total width = 7*71 = 497 px âœ…
  // - I..N total width = 6*67 = 402 px âœ…
  const colPx = {
    A: 28,
    B: 71, C: 71, D: 71, E: 71, F: 71, G: 71, H: 71,
    I: 67, J: 67, K: 67, L: 67, M: 67, N: 67,
    O: 24,
    P: 67, Q: 67, R: 67, S: 67,
    T: 60
  };

  Object.keys(colPx).forEach(letter => {
    sh.setColumnWidth(GASMASTER_colLetterToIndex_(letter), colPx[letter]);
  });

  // ðŸ§± Row heights tuned so:
  // - Rows 9..28: 20px each -> ~400px area for the trend chart âœ…
  // - Rows 16..26: 21px each -> ~231px area for doughnut region âœ…
  GASMASTER_setRowHeights_(sh, 1, 4, 18);
  GASMASTER_setRowHeights_(sh, 5, 8, 20);
  GASMASTER_setRowHeights_(sh, 9, 28, 20);
  GASMASTER_setRowHeights_(sh, 16, 26, 21);
  GASMASTER_setRowHeights_(sh, 29, 60, 18);

  // ðŸ§© Optional merges to stabilize header spacing (safe, idempotent) âœ…
  GASMASTER_safeMerge_(sh, "B2:H2");      // Title span âœ…
  GASMASTER_safeMerge_(sh, "I9:N9");      // Status header band area âœ…
  GASMASTER_safeMerge_(sh, "P9:T9");      // Lead header band area âœ…
}

/**
 * âœ… Sets row heights in bulk ðŸ§±âš¡
 */
function GASMASTER_setRowHeights_(sh, startRow, endRow, px) {
  const n = Math.max(0, endRow - startRow + 1);
  if (n <= 0) return;
  sh.setRowHeights(startRow, n, px);
}

/**
 * âœ… Safe merge helper ðŸ§©ðŸ›¡ï¸
 */
function GASMASTER_safeMerge_(sh, a1) {
  try {
    const r = sh.getRange(a1);
    if (!r.isPartOfMerge()) r.merge();
  } catch (e) {
    // ignored on purpose âœ…
  }
}

/** =======================================================================
 *  4) HELPER TABLES (HIDDEN) ðŸ§ ðŸ“‹
 *  ======================================================================= */

/**
 * âœ… Builds hidden helper tables so charts are always accurate + consistent ðŸ“Šâœ…
 */
function GASMASTER_buildHelperTables_(sh, cfg) {
  // Trend helper table: PERIOD | TOTAL SALES | NUM OF SALES ðŸ“ˆâœ…
  // Source: existing dashboard query output:
  // - Period:  C32:C
  // - Num:     D32:D
  // - Total:   F32:F
  const trendFormula =
    '={"PERIOD","TOTAL SALES","NUM OF SALES";' +
    'FILTER({C32:C2000,F32:F2000,D32:D2000},C32:C2000<>"")' +
    "}";

  const trendTopLeft = cfg.helper.trendA1.split(":")[0]; // e.g. X1
  sh.getRange(trendTopLeft).setFormula(trendFormula);
  sh.getRange(cfg.helper.trendA1).setNumberFormat("yyyy-mm-dd"); // safe default âœ…

  // Status helper table: STATUS | TOTAL SALES ðŸ©âœ…
  // Source: I11:I (labels), L11:L (values)
  const statusFormula =
    '={"STATUS","TOTAL SALES";' +
    'FILTER({I11:I2000,L11:L2000},I11:I2000<>"")' +
    "}";

  const statusTopLeft = cfg.helper.statusA1.split(":")[0]; // e.g. AA1
  sh.getRange(statusTopLeft).setFormula(statusFormula);

  // Hide helper columns so layout stays clean ðŸ§¼âœ…
  // X=24, Y=25, Z=26, AA=27, AB=28
  try {
    const maxCol = sh.getMaxColumns();
    if (maxCol >= 28) {
      sh.hideColumns(24, 5);
    } else {
      sh.insertColumnsAfter(maxCol, 28 - maxCol);
      sh.hideColumns(24, 5);
    }
  } catch (e) {
    Logger.log("Could not hide helper columns: " + e.message);
  }
}

/** =======================================================================
 *  5) CHART REBUILDER (MANAGED) ðŸŽ¯ðŸ“Š
 *  ======================================================================= */

/**
 * âœ… Removes only GASMASTER charts (by title prefix), then rebuilds them ðŸ”âœ…
 */
function GASMASTER_rebuildManagedCharts_(sh, cfg) {
  GASMASTER_removeManagedCharts_(sh);

  GASMASTER_buildTrendLineChart_(sh, cfg);
  GASMASTER_buildStatusDoughnutChart_(sh, cfg);
}

/**
 * âœ… Removes charts created by this system only ðŸ§¼âœ…
 */
function GASMASTER_removeManagedCharts_(sh) {
  const charts = sh.getCharts() || [];
  charts.forEach(ch => {
    try {
      const t = (ch.getOptions && ch.getOptions().title) ? String(ch.getOptions().title) : "";
      if (t.startsWith("GASMASTER:")) sh.removeChart(ch);
    } catch (e) {
      // leave unknown charts untouched âœ…
    }
  });
}

/**
 * âœ… Builds trend line chart anchored at B9 with pixel size locked ðŸ“ˆðŸ–¥ï¸
 * Uses helper table at X1:Z (PERIOD | TOTAL | NUM) âœ…
 */
function GASMASTER_buildTrendLineChart_(sh, cfg) {
  const a = GASMASTER_a1ToRowCol_(cfg.trend.anchorA1);

  // Data range: X1:Z (header + rows) âœ…
  const dataRange = sh.getRange(cfg.helper.trendA1);

  const chart = sh.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dataRange)
    .setNumHeaders(1)
    .setOption("title", cfg.trend.title)
    .setOption("useFirstColumnAsDomain", true)
    .setOption("legend", { position: "right" })
    .setOption("width", cfg.trend.widthPx)
    .setOption("height", cfg.trend.heightPx)
    .setPosition(a.row, a.col, 0, 0)
    .build();

  sh.insertChart(chart);
}

/**
 * âœ… Builds status doughnut chart anchored at I16 with pixel size locked ðŸ©ðŸ–¥ï¸
 * Uses helper table at AA1:AB (STATUS | TOTAL SALES) âœ…
 */
function GASMASTER_buildStatusDoughnutChart_(sh, cfg) {
  const a = GASMASTER_a1ToRowCol_(cfg.doughnut.anchorA1);

  const dataRange = sh.getRange(cfg.helper.statusA1);

  const chart = sh.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dataRange)
    .setNumHeaders(1)
    .setOption("title", cfg.doughnut.title)
    .setOption("pieHole", 0.55)
    .setOption("legend", { position: "right" })
    .setOption("width", cfg.doughnut.widthPx)
    .setOption("height", cfg.doughnut.heightPx)
    .setPosition(a.row, a.col, 0, 0)
    .build();

  sh.insertChart(chart);
}

/** =======================================================================
 *  6) SPARKLINES (BAR) ðŸ“Šâœ…
 *  ======================================================================= */

/**
 * âœ… Rebuilds bar sparklines in the same columns as your dashboard design ðŸ“ŠðŸ§­
 */
function GASMASTER_rebuildSparklines_(sh, maxRows) {
  // STATUS bars (L -> M)
  sh.getRange("M10").setValue("BAR").setFontWeight("bold");
  sh.getRange("M11").setFormula(`=IFERROR(SPARKLINE(L11,{"charttype","bar";"max",MAX($L$11:$L$${maxRows})}),"")`);
  sh.getRange("M11").copyTo(sh.getRange(`M11:M${maxRows}`), { contentsOnly: false });

  // LEAD bars (S -> T)
  sh.getRange("T10").setValue("BAR").setFontWeight("bold");
  sh.getRange("T11").setFormula(`=IFERROR(SPARKLINE(S11,{"charttype","bar";"max",MAX($S$11:$S$${maxRows})}),"")`);
  sh.getRange("T11").copyTo(sh.getRange(`T11:T${maxRows}`), { contentsOnly: false });

  // AGENT bars (L -> M)
  sh.getRange("M31").setValue("BAR").setFontWeight("bold");
  sh.getRange("M32").setFormula(`=IFERROR(SPARKLINE(L32,{"charttype","bar";"max",MAX($L$32:$L$${maxRows})}),"")`);
  sh.getRange("M32").copyTo(sh.getRange(`M32:M${maxRows}`), { contentsOnly: false });

  // PRODUCT bars (S -> T)
  sh.getRange("T31").setValue("BAR").setFontWeight("bold");
  sh.getRange("T32").setFormula(`=IFERROR(SPARKLINE(S32,{"charttype","bar";"max",MAX($S$32:$S$${maxRows})}),"")`);
  sh.getRange("T32").copyTo(sh.getRange(`T32:T${maxRows}`), { contentsOnly: false });
}

/** =======================================================================
 *  7) SMALL UTILITIES ðŸ§°âœ…
 *  ======================================================================= */

function GASMASTER_colLetterToIndex_(letter) {
  let col = 0;
  const s = String(letter || "").toUpperCase();
  for (let i = 0; i < s.length; i++) col = col * 26 + (s.charCodeAt(i) - 64);
  return col;
}

/**
 * âœ… Converts A1 like "B9" into {row:9, col:2} ðŸ§­âœ…
 */
function GASMASTER_a1ToRowCol_(a1) {
  const m = String(a1 || "").match(/^([A-Za-z]+)(\d+)$/);
  if (!m) throw new Error("Invalid A1: " + a1);
  return { col: GASMASTER_colLetterToIndex_(m[1]), row: Number(m[2]) };
}
