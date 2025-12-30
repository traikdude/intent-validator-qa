# 🧙🏾‍♂️ Intent Validator QA for Google Sheets ✅

**A high-performance, batch-processing engine for validating automation intent classification in Google Sheets.**

[![Google Apps Script](https://img.shields.io/badge/Built%20with-Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google-drive)](https://developers.google.com/apps-script)
[![Status](https://img.shields.io/badge/Status-Active%20%26%20Optimized-success?style=for-the-badge)]()

---

## 🎯 Project Overview

The **Intent Validator QA** tool automates the quality assurance process for integration intent mapping. It scans your Google Sheet for trigger phrases, compares them against a central rules engine (`intent_rules.json` stored in Drive), and flags any mismatches between the **Current Action** and the **Predicted Action**.

This tool is designed for speed and scalability, using **Batch Processing** to handle thousands of rows in seconds without hitting Google's execution limits. ⚡💨

### 🔗 [Live Google Sheet](https://docs.google.com/spreadsheets/d/1DO9SUFmOwTPFvnvUks8-hhBxqzMYl3hhTGlBJ3fsMxQ/edit)

---

## ✨ Key Features

*   **⚡ Batch Optimization**: Reads entire sheets in a single API call, processing data in-memory for blazing-fast performance.
*   **📊 Auto-Dashboard**: Automatically generates a "QA – Dashboard" sheet with summary statistics and visual bar charts of mismatch rates.
*   **🧠 Rule-Based Logic**: Uses a central JSON configuration file in Google Drive to define intent classification rules.
*   **🔍 Precision Scanning**: targeted validation that ignores irrelevant sheets and focuses only on "Connected App/Integration" data.
*   **🛡️ Legacy Protection**: Automatically skips sheets marked with `(Legacy)` to preserve historical data.

---

## 🛠️ How to Use

1.  **Open the Sheet**: Go to the [Live Google Sheet](https://docs.google.com/spreadsheets/d/1DO9SUFmOwTPFvnvUks8-hhBxqzMYl3hhTGlBJ3fsMxQ/edit).
2.  **Locate the Menu**: Look for the **"Validation ⚡"** menu in the top toolbar (wait a few seconds after loading).
3.  **Run Audit**:
    *   Select **Run Full Intent Audit 🧪** to scan all valid sheets.
    *   Select **Validate Active Sheet Only 📄** for a quick check on your current tab.
4.  **View Results**:
    *   Detailed row-by-row logs are generated in the **"QA – Intent Validation Report"** tab.
    *   A high-level visual summary is created in the **"QA – Dashboard 📊"** tab.

---

## ⚙️ Configuration

The system is powered by a `intent_rules.json` file stored in Google Drive. This file dictates the logic for classifying triggers.

**File Structure (`intent_rules.json`):**
```json
{
  "actions_order": ["Create Record", "Update Record", "Search/Query"],
  "rules": {
    "Create Record": ["new", "add", "create", "insert"],
    "Update Record": ["change", "update", "modify", "edit"],
    "Search/Query": ["find", "search", "get", "lookup"]
  }
}
```

---

## 👨‍💻 Development

This project is managed via `clasp` and `git`.

*   **Push updates**: `clasp push`
*   **Pull updates**: `clasp pull`
*   **Open editor**: `clasp open`

---

*Generated with ❤️ by Gemini CLI*
