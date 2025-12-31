const assert = require('assert');
const { describe, it } = require('node:test');

// Import the module (will be available after refactor)
// We wrap in try-catch to allow the test file to exist before the refactor is complete
let codeModule;
try {
    codeModule = require('../Code.gs');
} catch (e) {
    console.error("Code.gs not yet refactored to export module.");
    process.exit(1);
}

const { normalizeHeader_, classifyAction_, isIntegrationSheet_, headerMap_ } = codeModule;

describe('Intent Validator Logic', () => {

    describe('normalizeHeader_', () => {
        it('should lowercase and strip non-alphanumeric characters', () => {
            assert.strictEqual(normalizeHeader_("Trigger Phrase"), "triggerphrase");
            assert.strictEqual(normalizeHeader_("Action Type (Intent)"), "actiontypeintent");
            assert.strictEqual(normalizeHeader_("   Spaced   Input   "), "spacedinput");
            assert.strictEqual(normalizeHeader_("123 Testing!"), "123testing");
        });

        it('should match Python NLP style normalization', () => {
            assert.strictEqual(normalizeHeader_("Automation Trigger Phrase"), "automationtriggerphrase");
            assert.strictEqual(normalizeHeader_("Recommended Disambiguated Phrase"), "recommendeddisambiguatedphrase");
        });
    });

    describe('classifyAction_', () => {
        // Mock rules based on README/Code.gs context
        const mockRules = {
            "actions_order": ["Create Record", "Update Record", "Search/Query"],
            "rules": {
                "Create Record": ["new", "add", "create", "insert"],
                "Update Record": ["change", "update", "modify", "edit"],
                "Search/Query": ["find", "search", "get", "lookup"]
            }
        };

        it('should classify "create" as Create Record', () => {
            const result = classifyAction_("I want to create a new user", "", mockRules);
            assert.strictEqual(result.action, "Create Record");
            assert.ok(result.pattern);
        });

        it('should classify "update" as Update Record', () => {
            const result = classifyAction_("update the details", "", mockRules);
            assert.strictEqual(result.action, "Update Record");
        });

        it('should prioritize recommended phrase if present', () => {
            // "get" would be Search, "new" is Create. If "new" is in recommended, it should win if combined?
            // Logic is: const t = ((trigger || "") + " " + (recommended || "")).trim();
            // So it searches the concatenated string.
            const result = classifyAction_("find user", "create new one", mockRules);
            // "find" (Search) vs "create" (Create). Order is Create, Update, Search.
            // So if "create" is in the string, it matches Create Record first because of `actions_order`.
            assert.strictEqual(result.action, "Create Record");
        });

        it('should fallback to Search/Query default', () => {
            const result = classifyAction_("nothing matches here", "", mockRules);
            assert.strictEqual(result.action, "Search/Query");
            assert.strictEqual(result.pattern, "Default Fallback");
        });
    });

    describe('headerMap_', () => {
        it('should map headers to column indices', () => {
            const headers = ["Trigger Phrase", "Action", "Notes"];
            const map = headerMap_(headers);
            // triggerphrase: 0, action: 1, notes: 2
            assert.strictEqual(map["triggerphrase"], 0);
            assert.strictEqual(map["action"], 1);
            assert.strictEqual(map["notes"], 2);
        });

        it('should ignore empty headers', () => {
            const headers = ["Header 1", "", "Header 3"];
            const map = headerMap_(headers);
            assert.strictEqual(Object.keys(map).length, 2);
            assert.strictEqual(map["header1"], 0);
            assert.strictEqual(map["header3"], 2);
        });
    });

});
