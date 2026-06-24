# CLAUDE.md

Guidance for Claude Code (and any AI assistant) working in this repository.

## Coding Guidelines (Andrej Karpathy style)

### 1. Think before coding
- Understand the problem fully before writing a single line. Read the
  relevant code, trace how it actually runs, and state the root cause in
  plain words before proposing a fix.
- Form a clear mental model of inputs, outputs, and edge cases. If the
  requirement is ambiguous, ask rather than guess.
- Prefer a short plan over an immediate diff. Know *why* a change is
  correct before making it.

### 2. Simplicity first
- Write the simplest thing that works. Clear, boring code beats clever code.
- Avoid premature abstraction, unnecessary layers, and speculative
  "might need it later" generality. Solve the problem in front of you.
- Fewer lines, fewer dependencies, fewer moving parts. Delete code when you can.
- Optimize for readability — code is read far more often than it is written.

### 3. Surgical changes
- Make the smallest change that fully solves the problem. Touch only what
  the task requires.
- Don't reformat, rename, or refactor unrelated code in the same change —
  keep diffs focused and reviewable.
- Match the surrounding style, naming, and conventions of the existing code.
- Every line in a diff should be there for a reason you can explain.

### 4. Goal-driven execution
- Keep the actual goal in mind at every step; don't drift into tangents or
  gold-plating.
- Verify the change does what it's supposed to — run it, test it, observe
  the result. Don't claim something works without checking.
- Report outcomes honestly: if something fails or was skipped, say so.
- Stop when the goal is met. Done and verified beats endlessly polished.

## Project Notes
- This is the Al-Ihsaan Hifz Tracker, a single-file web application
  (`index.html`).
- Changes should preserve the existing structure and behavior unless the
  task explicitly calls for otherwise.
