# Computable: a readable state diagram for big machines — design

Date: 2026-11-12. Status: approved in chat by Wellmmer.
Parent spec: `2026-11-11-computable-r1-design.md`, section 5.1 (the state diagram).

## The problem

The 2016 example machine has 15 states and 130 rules. Its whole diagram fits in the panel only at about a quarter of the normal size, so no label can be read. The diagram has no zoom and no pan. The picture is also crowded: some arrows hold 4 to 8 rules, such as `w→w,R y→y,R z→z,R x→x,R`.

## What changes

### 1. Shorter arrow labels (every machine)

- On one arrow, rules that write the symbol they read and share a move join into one label: `w→w,R y→y,R z→z,R x→x,R` becomes `w y z x → R`.
- A rule that writes another symbol keeps the full form: `1→0,L`.
- Turing 1936 rules on one arrow join when they have the same operations: `0 1 → R`.
- The blank shows as it does today, and so do Turing's "any" and "blank" matchers.
- The labels keep the rule table's order.

### 2. When the diagram follows the run

- The page works out the zoom that shows the whole machine in the panel. If the arrow text would be smaller than 11 px on screen at that zoom, the diagram follows the run. Otherwise it shows the whole machine, as today.
- More machines follow than first planned (checked in the plan's scratch copy, 2026-11-12). At 1440 px, Palindrome and Turing 1936 follow too, because their text is 10.2 px. At 390 px, all four examples follow. Wellmmer chose to keep 11 px on 2026-11-12. The limit is one constant, so it is easy to change.
- While following, the view shows the current state, the states that its rules go to, and the arrows between them. The view is never zoomed past the zoom the panel uses for small machines today. If the next states do not fit with 11 px text, the view keeps the current state and its text, and some next states fall outside.
- While following, only the arrows that leave the current state keep their labels and full color. All other arrows fade to a light grey and lose their labels. "Whole machine" shows every arrow and label in full color, as today. Wellmmer chose this on 2026-11-12, after the 2016 screenshots showed overlapping labels.
- The view moves when the current state changes. It slides for 300 ms. With reduced motion on, it jumps.
- At the top speed, the view moves at most twice a second, and it jumps instead of sliding.
- The decision is made again when the machine changes (an edit, a new machine) and when the panel changes size.

### 3. Buttons above the diagram (every machine)

- Zoom in, Zoom out, and Whole machine.
- "Follow the run" shows only when following applies (section 2). It is a toggle: pressed while following.
- A drag, a wheel zoom or a pinch by hand stops following, and the toggle shows as not pressed. Zoom in, Zoom out and Whole machine stop following too.
- Pressing "Follow the run" follows again.
- Reset, a new machine, an edit or an example turn following on again, when it applies.

### 4. Mouse, touch and keys

- Mouse: dragging moves the diagram. The plain wheel scrolls the page. Ctrl or ⌘ with the wheel zooms, and so does a trackpad pinch.
- Touch: one finger scrolls the page. Two fingers move and pinch-zoom the diagram. The page must never get stuck on the diagram.
- If React Flow cannot tell one finger from two, the fallback is a "Move the diagram" toggle. Touch moves the diagram only while it is on. The plan checks this in a real browser before choosing.
- Keys: the diagram still takes no keys, so Space and the arrows still run the machine. The buttons are normal buttons in the tab order, with names for screen readers. No new keyboard shortcut.
- Screen readers still get one picture named "State diagram of <name>".

### 5. How it is built

- React Flow's own zoom and pan, already loaded. No new library.
- Three pure functions with unit tests:
  - joining the rules of one arrow into its label;
  - deciding if the diagram should follow, from the panel size, the layout size and the label size;
  - picking the states to show while following.
- The diagram component keeps whether the visitor stopped following. The simulator store does not change, except to tell the diagram about Reset and loads if it needs to.
- Playwright tests on the 2016 machine:
  - after one step, the arrow text near the current state is at least 11 px tall on screen;
  - Whole machine shows all 15 states inside the panel;
  - the plain wheel over the diagram scrolls the page;
  - a drag stops following, and "Follow the run" starts it again;
  - with reduced motion, the view jumps.
- Playwright tests on Binary +1: the toggle is not shown, and the diagram looks as today.
- The axe check stays at 0 violations.

## Not in this design

- A new layout with fewer crossing lines.
- Moving states by hand.
- Switching a machine between modern and 1936 notation.
