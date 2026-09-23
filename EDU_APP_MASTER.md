# EDU_APP_MASTER.md

## 1. Project purpose
Build a very simple educational app prototype for children around ages 4-8, initially tested by the user with their own child.

Primary goals:
- practice basic math
- develop logic
- train memory
- keep sessions short, simple and attractive
- use a mobile-first web app as the first version
- preserve an easy path to a future native mobile app

## 2. Current MVP scope
For the current prototype:
- no login
- no parent account
- no rewards
- no avatars
- no color customization
- no payments
- no database required yet
- child enters only their name
- one task per screen
- immediate feedback:
  - "Super!"
  - "Spróbuj jeszcze raz"
- calm, light, muted colors
- large typography and large touch targets
- designed primarily for phone use
- hosted through GitHub + Railway

## 3. Current prototype flow
1. Welcome screen
2. Child enters name
3. Child starts session
4. One task per screen
5. Immediate feedback after each answer
6. Progress indicator
7. Finish screen

## 4. Current task areas
Main task categories:
- math
- logic
- coding
- memory

Current / planned subcategories:
- math:
  - addition
  - subtraction
  - missing_number
- logic:
  - logical_sequence
  - odd_one_out
  - sudoku_4x4
  - pattern_copying
- coding:
  - symbol_decoding
- memory:
  - image_memory (temporarily excluded from the current prototype)

Task hierarchy:
category -> subcategory -> skill -> difficulty -> task

Temporarily excluded from the current prototype:
- image_memory

Reason:
- the first child test showed that the interaction was not sufficiently clear and the display time felt too short

## 5. Important interaction rules

### Feedback
- feedback must never overlay or cover answer controls
- feedback should appear in a reserved area within the task screen
- wrong answer: keep the task visible and allow immediate retry
- selected wrong answer may receive a short visual highlight
- correct answer receives positive visual highlight before advancing

### Math with dots
- numbers and equation are the main task
- dots are only a visual hint
- dots should be smaller and secondary
- child should solve the numeric equation first

### Subtraction
- subtraction should also include a visual hint
- current direction: a friendly gnome character "takes away" the subtracted amount
- removed items should be visibly crossed out / faded so the child can see what remains
- the character should support understanding, not dominate the task

### Missing value / missing element
- the target place must be visually highlighted
- a question mark alone is not enough
- use a distinct background/border to clearly show where the child should focus

### Coding
- legend must remain visible
- child must not need to memorize symbol-letter mappings
- child chooses letters using an in-app letter keypad
- do not use native text inputs for the answer because the phone keyboard must not open
- show filled letter boxes in the app itself
- provide an in-app delete/backspace control

### Pattern copying / logic
- show a reference dot-grid pattern
- show a blank editable grid below
- child recreates the pattern by selecting / coloring dots
- do not use multiple-choice pattern matching for this task type

### Sudoku
- the missing target cell must be clearly highlighted


### Read-aloud accessibility
- every task should offer a clear speaker button so a child can hear the instruction without adult help
- the app should read the child-facing instruction and, when useful, the essential task context
- reading should start only after the child taps the speaker button
- MVP should use the browser/device `SpeechSynthesis` API first, with Polish language (`pl-PL`) and a suitable available voice
- do not require ElevenLabs or another paid TTS provider for the MVP
- keep the speech layer abstracted so a higher-quality provider such as ElevenLabs can replace browser TTS later without changing task data or UI structure
- task data should support a dedicated `speech_text` / `speechText` value when the spoken wording should differ from the on-screen instruction
- the speaker control should be large, obvious and available consistently on every task screen

## 6. UX principles
- one clear action per screen
- minimal reading burden
- avoid clutter
- no unnecessary menus
- no pressure mechanics
- no punishment for mistakes
- no addictive infinite loop
- short sessions
- immediate understandable feedback
- interaction must work comfortably on a phone
- tasks should feel closer to good printable worksheets translated into interactive digital form

## 7. Technical direction
Current prototype:
- static/mobile-first web app
- HTML/CSS/JavaScript is acceptable for first test
- GitHub repository: LuncherBox/matmakids
- Railway deployment
- Railway public domain is sufficient for testing
- no backend/database needed until results/history become necessary
- changes committed to main should be deployed by Railway automatically

Future architecture should preserve migration to:
- PWA
- shared backend/API
- future iOS/Android app
- reusable task database

## 8. Future product direction
Later versions may include:
- parent account
- child profiles
- daily task/minute limits
- points
- parent-defined rewards
- streak/calendar
- adaptive difficulty
- progress reporting for parents
- paid access
- new educational domains such as:
  - money
  - investing
  - general knowledge
  - facts to remember

These are future directions and should not inflate the current prototype unless explicitly approved.

## 9. Data convention
All technical keys, table names, enums and JSON key-value structures should be in English.

Child-facing content can be in Polish.

Task objects should use:
- category - one of the 4 main categories: math, logic, coding, memory
- subcategory - the concrete task type within the category
- skill - the specific ability being trained
- difficulty - difficulty within that skill, not the child's global level

Do not use min_age / max_age as task-selection constraints. Child level is tracked separately and should drive adaptive task selection.

## 10. Conversation split

### CHAT A - APP BUILD / UI / UX
Scope:
- product flow
- screens
- UI
- UX
- interaction design
- navigation
- feedback
- session mechanics
- responsive/mobile layout
- frontend implementation
- GitHub
- Railway
- technical architecture
- future PWA/native migration

Do not use this chat to build the task bank in detail.

When a task interaction impacts UI, document only the interaction requirement and sync it into this master file.

### CHAT B - TASKS / EDUCATIONAL CONTENT
Scope:
- task ideas
- math
- logic
- memory
- sudoku
- coding
- task difficulty
- task wording
- correct answers
- hints
- educational quality
- task JSON/data structures
- future content domains

Do not redesign application navigation or visual system here.

When a task requires a new interaction type or UI capability, record that requirement in this master file so CHAT A can implement it.

## 11. Shared-context rule
Both chats should treat this file as the source of truth for project-wide decisions.

At the start of substantial work:
- check the latest version of this file

Update this file when:
- a project-wide decision changes
- a new interaction type is approved
- MVP scope changes
- technical direction changes
- UI rules change
- task schema changes in a way that affects the app

Do not update it for:
- individual task wording
- small styling experiments
- temporary ideas
- unapproved options

## 12. Current priority
The current priority is not full product architecture.

The current priority is:
1. create a usable phone prototype
2. test it with the user's child
3. observe what works and what does not
4. iterate from real behavior
5. only then expand architecture and content volume
