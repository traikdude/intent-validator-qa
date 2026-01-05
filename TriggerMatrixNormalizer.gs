/**
 * ============================================================================
 * TRIGGER MATRIX NORMALIZER - Google Apps Script
 * ============================================================================
 * * PURPOSE: Transform bundled trigger-output spreadsheets into normalized 1:1 mappings
 * * PROBLEM IT SOLVES:
 * - Spreadsheets with multiple triggers compressed into single cells (semicolon-separated)
 * - Output columns containing massive blocks of mixed behaviors
 * - No clear trigger → behavior correspondence
 * * SOLUTION:
 * - Splits bundled triggers into individual rows
 * - Extracts discrete behaviors from output blocks
 * - Semantically matches each trigger to its most relevant behavior
 * - Produces clean 1:1 mapping: [Trigger] → [Specific Behavior]
 * * USAGE:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste this entire script
 * 4. Save (Ctrl+S)
 * 5. Run "onOpen" function once to create menu
 * 6. Use the "Normalizer" menu that appears in your spreadsheet
 * * AUTHOR: Generated for Erik's Gemini Trigger Matrix Project
 * VERSION: 1.0.0
 * DATE: 2026-01-05
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION - CUSTOMIZE THESE SETTINGS
// ============================================================================

const CONFIG = {
  // Column indices (0-based) in your source sheet
  SOURCE_COLUMNS: {
    APP_INTEGRATION: 0,      // Column A: App/Integration name
    TRIGGER_PHRASES: 1,      // Column B: Trigger phrases (semicolon-separated)
    OUTPUT_BEHAVIOR: 2,      // Column C: Expected output/behavior
    CATEGORY: 3,             // Column D: Category
    SOURCE_REF: 4,           // Column E: Source reference
    DEPENDENCIES: 5          // Column F: Dependencies/notes
  },
  
  // Trigger phrase delimiter (what separates multiple triggers in one cell)
  TRIGGER_DELIMITER: ';',
  
  // Output sheet name
  OUTPUT_SHEET_NAME: 'Normalized_Triggers',
  
  // Skip rows that start with these prefixes (category headers, etc.)
  SKIP_PREFIXES: ['Category:', 'Connected App', 'Unnamed'],
  
  // Minimum trigger length to be considered valid
  MIN_TRIGGER_LENGTH: 2,
  
  // Headers for normalized output
  OUTPUT_HEADERS: [
    'Connected_App_Integration',
    'Trigger_Phrase', 
    'Expected_System_Output',
    'Category',
    'Source_Reference',
    'Dependencies_Overlap',
    'Original_Row',
    'Match_Type'
  ]
};

// ============================================================================
// SEMANTIC MATCHING RULES DATABASE
// ============================================================================
// Add your own app-specific rules here. Format:
// 'app name (lowercase)': { 'trigger phrase': 'specific output behavior' }

const SEMANTIC_RULES = {
  
  // ======================== TRAVEL & NAVIGATION ========================
  'google flights': {
    'flight': 'Search Google Flights for optimal routes, compare airlines and prices',
    'flights to': 'Search flight routes to specified destination, show available options',
    'fly to': 'Initiate flight search to destination, display route options',
    'airplane': 'Access flight booking interface, search available flights',
    'airline': 'Compare airline options, show ratings, baggage policies, pricing',
    'book flight': 'Open flight booking flow, pre-fill preferences, guide reservation',
    'flight search': 'Execute flight search with filters for price, time, stops',
    'airfare': 'Display pricing options, compare base fares vs total costs',
    'round trip': 'Configure round-trip search, show outbound and return together',
    'one way': 'Configure one-way flight search, display single-direction options',
    'layover': 'Filter/display layover options, show connection times',
    'nonstop': 'Filter for direct flights only, highlight nonstop options',
    'departure': 'Show departure times, terminal info, check-in reminders',
    'arrival': 'Display arrival info, terminal, ground transport options',
    'flight deals': 'Search discounted flights, show promotions and sales',
    'cheap flights': 'Sort by lowest price, show budget options, suggest flexible dates',
    'flight prices': 'Display pricing trends, historical data, booking windows',
    'when should i fly': 'Analyze price trends, suggest cheapest dates to fly',
    'best time to fly': 'Recommend optimal booking timing, show price predictions'
  },
  
  'google hotels': {
    'hotel': 'Search hotels at destination, show ratings, prices, amenities',
    'hotels near': 'Search hotels near location, display proximity and distance',
    'find lodging': 'Search all lodging types: hotels, rentals, hostels',
    'accommodation': 'Search comprehensive lodging options with filters',
    'resort': 'Search resort properties with amenity focus (pool, spa)',
    'book hotel': 'Open hotel booking flow, display room options',
    'room rate': 'Display room pricing, rate breakdowns, taxes/fees',
    'hotel review': 'Show guest reviews, ratings by category',
    'check in': 'Display check-in time, early check-in options',
    'check out': 'Show check-out time, late checkout options',
    'amenities': 'List hotel amenities: WiFi, pool, gym, breakfast',
    'hotel deals': 'Search discounted rates, show promotions',
    'cheap hotel': 'Sort by lowest price, show budget options',
    'luxury hotel': 'Filter for 4-5 star properties, premium amenities',
    'vacation rental': 'Search rental properties, show full home options',
    'where to stay': 'Search all lodging options at destination',
    'motel': 'Search for motels, show budget-friendly options',
    'inn': 'Search for inns and bed & breakfasts',
    'airbnb alternative': 'Search vacation rental alternatives'
  },
  
  'maps & navigation': {
    'navigate to': 'Start navigation to destination with voice guidance',
    'direction': 'Get turn-by-turn directions, show route options',
    'directions': 'Get turn-by-turn directions, show route options',
    'how to get to': 'Display route options, show travel time by mode',
    'route': 'Calculate and display route with alternatives',
    'map': 'Display map view of location/area',
    'traffic': 'Show real-time traffic conditions, delays, incidents',
    'eta': 'Calculate estimated arrival time based on conditions',
    'distance': 'Calculate distance between points in miles/km',
    'nearby': 'Search for nearby points of interest',
    'parking': 'Find parking options, show rates and availability',
    'gas station': 'Locate nearest gas stations, show prices',
    'restaurant': 'Search nearby restaurants, show ratings',
    'directions home': 'Navigate to saved home address',
    'directions work': 'Navigate to saved work address',
    'avoid highway': 'Calculate route avoiding highways',
    'walking directions': 'Get walking directions with pedestrian routes',
    'transit directions': 'Get public transit directions with schedules',
    'visit': 'Navigate to location for visit'
  },
  
  // ======================== PRODUCTIVITY - FILES ========================
  'google drive': {
    'find in drive': 'Search Google Drive for files by name/content',
    'open document': 'Open document in appropriate editor',
    'share': 'Configure sharing settings, send access invitation',
    'create folder': 'Create new folder in Drive',
    'upload': 'Upload file to Drive',
    'download': 'Download file from Drive to device',
    'recent files': 'Show recently accessed Drive files',
    'my files': 'Display user\'s Drive files',
    'storage': 'Show Drive storage usage and quota',
    'delete file': 'Move file to Drive trash',
    'move file': 'Move file to different folder',
    'copy file': 'Create copy of file',
    'rename': 'Rename file or folder',
    'file info': 'Display file details, history, sharing status'
  },
  
  // ======================== PRODUCTIVITY - DOCS ========================
  'google docs': {
    'create document': 'Create new Google Doc',
    'create doc': 'Create new Google Doc',
    'edit document': 'Open document for editing',
    'format': 'Apply formatting to selected text',
    'insert table': 'Insert table into document',
    'add image': 'Insert image into document',
    'spell check': 'Run spell/grammar check',
    'word count': 'Display document word count',
    'export pdf': 'Export document as PDF',
    'print': 'Send document to printer',
    'comment': 'Add comment to document',
    'suggest edit': 'Make edit in suggestion mode',
    'version history': 'Show document revision history',
    'open in docs': 'Open file in Google Docs',
    'draft': 'Create document draft',
    'report': 'Create report document with template',
    'proposal': 'Create proposal document',
    'memo': 'Create memo document',
    'outline': 'Create document outline structure',
    'notes': 'Create notes document',
    'write up': 'Create written document',
    'documentation': 'Create documentation file'
  },
  
  // ======================== PRODUCTIVITY - SHEETS ========================
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
    'conditional format': 'Apply conditional formatting',
    'data validation': 'Set data validation rules',
    'merge cells': 'Merge selected cells',
    'freeze': 'Freeze rows/columns',
    'import data': 'Import external data source',
    'open in sheets': 'Open file in Google Sheets',
    'calculate': 'Perform calculation in spreadsheet',
    'graph': 'Create graph from spreadsheet data',
    'budget': 'Create budget spreadsheet template',
    'tracker': 'Create tracker spreadsheet',
    'numbers': 'Open spreadsheet for numerical data',
    'statistics': 'Calculate statistics from data'
  },
  
  // ======================== PRODUCTIVITY - SLIDES ========================
  'google slides': {
    'presentation': 'Create new Google Slides presentation',
    'create presentation': 'Create new presentation',
    'add slide': 'Insert new slide',
    'slide layout': 'Change slide layout template',
    'insert image': 'Add image to slide',
    'transitions': 'Configure slide transitions',
    'animations': 'Add element animations',
    'speaker notes': 'Add speaker notes',
    'present': 'Start slideshow mode',
    'share presentation': 'Configure presentation sharing',
    'duplicate slide': 'Copy current slide',
    'slides': 'Create Google Slides presentation',
    'pitch deck': 'Create pitch deck presentation',
    'slideshow': 'Create slideshow presentation'
  },
  
  // ======================== PRODUCTIVITY - FORMS ========================
  'google forms': {
    'form': 'Create new Google Form',
    'create form': 'Create new Google Form',
    'survey': 'Create survey form',
    'questionnaire': 'Create questionnaire',
    'add question': 'Add question to form',
    'multiple choice': 'Add multiple choice question',
    'short answer': 'Add short answer question',
    'form response': 'View form responses',
    'share form': 'Share form link',
    'form settings': 'Configure form settings',
    'quiz': 'Create quiz with scoring',
    'accept responses': 'Enable/disable responses',
    'poll': 'Create poll/voting form',
    'rsvp': 'Create RSVP form for event'
  },
  
  // ======================== COMMUNICATION - EMAIL ========================
  'gmail': {
    'email': 'Compose and send email',
    'send email': 'Compose and send email',
    'compose': 'Open new email composition',
    'reply': 'Reply to current email',
    'forward': 'Forward email to recipient',
    'inbox': 'Open email inbox',
    'unread': 'Show unread emails',
    'search email': 'Search emails by sender/subject',
    'delete email': 'Move email to trash',
    'archive': 'Archive email',
    'label': 'Apply label to email',
    'star': 'Star important email',
    'spam': 'Mark as spam',
    'attachment': 'Add/download attachment',
    'schedule send': 'Schedule email delivery',
    'draft': 'Save email as draft',
    'message to': 'Compose email message to recipient',
    'important': 'Show important emails',
    'sent': 'Show sent emails',
    'snooze': 'Snooze email for later'
  },
  
  // ======================== COMMUNICATION - PHONE ========================
  'phone': {
    'call': 'Initiate phone call to contact/number',
    'dial': 'Open dialer with number',
    'answer': 'Answer incoming call',
    'hang up': 'End current call',
    'voicemail': 'Access voicemail messages',
    'recent calls': 'Show call history',
    'missed calls': 'Show missed calls',
    'contacts': 'Open contacts list',
    'add contact': 'Create new contact',
    'speaker': 'Toggle speakerphone',
    'mute': 'Mute call microphone',
    'hold': 'Place call on hold',
    'phone': 'Open phone dialer',
    'phone number for': 'Look up phone number for contact/business'
  },
  
  // ======================== COMMUNICATION - MESSAGING ========================
  'whatsapp': {
    'whatsapp': 'Open WhatsApp conversation',
    'whatsapp call': 'Initiate WhatsApp call',
    'whatsapp message': 'Send WhatsApp message',
    'whatsapp video': 'Start WhatsApp video call',
    'whatsapp group': 'Access WhatsApp group chat',
    'voice message': 'Record and send voice note',
    'status': 'View/post WhatsApp status',
    'whatsapp contact': 'Open WhatsApp contact',
    'broadcast': 'Send WhatsApp broadcast'
  },
  
  // ======================== CALENDAR & TASKS ========================
  'calendar': {
    'schedule': 'Create calendar event',
    'meeting': 'Schedule meeting with invites',
    'event': 'Create/view calendar event',
    'appointment': 'Schedule appointment',
    'reminder': 'Set calendar reminder',
    'agenda': 'Show daily/weekly agenda',
    'free time': 'Show available time slots',
    'reschedule': 'Move event to new time',
    'cancel event': 'Delete calendar event',
    'invite': 'Send event invitation',
    'recurring': 'Create recurring event',
    'calendar': 'Open calendar view',
    'remind me': 'Set calendar reminder',
    'availability': 'Show calendar availability',
    'book': 'Schedule/book calendar event',
    'when am i': 'Show scheduled events on calendar',
    'today': 'Show today\'s calendar events',
    'tomorrow': 'Show tomorrow\'s calendar events',
    'this week': 'Show this week\'s calendar events'
  },
  
  'google tasks': {
    'task': 'Create new task',
    'create task': 'Add new task to list',
    'todo': 'Access todo list',
    'to-do': 'Access to-do list',
    'task list': 'Show all tasks',
    'complete task': 'Mark task as done',
    'due date': 'Set task due date',
    'priority': 'Set task priority',
    'subtask': 'Add subtask',
    'assign': 'Assign task to person',
    'task reminder': 'Set task reminder',
    'overdue': 'Show overdue tasks',
    'delete task': 'Remove task',
    'my tasks': 'Show my tasks',
    'add to list': 'Add item to task list',
    'check off': 'Mark task complete',
    'deadline': 'Set task deadline',
    'action item': 'Create action item task',
    'show tasks': 'Display task list',
    'incomplete': 'Show incomplete tasks'
  },
  
  // ======================== NOTES ========================
  'google keep': {
    'note': 'Create new note',
    'keep note': 'Add note to Google Keep',
    'voice note': 'Create voice memo',
    'checklist': 'Create checklist',
    'pin note': 'Pin note to top',
    'archive note': 'Archive note',
    'label note': 'Add label to note',
    'share note': 'Share note',
    'color note': 'Change note color',
    'reminder': 'Add reminder to note',
    'image note': 'Create note with image',
    'drawing': 'Create drawing note',
    'jot down': 'Quick note creation',
    'remember': 'Save to notes',
    'make note': 'Create new note',
    'take note': 'Create new note',
    'shopping list': 'Create shopping list in Keep',
    'grocery list': 'Create grocery list in Keep',
    'save this thought': 'Save thought as note in Keep'
  },
  
  // ======================== MEDIA ========================
  'google photos': {
    'photo': 'Access photo library',
    'photos': 'Access photo library',
    'album': 'View/create photo album',
    'search photos': 'Search photos by content/date',
    'share photo': 'Share photo/album',
    'edit photo': 'Open photo editor',
    'delete photo': 'Remove photo',
    'memories': 'View photo memories',
    'screenshot': 'Access screenshots',
    'pictures': 'Access photo library',
    'images': 'Browse photo collection',
    'pictures from': 'Search photos by date/location'
  },
  
  'youtube & youtube music': {
    'youtube': 'Open YouTube',
    'watch': 'Play video content',
    'search video': 'Search for videos',
    'play music': 'Start music playback',
    'playlist': 'Access playlist',
    'subscribe': 'Subscribe to channel',
    'like video': 'Like current video',
    'save video': 'Save video to watch later',
    'history': 'View watch history',
    'trending': 'Show trending videos',
    'live': 'Show live streams',
    'song': 'Play song on YouTube Music',
    'listen to': 'Play audio content on YouTube Music',
    'next video': 'Play next video in queue',
    'pause': 'Pause current video playback',
    'resume': 'Resume video playback'
  },
  
  'spotify': {
    'spotify': 'Open Spotify',
    'play': 'Start music playback',
    'playlist': 'Access/create playlist',
    'album': 'Play album',
    'artist': 'Show artist page',
    'song': 'Play specific song',
    'podcast': 'Access podcasts',
    'shuffle': 'Enable shuffle mode',
    'repeat': 'Enable repeat mode',
    'queue': 'View/edit queue',
    'discover': 'Show music recommendations',
    'saved': 'Access saved music',
    'pause': 'Pause Spotify playback',
    'pause music': 'Pause Spotify playback',
    'resume': 'Resume Spotify playback',
    'next': 'Skip to next track',
    'previous': 'Go to previous track',
    'volume': 'Adjust Spotify volume'
  },
  
  // ======================== SMART HOME ========================
  'smart home': {
    'lights': 'Control smart lights',
    'turn on': 'Turn on device',
    'turn off': 'Turn off device',
    'dim': 'Dim lights to level',
    'thermostat': 'Adjust temperature',
    'lock': 'Control smart locks',
    'camera': 'View security cameras',
    'alarm': 'Manage alarm system',
    'device': 'Control smart device',
    'scene': 'Activate scene preset',
    'routine': 'Run smart home routine',
    'fan': 'Control smart fan',
    'set temperature': 'Set thermostat temperature',
    'nest': 'Control Nest smart home device',
    'smart home': 'Access smart home controls',
    'automation': 'Manage smart home automations',
    'hey google': 'Activate Google Assistant for smart home'
  },
  
  // ======================== SAMSUNG ========================
  'samsung calendar': {
    'samsung calendar': 'Open Samsung Calendar',
    'event': 'Create calendar event',
    'schedule': 'Create calendar event',
    'meeting': 'Schedule meeting',
    'reminder': 'Set reminder',
    'agenda': 'Show agenda',
    'appointment': 'Schedule appointment',
    'calendar': 'Open calendar',
    'view': 'View Samsung Calendar',
    'add': 'Add event to Samsung Calendar'
  },
  
  'samsung reminders': {
    'reminder': 'Create Samsung Reminder',
    'remind me': 'Set reminder',
    'remind': 'Create reminder',
    'remember': 'Set reminder for item',
    'alert': 'Set alert/reminder',
    'notification': 'Create reminder notification',
    'due': 'Set due date for reminder',
    'samsung to-do': 'Create Samsung to-do item',
    'list': 'Show all Samsung Reminders',
    'set': 'Create new Samsung Reminder'
  },
  
  // ======================== UTILITIES ========================
  'utilities': {
    'timer': 'Set countdown timer',
    'alarm': 'Set alarm',
    'weather': 'Get weather forecast',
    'calculator': 'Open calculator',
    'translate': 'Translate text/speech',
    'convert': 'Convert units/currency',
    'flashlight': 'Toggle flashlight',
    'battery': 'Check battery status',
    'bluetooth': 'Manage bluetooth',
    'wifi': 'Manage WiFi settings',
    'stopwatch': 'Start stopwatch',
    'unit conversion': 'Convert units',
    'currency': 'Convert currency',
    'qr code': 'Scan QR code',
    'compass': 'Open compass',
    'measure': 'Measure distance/area',
    'utility': 'Access system utilities',
    'system': 'Access system settings',
    'settings': 'Open device settings',
    'storage': 'View storage usage',
    'brightness': 'Adjust screen brightness',
    'volume': 'Adjust device volume',
    'do not disturb': 'Toggle do not disturb mode',
    'airplane mode': 'Toggle airplane mode',
    'screenshot': 'Take screenshot',
    'what time is it': 'Display current time',
    'set timer': 'Set countdown timer',
    'set alarm': 'Set alarm for specified time'
  },
  
  // ======================== AI FEATURES ========================
  'image generation': {
    'generate image': 'Create AI image from description',
    'create image': 'Generate image using AI',
    'draw': 'AI image generation',
    'make picture': 'Generate picture',
    'ai art': 'Create AI artwork',
    'imagine': 'Generate creative image',
    'visualize': 'Create visual representation',
    'design': 'AI-assisted design creation',
    'illustration': 'Generate illustration',
    'render': 'Render visual content',
    'picture of': 'Generate image of subject',
    'image of': 'Generate image of subject',
    'artwork': 'Create AI artwork',
    'dall-e': 'Generate image using AI (DALL-E style)',
    'midjourney': 'Generate artistic AI image',
    'stable diffusion': 'Generate AI image with custom style'
  },
  
  'video creation': {
    'create video': 'Generate video content',
    'make video': 'Create video',
    'video of': 'Generate video of subject',
    'animate': 'Create animation',
    'video clip': 'Generate short video',
    'motion': 'Create motion graphics',
    'render video': 'Render video output',
    'edit video': 'AI video editing',
    'video effect': 'Apply video effects',
    'timelapse': 'Create timelapse video',
    'slideshow': 'Create photo slideshow video',
    'merge videos': 'Combine multiple videos into one'
  },
  
  'citation search': {
    'cite': 'Find citation for source',
    'citation': 'Generate citation',
    'reference': 'Find reference source',
    'source': 'Search for sources',
    'academic': 'Search academic sources',
    'scholarly': 'Search scholarly articles',
    'research paper': 'Find research papers',
    'journal': 'Search journal articles',
    'bibliography': 'Generate bibliography',
    'mla': 'Format MLA citation',
    'apa': 'Format APA citation',
    'chicago': 'Format Chicago citation',
    'quote': 'Find quotation source',
    'peer-reviewed': 'Search peer-reviewed academic sources'
  },
  
  'deep research': {
    'research': 'Conduct deep research',
    'deep research': 'Conduct deep research',
    'investigate': 'Investigate topic thoroughly',
    'analyze': 'Deep analysis of topic',
    'study': 'Comprehensive study',
    'explore': 'Explore topic in depth',
    'deep dive': 'Deep dive analysis',
    'comprehensive': 'Comprehensive research',
    'thorough': 'Thorough investigation',
    'detailed': 'Detailed research',
    'in-depth': 'In-depth analysis',
    'literature review': 'Conduct comprehensive literature review'
  },
  
  'online image search': {
    'search images': 'Web search for images',
    'find pictures': 'Find images online',
    'image search': 'Search image results',
    'look up image': 'Search for specific image',
    'find image': 'Find images of subject',
    'find image of': 'Find images of subject',
    'show pictures': 'Display image results',
    'photo of': 'Find photos of subject',
    'pics of': 'Find pictures of subject',
    'visual search': 'Visual image search'
  },
  
  'online video search': {
    'search videos': 'Web search for videos',
    'find video': 'Find videos online',
    'video search': 'Search video results',
    'look up video': 'Search for specific video',
    'show video': 'Display video results',
    'clip of': 'Find video clips',
    'watch': 'Find videos to watch',
    'how to video': 'Find instructional videos',
    'tutorial': 'Find tutorial videos'
  },
  
  'gemini canvas': {
    'canvas': 'Open Gemini Canvas workspace',
    'gemini canvas': 'Open Gemini Canvas',
    'workspace': 'Open collaborative workspace',
    'collaborate': 'Start collaborative session',
    'whiteboard': 'Open digital whiteboard',
    'brainstorm': 'Open brainstorming canvas',
    'diagram': 'Create diagram in canvas',
    'flowchart': 'Create flowchart',
    'mindmap': 'Create mind map',
    'sketch': 'Create sketch in canvas',
    'draw on canvas': 'Draw in canvas workspace',
    'visual workspace': 'Open visual workspace',
    'interactive': 'Start interactive session',
    'create canvas': 'Create new canvas',
    'open canvas': 'Open canvas workspace',
    'new canvas': 'Create new canvas workspace',
    'project canvas': 'Open project canvas',
    'design canvas': 'Open design canvas'
  },
  
  'guided learning': {
    'teach me': 'Start guided learning session',
    'learn': 'Begin learning mode',
    'explain': 'Provide detailed explanation',
    'how does': 'Explain how something works',
    'what is': 'Define and explain concept',
    'tutorial': 'Start tutorial mode',
    'lesson': 'Begin lesson on topic',
    'course': 'Access learning course',
    'study': 'Study mode activation',
    'practice': 'Practice exercises',
    'quiz me': 'Generate practice quiz',
    'step-by-step': 'Provide step-by-step instruction guide',
    'understand': 'Explain concept with guided learning approach'
  }
};

// ============================================================================
// MENU SETUP
// ============================================================================

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔧 Normalizer')
    .addItem('📊 Normalize Current Sheet', 'normalizeCurrentSheet')
    .addItem('📋 Normalize Selected Range', 'normalizeSelectedRange')
    .addSeparator()
    .addItem('🔍 Preview Normalization (No Changes)', 'previewNormalization')
    .addItem('📈 Show Statistics', 'showStatistics')
    .addSeparator()
    .addItem('⚙️ Configure Settings', 'showSettingsDialog')
    .addItem('❓ Help', 'showHelp')
    .addToUi();
}

// ============================================================================
// MAIN NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Main entry point: Normalizes the entire active sheet
 */
function normalizeCurrentSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getActiveSheet();
  const sourceName = sourceSheet.getName();
  
  // Get all data from source sheet
  const data = sourceSheet.getDataRange().getValues();
  
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('Error: Sheet appears to be empty or has no data rows.');
    return;
  }
  
  // Perform normalization
  const result = normalizeData(data, sourceName);
  
  // Create output sheet
  createOutputSheet(ss, result.normalizedRows, result.stats);
  
  // Show completion message
  showCompletionMessage(result.stats);
}

/**
 * Normalizes only the currently selected range
 */
function normalizeSelectedRange() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getActiveSheet();
  const selection = sourceSheet.getSelection();
  const range = selection.getActiveRange();
  
  if (!range) {
    SpreadsheetApp.getUi().alert('Error: Please select a range first.');
    return;
  }
  
  const data = range.getValues();
  const sourceName = sourceSheet.getName() + '_Selection';
  
  // Perform normalization
  const result = normalizeData(data, sourceName);
  
  // Create output sheet
  createOutputSheet(ss, result.normalizedRows, result.stats);
  
  // Show completion message
  showCompletionMessage(result.stats);
}

/**
 * Preview mode: Shows what would be normalized without creating output
 */
function previewNormalization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getActiveSheet();
  const data = sourceSheet.getDataRange().getValues();
  
  const result = normalizeData(data, 'Preview');
  
  const message = `
📊 NORMALIZATION PREVIEW
========================

Source Rows Analyzed: ${result.stats.sourceRows}
Triggers Found: ${result.stats.totalTriggers}
Output Rows (1:1 mappings): ${result.stats.outputRows}
Semantic Matches: ${result.stats.semanticMatches} (${result.stats.matchRate}%)
Fallback/Generic: ${result.stats.fallbackCount}

Apps/Integrations: ${result.stats.uniqueApps}
Unique Outputs: ${result.stats.uniqueOutputs}

⚠️ This is a preview. No changes have been made.
Run "Normalize Current Sheet" to create the output.
  `;
  
  SpreadsheetApp.getUi().alert(message);
}

// ============================================================================
// CORE NORMALIZATION LOGIC
// ============================================================================

/**
 * Core normalization function
 * @param {Array} data - 2D array of source data
 * @param {string} sourceName - Name of source sheet
 * @returns {Object} - { normalizedRows: Array, stats: Object }
 */
function normalizeData(data, sourceName) {
  const normalizedRows = [];
  const stats = {
    sourceRows: 0,
    totalTriggers: 0,
    outputRows: 0,
    semanticMatches: 0,
    fallbackCount: 0,
    uniqueApps: new Set(),
    uniqueOutputs: new Set(),
    matchRate: 0
  };
  
  // Skip header row(s) - find first data row
  let startRow = 0;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const firstCell = String(data[i][0] || '').toLowerCase();
    if (CONFIG.SKIP_PREFIXES.some(prefix => firstCell.startsWith(prefix.toLowerCase()))) {
      startRow = i + 1;
    }
  }
  
  // Process each row
  for (let rowIdx = startRow; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    
    // Extract values from configured columns
    const app = String(row[CONFIG.SOURCE_COLUMNS.APP_INTEGRATION] || '').trim();
    const triggersRaw = String(row[CONFIG.SOURCE_COLUMNS.TRIGGER_PHRASES] || '');
    const outputRaw = String(row[CONFIG.SOURCE_COLUMNS.OUTPUT_BEHAVIOR] || '');
    const category = String(row[CONFIG.SOURCE_COLUMNS.CATEGORY] || '');
    const sourceRef = String(row[CONFIG.SOURCE_COLUMNS.SOURCE_REF] || '');
    const dependencies = String(row[CONFIG.SOURCE_COLUMNS.DEPENDENCIES] || '');
    
    // Skip category headers and empty rows
    if (!app || CONFIG.SKIP_PREFIXES.some(prefix => app.startsWith(prefix))) {
      continue;
    }
    
    // Skip if no trigger phrases
    if (triggersRaw.length < CONFIG.MIN_TRIGGER_LENGTH) {
      continue;
    }
    
    stats.sourceRows++;
    stats.uniqueApps.add(app);
    
    // Split triggers by delimiter
    const triggers = triggersRaw
      .split(CONFIG.TRIGGER_DELIMITER)
      .map(t => t.trim())
      .filter(t => t.length >= CONFIG.MIN_TRIGGER_LENGTH);
    
    stats.totalTriggers += triggers.length;
    
    // Parse output block into discrete behaviors
    const parsedBehaviors = parseOutputBlock(outputRaw);
    
    // Map each trigger to its specific behavior
    triggers.forEach(trigger => {
      const matchResult = matchTriggerToBehavior(trigger, app, parsedBehaviors, outputRaw);
      
      normalizedRows.push([
        app,
        trigger,
        matchResult.output,
        category,
        sourceRef,
        dependencies,
        rowIdx + 1,
        matchResult.type
      ]);
      
      stats.outputRows++;
      stats.uniqueOutputs.add(matchResult.output);
      
      if (matchResult.type === 'semantic') {
        stats.semanticMatches++;
      } else {
        stats.fallbackCount++;
      }
    });
  }
  
  // Calculate match rate
  stats.matchRate = stats.outputRows > 0 
    ? Math.round((stats.semanticMatches / stats.outputRows) * 100) 
    : 0;
  
  stats.uniqueApps = stats.uniqueApps.size;
  stats.uniqueOutputs = stats.uniqueOutputs.size;
  
  return { normalizedRows, stats };
}

/**
 * Parse output block into discrete behavioral components
 * @param {string} outputText - Raw output text
 * @returns {Array} - Array of extracted behaviors
 */
function parseOutputBlock(outputText) {
  const behaviors = [];
  
  if (!outputText || outputText === 'nan' || outputText === 'undefined') {
    return behaviors;
  }
  
  // Extract bulleted items (● • ○ ▸ →)
  const bulletPattern = /[●•○▸→✓]\s*([^\n●•○▸→✓]+)/g;
  let match;
  while ((match = bulletPattern.exec(outputText)) !== null) {
    const behavior = match[1].trim();
    if (behavior.length > 10) {
      behaviors.push({ type: 'bullet', text: behavior.substring(0, 300) });
    }
  }
  
  // Extract numbered items (1. xxx, 2. xxx)
  const numberedPattern = /\d+[\.\)]\s*([^:\n]+)/g;
  while ((match = numberedPattern.exec(outputText)) !== null) {
    const behavior = match[1].trim();
    if (behavior.length > 5) {
      behaviors.push({ type: 'numbered', text: behavior.substring(0, 200) });
    }
  }
  
  // Extract action phrases
  const actionPattern = /(Search|Show|Display|Create|Open|Find|Calculate|Generate|Play|Send|Navigate|Set|Configure|Access|Start|Enable|Disable)\s+[^,.\n]{5,60}/gi;
  while ((match = actionPattern.exec(outputText)) !== null) {
    behaviors.push({ type: 'action', text: match[0].trim() });
  }
  
  return behaviors;
}

/**
 * Match a trigger phrase to its most relevant behavior
 * @param {string} trigger - Trigger phrase
 * @param {string} app - App/integration name
 * @param {Array} parsedBehaviors - Extracted behaviors from output
 * @param {string} rawOutput - Original output text
 * @returns {Object} - { output: string, type: 'semantic'|'parsed'|'fallback' }
 */
function matchTriggerToBehavior(trigger, app, parsedBehaviors, rawOutput) {
  const triggerLower = trigger.toLowerCase().trim();
  const appLower = app.toLowerCase().trim();
  
  // Strategy 1: Check semantic rules database
  for (const [ruleApp, rules] of Object.entries(SEMANTIC_RULES)) {
    if (appLower.includes(ruleApp) || ruleApp.includes(appLower)) {
      // Exact match
      if (rules[triggerLower]) {
        return { output: rules[triggerLower], type: 'semantic' };
      }
      
      // Partial match
      for (const [ruleTrigger, ruleOutput] of Object.entries(rules)) {
        if (ruleTrigger.includes(triggerLower) || triggerLower.includes(ruleTrigger)) {
          return { output: ruleOutput, type: 'semantic' };
        }
      }
      
      // Keyword overlap match
      const triggerWords = new Set(triggerLower.split(/\s+/));
      for (const [ruleTrigger, ruleOutput] of Object.entries(rules)) {
        const ruleWords = new Set(ruleTrigger.split(/\s+/));
        const overlap = [...triggerWords].filter(w => ruleWords.has(w));
        if (overlap.length > 0) {
          return { output: ruleOutput, type: 'semantic' };
        }
      }
    }
  }
  
  // Strategy 2: Match against parsed behaviors from output block
  if (parsedBehaviors.length > 0) {
    const triggerWords = triggerLower.split(/\s+/);
    
    for (const behavior of parsedBehaviors) {
      const behaviorLower = behavior.text.toLowerCase();
      const matches = triggerWords.filter(w => w.length > 2 && behaviorLower.includes(w));
      
      if (matches.length > 0) {
        return { output: behavior.text, type: 'parsed' };
      }
    }
    
    // Return first behavior as fallback
    return { output: parsedBehaviors[0].text, type: 'parsed' };
  }
  
  // Strategy 3: Fallback - generate generic output
  return { 
    output: `Activate ${app} for: ${trigger}`, 
    type: 'fallback' 
  };
}

// ============================================================================
// OUTPUT GENERATION
// ============================================================================

/**
 * Create the normalized output sheet
 * @param {Spreadsheet} ss - Active spreadsheet
 * @param {Array} normalizedRows - Normalized data rows
 * @param {Object} stats - Statistics object
 */
function createOutputSheet(ss, normalizedRows, stats) {
  // Check if output sheet exists
  let outputSheet = ss.getSheetByName(CONFIG.OUTPUT_SHEET_NAME);
  
  if (outputSheet) {
    // Ask user if they want to overwrite
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Sheet Exists',
      `Sheet "${CONFIG.OUTPUT_SHEET_NAME}" already exists. Overwrite?`,
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      outputSheet.clear();
    } else {
      // Create with timestamp
      const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd_HHmmss');
      outputSheet = ss.insertSheet(`${CONFIG.OUTPUT_SHEET_NAME}_${timestamp}`);
    }
  } else {
    outputSheet = ss.insertSheet(CONFIG.OUTPUT_SHEET_NAME);
  }
  
  // Write headers
  outputSheet.getRange(1, 1, 1, CONFIG.OUTPUT_HEADERS.length).setValues([CONFIG.OUTPUT_HEADERS]);
  
  // Format headers
  const headerRange = outputSheet.getRange(1, 1, 1, CONFIG.OUTPUT_HEADERS.length);
  headerRange.setBackground('#4472C4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  
  // Write data
  if (normalizedRows.length > 0) {
    outputSheet.getRange(2, 1, normalizedRows.length, normalizedRows[0].length).setValues(normalizedRows);
  }
  
  // Auto-resize columns
  for (let i = 1; i <= CONFIG.OUTPUT_HEADERS.length; i++) {
    outputSheet.autoResizeColumn(i);
  }
  
  // Set column widths for readability
  outputSheet.setColumnWidth(1, 180); // App
  outputSheet.setColumnWidth(2, 200); // Trigger
  outputSheet.setColumnWidth(3, 400); // Output
  
  // Freeze header row
  outputSheet.setFrozenRows(1);
  
  // Add filter
  outputSheet.getRange(1, 1, normalizedRows.length + 1, CONFIG.OUTPUT_HEADERS.length).createFilter();
  
  // Add stats summary at bottom
  const statsRow = normalizedRows.length + 4;
  outputSheet.getRange(statsRow, 1).setValue('📊 NORMALIZATION STATISTICS');
  outputSheet.getRange(statsRow, 1).setFontWeight('bold');
  
  const statsData = [
    ['Total 1:1 Mappings', stats.outputRows],
    ['Source Rows Processed', stats.sourceRows],
    ['Total Triggers Found', stats.totalTriggers],
    ['Semantic Match Rate', `${stats.matchRate}%`],
    ['Unique Apps', stats.uniqueApps],
    ['Unique Outputs', stats.uniqueOutputs],
    ['Generated', new Date().toISOString()]
  ];
  
  outputSheet.getRange(statsRow + 1, 1, statsData.length, 2).setValues(statsData);
  
  // Activate the new sheet
  ss.setActiveSheet(outputSheet);
}

/**
 * Show completion message
 * @param {Object} stats - Statistics object
 */
function showCompletionMessage(stats) {
  const message = `
✅ NORMALIZATION COMPLETE
=========================

📊 Results:
• ${stats.outputRows} trigger→behavior mappings created
• ${stats.semanticMatches} semantic matches (${stats.matchRate}%)
• ${stats.uniqueApps} apps/integrations
• ${stats.uniqueOutputs} unique outputs

📋 Output saved to sheet: "${CONFIG.OUTPUT_SHEET_NAME}"
  `;
  
  SpreadsheetApp.getUi().alert(message);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Show statistics for current sheet
 */
function showStatistics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getActiveSheet();
  const data = sourceSheet.getDataRange().getValues();
  
  let totalCells = 0;
  let emptyCells = 0;
  let triggerCells = 0;
  let estimatedTriggers = 0;
  
  data.forEach((row, idx) => {
    row.forEach((cell, colIdx) => {
      totalCells++;
      if (!cell || String(cell).trim() === '') {
        emptyCells++;
      }
      
      // Count triggers in column B (index 1)
      if (colIdx === CONFIG.SOURCE_COLUMNS.TRIGGER_PHRASES && cell) {
        const cellStr = String(cell);
        if (cellStr.includes(CONFIG.TRIGGER_DELIMITER)) {
          const count = cellStr.split(CONFIG.TRIGGER_DELIMITER).filter(t => t.trim()).length;
          estimatedTriggers += count;
          triggerCells++;
        } else if (cellStr.trim().length > 2) {
          estimatedTriggers++;
          triggerCells++;
        }
      }
    });
  });
  
  const message = `
📊 SHEET STATISTICS
===================

Sheet: ${sourceSheet.getName()}
Total Rows: ${data.length}
Total Cells: ${totalCells}
Empty Cells: ${emptyCells}
Cells with Triggers: ${triggerCells}
Estimated Total Triggers: ${estimatedTriggers}

Expected output rows after normalization: ~${estimatedTriggers}
  `;
  
  SpreadsheetApp.getUi().alert(message);
}

/**
 * Show help dialog
 */
function showHelp() {
  const help = `
🔧 TRIGGER MATRIX NORMALIZER - HELP
====================================

PURPOSE:
Transform bundled trigger-output data into 1:1 mappings.

HOW TO USE:
1. Open your source sheet with trigger data
2. Use the Normalizer menu:
   • "Normalize Current Sheet" - Process entire sheet
   • "Normalize Selected Range" - Process selection only
   • "Preview Normalization" - See results without changes
   • "Show Statistics" - View sheet metrics

EXPECTED SOURCE FORMAT:
Column A: App/Integration name
Column B: Trigger phrases (semicolon-separated)
Column C: Expected output/behavior
Column D: Category (optional)
Column E: Source reference (optional)
Column F: Dependencies (optional)

OUTPUT:
Creates new sheet with one row per trigger:
[App] | [Single Trigger] | [Specific Output] | ...

CUSTOMIZATION:
Edit the CONFIG object at the top of the script to:
• Change column mappings
• Modify trigger delimiter
• Adjust output sheet name

Add custom semantic rules to SEMANTIC_RULES object.
  `;
  
  SpreadsheetApp.getUi().alert(help);
}

/**
 * Show settings dialog (placeholder for future enhancement)
 */
function showSettingsDialog() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '⚙️ Settings',
    'Current configuration:\n\n' +
    `• Trigger Column: ${String.fromCharCode(65 + CONFIG.SOURCE_COLUMNS.TRIGGER_PHRASES)}\n` +
    `• Output Column: ${String.fromCharCode(65 + CONFIG.SOURCE_COLUMNS.OUTPUT_BEHAVIOR)}\n` +
    `• Delimiter: "${CONFIG.TRIGGER_DELIMITER}"\n` +
    `• Output Sheet: "${CONFIG.OUTPUT_SHEET_NAME}"\n\n` +
    'To modify settings, edit the CONFIG object in the script editor.',
    ui.ButtonSet.OK
  );
}

// ============================================================================
// BATCH PROCESSING UTILITIES
// ============================================================================

/**
 * Process multiple sheets at once
 * @param {Array} sheetNames - Array of sheet names to process
 */
function normalizeMultipleSheets(sheetNames) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allResults = [];
  
  sheetNames.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const result = normalizeData(data, sheetName);
      allResults.push(...result.normalizedRows);
    }
  });
  
  // Combine all results
  if (allResults.length > 0) {
    const combinedStats = {
      sourceRows: allResults.length,
      totalTriggers: allResults.length,
      outputRows: allResults.length,
      semanticMatches: allResults.filter(r => r[7] === 'semantic').length,
      fallbackCount: allResults.filter(r => r[7] === 'fallback').length,
      uniqueApps: new Set(allResults.map(r => r[0])).size,
      uniqueOutputs: new Set(allResults.map(r => r[2])).size,
      matchRate: 0
    };
    combinedStats.matchRate = Math.round((combinedStats.semanticMatches / combinedStats.outputRows) * 100);
    
    createOutputSheet(ss, allResults, combinedStats);
  }
}

/**
 * Add custom semantic rule programmatically
 * @param {string} app - App name (lowercase)
 * @param {string} trigger - Trigger phrase (lowercase)
 * @param {string} output - Expected output behavior
 */
function addSemanticRule(app, trigger, output) {
  if (!SEMANTIC_RULES[app]) {
    SEMANTIC_RULES[app] = {};
  }
  SEMANTIC_RULES[app][trigger.toLowerCase()] = output;
}

// ============================================================================
// END OF SCRIPT
// ============================================================================
