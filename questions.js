/*
  questions.js — the question bank, plus the handful of settings that go
  with it (your name/handle, the loading photos).

  This is the ONE file to edit when you rewrite the prompts in your own
  voice. Nothing else in the app needs to change.

  Each entry:
    key      unique id, used to store the answer — don't reuse across entries
    label    the all-caps line label printed on the receipt (keep it short,
             it has to fit on one line next to the answer)
    prompt   the question shown on the form
    type     "text"  → a text input
             "num"   → a number input
             "pick"  → a row of tap-to-select chips (needs `options`)
    ph       placeholder text shown in an empty text/number input (optional)
    options  array of choices, only for type "pick"
    suffix   text appended after the chosen option on the receipt, e.g. "/5"
             (optional, "pick" only)
    display  omit for a normal row. Set to "bottom" on at most one question to
             pin it as the very last line, right before "SEE YOU NEXT
             MONTH" (this is where CARDHOLDER used to sit by default).

  Every question prints a line whether it's answered or not — an unanswered
  one just shows "LABEL:" with nothing after it. That's deliberate, it's how
  the reference receipt looks before you've filled everything in.

  NAME AND HANDLE ARE NOT QUESTIONS. They're typed straight into the form's
  header (the two fields under "MONTH OF …") and remembered on the device,
  so they're entered once rather than re-typed every month. A name isn't a
  fact about a particular month, and it would have eaten one of the ten
  rows that make the form fit on a single screen.
*/

const MAXLEN = 22; // longer answers get clipped on the receipt line — raise
                    // this if you widen the receipt, but test it first

// Fallback name, used only until someone types their own into the form.
const NAME = "YOUR NAME";

// The fixed handle under the barcode, on every receipt regardless of who
// filled it in.
const HANDLE = "@CATHERINEE.MD";

// Your own pictures, printed inside the little receipt on the loading
// screen. Drop files in assets/loading/ and list them here — the screen
// cycles to the next one each time. Leave it empty and the receipt still
// prints, just without a photo. See assets/loading/README.md.
const LOADING_PHOTOS = [
  // "assets/loading/one.jpg",
  // "assets/loading/two.jpg",
];

const QUESTIONS = [
  { key: "food",    label: "TOP FOOD", prompt: "Favourite snack/meal this month?", type: "text", ph: "malatang  " },
  { key: "DRINK",    label: "TOP DRINK", prompt: "Favourite drink?",                 type: "text", ph: "molly tea" },
  { key: "SONG", label: "TOP SONG", prompt: "What's your theme song this month?",          type: "text",  ph: "haru haru" },
  { key: "watched", label: "HOBBIES",        prompt: "Any new hobbies or activities?",                       type: "text", ph: "hiking, snorkelling" },
  { key: "cortisol lvls",    label: "CORTISOL LVL",        prompt: "Any breakdowns/bad days?",           type: "text", ph: "high or low" },
  { key: "best",    label: "HIGHLIGHT",    prompt: "Best thing that happened?",                         type: "text", ph: "beach at 6am" },
  { key: "WHACK",   label: "WORST MOMENT",      prompt: "What went wrong this month?",                             type: "text", ph: "job apps" },
  { key: "mood",    label: "AVERAGE MOOD",           prompt: "Your mood most days?",                              type: "text", ph: "happy or tired " },
  { key: "goal",    label: "GOAL NEXT MONTH?",     prompt: "What do you want more of next month?",              type: "text", ph: "more side quests" },
  { key: "rating",  label: "MONTHLY RATING", prompt: "Rate the month out of five.",                       type: "text", ph: "2/5", display: "bottom" },
];
