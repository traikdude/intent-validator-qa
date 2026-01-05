#!/usr/bin/env python3
"""
================================================================================
TRIGGER MATRIX NORMALIZER - Python/Google Colab Edition v2.0 (Enhanced)
================================================================================
PURPOSE: Transform bundled trigger-output spreadsheets into normalized 1:1 mappings

PROBLEM IT SOLVES:
- Spreadsheets with multiple triggers compressed into single cells (semicolon-separated)
- Output columns containing massive blocks of mixed behaviors
- No clear trigger → behavior correspondence

SOLUTION:
- Splits bundled triggers into individual rows
- Extracts discrete behaviors from output blocks
- Semantically matches each trigger to its most relevant behavior
- Produces clean 1:1 mapping: [Trigger] → [Specific Behavior]

CHANGELOG V2.0:
- Enhanced error handling with detailed messages
- Added dataset size warnings and validation
- Improved regex safety (iteration limits)
- Aligned with GAS v2.0 improvements

AUTHOR: Generated for Erik's Gemini Trigger Matrix Project
VERSION: 2.0.0
DATE: 2026-01-05
================================================================================
"""

import sys
import os

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

import re
import json
import argparse
from typing import Dict, List, Tuple, Optional, Set, Any
from dataclasses import dataclass, field
from collections import defaultdict
import warnings

warnings.filterwarnings('ignore')

# Auto-install dependencies
try:
    import pandas as pd
    import numpy as np
except ImportError:
    print("📦 Installing required packages...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'pandas', 'numpy', 'openpyxl', '-q'])
    import pandas as pd
    import numpy as np


# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class NormalizerConfig:
    """Configuration settings for the normalizer."""
    # Column names in source data
    app_column: str = "Connected_App_Integration"
    trigger_column: str = "Trigger_Phrases"
    output_column: str = "Expected_Output"
    category_column: str = "Category"
    source_column: str = "Source_Reference"
    dependencies_column: str = "Dependencies"
    
    # Delimiter for splitting triggers
    trigger_delimiter: str = ";"
    
    # Minimum trigger length
    min_trigger_length: int = 2
    
    # Skip prefixes (category headers, etc.)
    skip_prefixes: List[str] = field(default_factory=lambda: [
        "Category:", "Connected App", "Unnamed"
    ])
    
    # Performance & Safety Limits (NEW IN V2.0)
    large_dataset_warning: int = 5000       # Warn if more than this many rows
    max_output_text_length: int = 10000     # Truncate output before regex
    max_regex_matches: int = 1000           # Iteration limit per regex
    min_bullet_length: int = 10             # Minimum bullet behavior text length
    min_numbered_length: int = 5            # Minimum numbered behavior text length
    
    # Output headers
    output_headers: List[str] = field(default_factory=lambda: [
        "Connected_App_Integration",
        "Trigger_Phrase",
        "Expected_System_Output",
        "Category",
        "Source_Reference",
        "Dependencies_Overlap",
        "Original_Row",
        "Match_Type"
    ])


# =============================================================================
# SEMANTIC RULES DATABASE
# =============================================================================

SEMANTIC_RULES: Dict[str, Dict[str, str]] = {
    # ======================== TRAVEL & NAVIGATION ========================
    'google flights': {
        'flight': 'Search Google Flights for optimal routes, compare airlines and prices',
        'flights to': 'Search flight routes to specified destination, show available options',
        'fly to': 'Initiate flight search to destination, display route options',
        'book flight': 'Open flight booking flow, pre-fill preferences, guide reservation',
        'flight search': 'Execute flight search with filters for price, time, stops',
        'cheap flights': 'Sort by lowest price, show budget options, suggest flexible dates',
        'round trip': 'Configure round-trip search, show outbound and return together',
        'one way': 'Configure one-way flight search, display single-direction options',
        'nonstop': 'Filter for direct flights only, highlight nonstop options',
    },
    
    'google hotels': {
        'hotel': 'Search hotels at destination, show ratings, prices, amenities',
        'hotels near': 'Search hotels near location, display proximity and distance',
        'book hotel': 'Open hotel booking flow, display room options',
        'cheap hotel': 'Sort by lowest price, show budget options',
        'luxury hotel': 'Filter for 4-5 star properties, premium amenities',
        'vacation rental': 'Search rental properties, show full home options',
    },
    
    'maps & navigation': {
        'navigate to': 'Start navigation to destination with voice guidance',
        'directions': 'Get turn-by-turn directions, show route options',
        'how to get to': 'Display route options, show travel time by mode',
        'route': 'Calculate and display route with alternatives',
        'map': 'Display map view of location/area',
        'traffic': 'Show real-time traffic conditions, delays, incidents',
        'nearby': 'Search for nearby points of interest',
        'parking': 'Find parking options, show rates and availability',
    },
    
    # ======================== PRODUCTIVITY ========================
    'google drive': {
        'find in drive': 'Search Google Drive for files by name/content',
        'open document': 'Open document in appropriate editor',
        'share': 'Configure sharing settings, send access invitation',
        'create folder': 'Create new folder in Drive',
        'upload': 'Upload file to Drive',
        'download': 'Download file from Drive to device',
    },
    
    'google docs': {
        'create document': 'Create new Google Doc',
        'create doc': 'Create new Google Doc',
        'edit document': 'Open document for editing',
        'spell check': 'Run spell/grammar check',
        'word count': 'Display document word count',
        'export pdf': 'Export document as PDF',
    },
    
    'google sheets': {
        'spreadsheet': 'Create new Google Sheet',
        'create spreadsheet': 'Create new Google Sheet',
        'sum': 'Calculate sum of selected cells',
        'average': 'Calculate average of values',
        'formula': 'Insert/edit formula',
        'sort': 'Sort data by selected column',
        'filter': 'Apply filter to data range',
        'chart': 'Create chart from data',
        'pivot table': 'Create pivot table analysis',
    },
    
    'google slides': {
        'presentation': 'Create new Google Slides presentation',
        'create presentation': 'Create new presentation',
        'add slide': 'Insert new slide',
        'present': 'Start slideshow mode',
    },
    
    # ======================== COMMUNICATION ========================
    'gmail': {
        'email': 'Compose and send email',
        'send email': 'Compose and send email',
        'compose': 'Open new email composition',
        'reply': 'Reply to current email',
        'forward': 'Forward email to recipient',
        'inbox': 'Open email inbox',
        'unread': 'Show unread emails',
        'search email': 'Search emails by sender/subject',
    },
    
    'phone': {
        'call': 'Initiate phone call to contact/number',
        'dial': 'Open dialer with number',
        'voicemail': 'Access voicemail messages',
        'recent calls': 'Show call history',
        'contacts': 'Open contacts list',
    },
    
    'whatsapp': {
        'whatsapp': 'Open WhatsApp conversation',
        'whatsapp call': 'Initiate WhatsApp call',
        'whatsapp message': 'Send WhatsApp message',
        'whatsapp video': 'Start WhatsApp video call',
    },
    
    # ======================== CALENDAR & TASKS ========================
    'calendar': {
        'schedule': 'Create calendar event',
        'meeting': 'Schedule meeting with invites',
        'event': 'Create/view calendar event',
        'appointment': 'Schedule appointment',
        'reminder': 'Set calendar reminder',
        'agenda': 'Show daily/weekly agenda',
        'today': 'Show today\'s calendar events',
        'tomorrow': 'Show tomorrow\'s calendar events',
    },
    
    'google tasks': {
        'task': 'Create new task',
        'create task': 'Add new task to list',
        'todo': 'Access todo list',
        'task list': 'Show all tasks',
        'complete task': 'Mark task as done',
        'due date': 'Set task due date',
    },
    
    'google keep': {
        'note': 'Create new note',
        'keep note': 'Add note to Google Keep',
        'checklist': 'Create checklist',
        'reminder': 'Add reminder to note',
        'shopping list': 'Create shopping list in Keep',
    },
    
    # ======================== MEDIA ========================
    'google photos': {
        'photo': 'Access photo library',
        'photos': 'Access photo library',
        'album': 'View/create photo album',
        'search photos': 'Search photos by content/date',
        'share photo': 'Share photo/album',
    },
    
    'youtube & youtube music': {
        'youtube': 'Open YouTube',
        'watch': 'Play video content',
        'search video': 'Search for videos',
        'play music': 'Start music playback',
        'playlist': 'Access playlist',
    },
    
    'spotify': {
        'spotify': 'Open Spotify',
        'play': 'Start music playback',
        'playlist': 'Access/create playlist',
        'song': 'Play specific song',
        'podcast': 'Access podcasts',
        'shuffle': 'Enable shuffle mode',
    },
    
    # ======================== SMART HOME ========================
    'smart home': {
        'lights': 'Control smart lights',
        'turn on': 'Turn on device',
        'turn off': 'Turn off device',
        'dim': 'Dim lights to level',
        'thermostat': 'Adjust temperature',
        'lock': 'Control smart locks',
    },
    
    # ======================== UTILITIES ========================
    'utilities': {
        'timer': 'Set countdown timer',
        'alarm': 'Set alarm',
        'weather': 'Get weather forecast',
        'calculator': 'Open calculator',
        'translate': 'Translate text/speech',
        'convert': 'Convert units/currency',
        'flashlight': 'Toggle flashlight',
    },
    
    # ======================== AI FEATURES ========================
    'image generation': {
        'generate image': 'Create AI image from description',
        'create image': 'Generate image using AI',
        'draw': 'AI image generation',
        'ai art': 'Create AI artwork',
        'imagine': 'Generate creative image',
    },
    
    'deep research': {
        'research': 'Conduct deep research',
        'deep research': 'Conduct deep research',
        'investigate': 'Investigate topic thoroughly',
        'analyze': 'Deep analysis of topic',
        'study': 'Comprehensive study',
    },
    
    'gemini canvas': {
        'canvas': 'Open Gemini Canvas workspace',
        'gemini canvas': 'Open Gemini Canvas',
        'workspace': 'Open collaborative workspace',
        'whiteboard': 'Open digital whiteboard',
        'brainstorm': 'Open brainstorming canvas',
        'diagram': 'Create diagram in canvas',
        'flowchart': 'Create flowchart',
        'mindmap': 'Create mind map',
    },
    
    'guided learning': {
        'teach me': 'Start guided learning session',
        'learn': 'Begin learning mode',
        'explain': 'Provide detailed explanation',
        'how does': 'Explain how something works',
        'what is': 'Define and explain concept',
        'tutorial': 'Start tutorial mode',
    },
}


# =============================================================================
# CORE NORMALIZER CLASS
# =============================================================================

class TriggerMatrixNormalizer:
    """
    Main normalizer class for transforming bundled trigger-output data
    into clean 1:1 mappings.
    """
    
    def __init__(self, config: Optional[NormalizerConfig] = None):
        """Initialize the normalizer with configuration."""
        self.config = config or NormalizerConfig()
        self.stats = {
            'source_rows': 0,
            'total_triggers': 0,
            'output_rows': 0,
            'semantic_matches': 0,
            'parsed_matches': 0,
            'fallback_count': 0,
            'unique_apps': set(),
            'unique_outputs': set(),
        }
    
    def normalize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize a pandas DataFrame containing trigger data.
        
        Args:
            df: Input DataFrame with bundled triggers
            
        Returns:
            Normalized DataFrame with 1:1 trigger→behavior mappings
        """
        normalized_rows = []
        self._reset_stats()
        
        for idx, row in df.iterrows():
            # Extract values
            app = str(row.get(self.config.app_column, '')).strip()
            triggers_raw = str(row.get(self.config.trigger_column, ''))
            output_raw = str(row.get(self.config.output_column, ''))
            category = str(row.get(self.config.category_column, ''))
            source_ref = str(row.get(self.config.source_column, ''))
            dependencies = str(row.get(self.config.dependencies_column, ''))
            
            # Skip invalid rows
            if not app or self._should_skip_row(app):
                continue
            
            if len(triggers_raw) < self.config.min_trigger_length:
                continue
            
            self.stats['source_rows'] += 1
            self.stats['unique_apps'].add(app)
            
            # Split triggers
            triggers = self._split_triggers(triggers_raw)
            self.stats['total_triggers'] += len(triggers)
            
            # Parse output block
            parsed_behaviors = self._parse_output_block(output_raw)
            
            # Map each trigger to behavior
            for trigger in triggers:
                match_result = self._match_trigger_to_behavior(
                    trigger, app, parsed_behaviors, output_raw
                )
                
                normalized_rows.append({
                    'Connected_App_Integration': app,
                    'Trigger_Phrase': trigger,
                    'Expected_System_Output': match_result['output'],
                    'Category': category,
                    'Source_Reference': source_ref,
                    'Dependencies_Overlap': dependencies,
                    'Original_Row': idx + 1,
                    'Match_Type': match_result['type'],
                })
                
                self.stats['output_rows'] += 1
                self.stats['unique_outputs'].add(match_result['output'])
                
                if match_result['type'] == 'semantic':
                    self.stats['semantic_matches'] += 1
                elif match_result['type'] == 'parsed':
                    self.stats['parsed_matches'] += 1
                else:
                    self.stats['fallback_count'] += 1
        
        return pd.DataFrame(normalized_rows)
    
    def normalize_file(
        self,
        input_path: str,
        output_path: Optional[str] = None,
        sheet_name: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Normalize a spreadsheet file.
        
        Args:
            input_path: Path to input file (CSV, Excel, or Google Sheets URL)
            output_path: Optional path for output file
            sheet_name: Optional sheet name for Excel files
            
        Returns:
            Normalized DataFrame
        """
        # Load input data
        if input_path.endswith('.csv'):
            df = pd.read_csv(input_path)
        elif input_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(input_path, sheet_name=sheet_name or 0)
        else:
            raise ValueError(f"Unsupported file format: {input_path}")
        
        print(f"📥 Loaded {len(df)} rows from {input_path}")
        
        # NEW IN V2.0: Dataset size warning
        if len(df) > self.config.large_dataset_warning:
            print(f"\n⚠️ WARNING: Large dataset detected ({len(df)} rows)")
            print(f"   Processing may take several minutes...\n")
        
        # Normalize
        result_df = self.normalize_dataframe(df)
        
        # Save output
        if output_path:
            if output_path.endswith('.csv'):
                result_df.to_csv(output_path, index=False)
            elif output_path.endswith(('.xlsx', '.xls')):
                result_df.to_excel(output_path, index=False)
            print(f"📤 Saved {len(result_df)} rows to {output_path}")
        
        return result_df
    
    def get_statistics(self) -> Dict[str, Any]:
        """Return normalization statistics."""
        total = self.stats['output_rows']
        semantic = self.stats['semantic_matches']
        
        return {
            'source_rows': self.stats['source_rows'],
            'total_triggers': self.stats['total_triggers'],
            'output_rows': total,
            'semantic_matches': semantic,
            'parsed_matches': self.stats['parsed_matches'],
            'fallback_count': self.stats['fallback_count'],
            'match_rate': round((semantic / total * 100) if total > 0 else 0, 1),
            'unique_apps': len(self.stats['unique_apps']),
            'unique_outputs': len(self.stats['unique_outputs']),
        }
    
    def print_statistics(self) -> None:
        """Print formatted statistics."""
        stats = self.get_statistics()
        
        print("\n" + "=" * 60)
        print("📊 NORMALIZATION STATISTICS")
        print("=" * 60)
        print(f"  Source Rows Processed:  {stats['source_rows']}")
        print(f"  Total Triggers Found:   {stats['total_triggers']}")
        print(f"  Output Rows (1:1):      {stats['output_rows']}")
        print(f"  Semantic Matches:       {stats['semantic_matches']} ({stats['match_rate']}%)")
        print(f"  Parsed Matches:         {stats['parsed_matches']}")
        print(f"  Fallback/Generic:       {stats['fallback_count']}")
        print(f"  Unique Apps:            {stats['unique_apps']}")
        print(f"  Unique Outputs:         {stats['unique_outputs']}")
        print("=" * 60 + "\n")
    
    # -------------------------------------------------------------------------
    # Private Methods
    # -------------------------------------------------------------------------
    
    def _reset_stats(self) -> None:
        """Reset statistics counters."""
        self.stats = {
            'source_rows': 0,
            'total_triggers': 0,
            'output_rows': 0,
            'semantic_matches': 0,
            'parsed_matches': 0,
            'fallback_count': 0,
            'unique_apps': set(),
            'unique_outputs': set(),
        }
    
    def _should_skip_row(self, app: str) -> bool:
        """Check if row should be skipped based on app value."""
        for prefix in self.config.skip_prefixes:
            if app.lower().startswith(prefix.lower()):
                return True
        return False
    
    def _split_triggers(self, triggers_raw: str) -> List[str]:
        """Split raw trigger string into individual triggers."""
        triggers = triggers_raw.split(self.config.trigger_delimiter)
        return [
            t.strip()
            for t in triggers
            if len(t.strip()) >= self.config.min_trigger_length
        ]
    
    def _parse_output_block(self, output_text: str) -> List[Dict[str, str]]:
        """Parse output block into discrete behavioral components (WITH SAFETY LIMITS)."""
        behaviors = []
        
        if not output_text or output_text in ('nan', 'None', ''):
            return behaviors
        
        # NEW IN V2.0: Truncate large output to prevent slow regex
        safe_output = output_text[:self.config.max_output_text_length]
        
        # Extract bulleted items
        bullet_pattern = r'[●•○▸→✓]\s*([^\n●•○▸→✓]+)'
        match_count = 0
        for match in re.finditer(bullet_pattern, safe_output):
            if match_count >= self.config.max_regex_matches:
                break
            behavior = match.group(1).strip()
            if len(behavior) > self.config.min_bullet_length:
                behaviors.append({'type': 'bullet', 'text': behavior[:300]})
            match_count += 1
        
        # Extract numbered items
        numbered_pattern = r'\d+[\.\)]\s*([^:\n]+)'
        match_count = 0
        for match in re.finditer(numbered_pattern, safe_output):
            if match_count >= self.config.max_regex_matches:
                break
            behavior = match.group(1).strip()
            if len(behavior) > self.config.min_numbered_length:
                behaviors.append({'type': 'numbered', 'text': behavior[:200]})
            match_count += 1
        
        # Extract action phrases (ENHANCED IN V2.0)
        action_verbs = 'Search|Show|Display|Create|Open|Find|Calculate|Generate|Play|Send|Navigate|Set|Configure|Access|Start|Enable|Disable|Launch|Execute|Run|Activate|Trigger'
        action_pattern = rf'({action_verbs})(ing|s|es|ed)?\s+[^,.\n]{{5,60}}'
        match_count = 0
        for match in re.finditer(action_pattern, safe_output, re.IGNORECASE):
            if match_count >= self.config.max_regex_matches:
                break
            behaviors.append({'type': 'action', 'text': match.group(0).strip()})
            match_count += 1
        
        return behaviors
    
    def _match_trigger_to_behavior(
        self,
        trigger: str,
        app: str,
        parsed_behaviors: List[Dict[str, str]],
        raw_output: str
    ) -> Dict[str, str]:
        """Match a trigger phrase to its most relevant behavior."""
        trigger_lower = trigger.lower().strip()
        app_lower = app.lower().strip()
        
        # Strategy 1: Check semantic rules database
        for rule_app, rules in SEMANTIC_RULES.items():
            if rule_app in app_lower or app_lower in rule_app:
                # Exact match
                if trigger_lower in rules:
                    return {'output': rules[trigger_lower], 'type': 'semantic'}
                
                # Partial match
                for rule_trigger, rule_output in rules.items():
                    if rule_trigger in trigger_lower or trigger_lower in rule_trigger:
                        return {'output': rule_output, 'type': 'semantic'}
                
                # Keyword overlap
                trigger_words = set(trigger_lower.split())
                for rule_trigger, rule_output in rules.items():
                    rule_words = set(rule_trigger.split())
                    if trigger_words & rule_words:
                        return {'output': rule_output, 'type': 'semantic'}
        
        # Strategy 2: Match against parsed behaviors
        if parsed_behaviors:
            trigger_words = trigger_lower.split()
            
            for behavior in parsed_behaviors:
                behavior_lower = behavior['text'].lower()
                matches = [w for w in trigger_words if len(w) > 2 and w in behavior_lower]
                
                if matches:
                    return {'output': behavior['text'], 'type': 'parsed'}
            
            # Return first behavior as fallback
            return {'output': parsed_behaviors[0]['text'], 'type': 'parsed'}
        
        # Strategy 3: Fallback - generate generic output
        return {'output': f"Activate {app} for: {trigger}", 'type': 'fallback'}


# =============================================================================
# GOOGLE COLAB INTEGRATION
# =============================================================================

class ColabNormalizer:
    """
    Google Colab-specific wrapper for the normalizer.
    Provides easy file upload/download and Google Sheets integration.
    """
    
    def __init__(self):
        """Initialize Colab normalizer."""
        self.normalizer = TriggerMatrixNormalizer()
        self._check_colab_environment()
    
    def _check_colab_environment(self) -> bool:
        """Check if running in Google Colab."""
        try:
            from google.colab import files
            self.in_colab = True
            print("✅ Running in Google Colab")
            return True
        except ImportError:
            self.in_colab = False
            print("ℹ️ Not running in Google Colab (local mode)")
            return False
    
    def upload_and_normalize(self) -> Optional[pd.DataFrame]:
        """Upload a file and normalize it (Colab only)."""
        if not self.in_colab:
            print("❌ This method is only available in Google Colab")
            return None
        
        from google.colab import files
        
        print("📤 Please upload your spreadsheet file...")
        uploaded = files.upload()
        
        if not uploaded:
            print("❌ No file uploaded")
            return None
        
        filename = list(uploaded.keys())[0]
        print(f"📥 Processing: {filename}")
        
        result = self.normalizer.normalize_file(filename)
        self.normalizer.print_statistics()
        
        return result
    
    def normalize_and_download(
        self,
        df: pd.DataFrame,
        output_filename: str = "normalized_triggers.xlsx"
    ) -> None:
        """Normalize data and download result (Colab only)."""
        if not self.in_colab:
            print("❌ This method is only available in Google Colab")
            return
        
        from google.colab import files
        
        result = self.normalizer.normalize_dataframe(df)
        result.to_excel(output_filename, index=False)
        
        self.normalizer.print_statistics()
        
        print(f"📥 Downloading: {output_filename}")
        files.download(output_filename)
    
    def connect_google_sheets(self, sheet_url: str) -> Optional[pd.DataFrame]:
        """Connect to a Google Sheet and normalize it."""
        try:
            import gspread
            from google.colab import auth
            from oauth2client.client import GoogleCredentials
        except ImportError:
            print("📦 Installing gspread...")
            import subprocess
            subprocess.check_call(['pip', 'install', 'gspread', 'oauth2client', '-q'])
            import gspread
            from google.colab import auth
            from oauth2client.client import GoogleCredentials
        
        # Authenticate
        print("🔐 Authenticating with Google...")
        auth.authenticate_user()
        
        # Connect to sheet
        gc = gspread.authorize(GoogleCredentials.get_application_default())
        sheet = gc.open_by_url(sheet_url)
        worksheet = sheet.get_worksheet(0)
        
        # Get data as DataFrame
        data = worksheet.get_all_records()
        df = pd.DataFrame(data)
        
        print(f"📥 Loaded {len(df)} rows from Google Sheet")
        
        # Normalize
        result = self.normalizer.normalize_dataframe(df)
        self.normalizer.print_statistics()
        
        return result


# =============================================================================
# CLI INTERFACE
# =============================================================================

def main():
    """Command-line interface for the normalizer."""
    parser = argparse.ArgumentParser(
        description="Trigger Matrix Normalizer - Transform bundled triggers into 1:1 mappings"
    )
    
    parser.add_argument(
        "input",
        nargs="?",
        help="Input file path (CSV or Excel)"
    )
    
    parser.add_argument(
        "-o", "--output",
        help="Output file path (CSV or Excel)"
    )
    
    parser.add_argument(
        "-s", "--sheet",
        help="Sheet name for Excel files"
    )
    
    parser.add_argument(
        "--stats-only",
        action="store_true",
        help="Only print statistics, don't save output"
    )
    
    args = parser.parse_args()
    
    if not args.input:
        print("✅ Trigger Matrix Normalizer v2.0 loaded successfully!")
        print("🔧 Ready for Google Colab integration")
        print("\nUsage:")
        print("  python trigger_matrix_normalizer.py input.xlsx -o output.xlsx")
        print("  python trigger_matrix_normalizer.py input.csv -o output.csv")
        return
    
    normalizer = TriggerMatrixNormalizer()
    
    output_path = None if args.stats_only else args.output
    result = normalizer.normalize_file(args.input, output_path, args.sheet)
    
    normalizer.print_statistics()
    
    if args.stats_only:
        print("\n📋 Preview (first 5 rows):")
        print(result.head().to_string())


if __name__ == "__main__":
    main()
