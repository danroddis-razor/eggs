---
id: time-today
status: approved
dependsOn: [egg-page]
---

# Feature
One page tracks time today. A person types what they are working on, picks a project from a short list, starts a timer and stops it. Today's entries show in a list with each duration and the day's total. A person can add an entry by hand with a duration, edit an entry, and delete one with an undo. Entries stay after a reload. The page keeps the egg emoji and the word 'Eggs' from the egg page as a centered header.

# Intention & objectives
A person who bills by the hour records where their day goes while they work, so the hours are right when they bill or report them later. This first slice proves the core loop for one day: start, stop, correct and total. Projects, clients, weeks and reports come in later slices.

# In scope — acceptance criteria
- **AC1 —** The header shows one egg emoji and the word 'Eggs'. _(Scenario: "Eggs header")_
- **AC2 —** A person types what they are working on and starts a timer, and Admin is chosen first. _(Scenario: "Start a typed entry")_
- **AC3 —** A person picks a project from the short list of Admin, Client work or Internal for an entry. _(Scenario: "Pick a project for an entry")_
- **AC4 —** Starting and stopping a timer records the entry's duration. _(Scenario: "Start and stop a timer")_
- **AC5 —** Today's entries show in a list, each with its duration, and the day's total appears beneath the list. When today has no entries, the list says "No time tracked today." and the total reads 0:00. _(Scenario: "List today's entries and the day's total")_
- **AC6 —** A person adds an entry by hand with a duration. _(Scenario: "Add an entry by hand")_
- **AC7 —** A person edits an entry's work and duration. _(Scenario: "Edit an entry")_
- **AC8 —** A person deletes an entry and can undo the delete. _(Scenario: "Delete an entry with undo")_
- **AC9 —** Entries stay after a reload. _(Scenario: "Entries stay after a reload")_

# Out of scope
Entries for days other than today, a project list beyond today's short list, reports, tags, clients, invoicing, user accounts, sharing, and exporting.

# Contract
Inputs: the work the person types, a project chosen from the short list, start, stop, edit and delete actions, a manual duration from 0:01 to 24:00, and an undo choice.
Outputs: today's entry list with durations, the day's total, a running timer display, an undo offer after a delete, and an error message when an action fails.
State mutations: each start, stop, add, edit or delete saves the entry before the action returns. A saved entry remains after a reload. If a reload interrupts a save, the entry keeps its last fully saved state.

# Scenarios (Gherkin)

```gherkin
Scenario: Eggs header
Given the page loads
When no further action is taken
Then one egg emoji and the word 'Eggs' appear together as the page header
```

```gherkin
Scenario: Start a typed entry
Given today's list is empty
When the person types what they are working on and starts the timer
Then Admin is chosen first for the entry
And the entry shows the typed work
And the entry appears with a running timer
```

```gherkin
Scenario: Pick a project for an entry
Given an entry exists with Admin chosen
When the person picks Client work from the short list
Then the entry shows Client work
```

```gherkin
Scenario: Start and stop a timer
Given an entry shows a running timer
When the person stops the timer
Then the entry shows a duration equal to the elapsed time between starting and stopping
And the timer no longer runs
```

```gherkin
Scenario: List today's entries and the day's total
Given two entries exist for today
When the page loads
Then the list shows each entry with its duration
And the day's total equals the sum of the entries' durations
```

```gherkin
Scenario: Add an entry by hand
Given today's list is empty
When the person adds an entry by hand with a duration
Then the entry appears in today's list with that duration
```

```gherkin
Scenario: Edit an entry
Given an entry exists
When the person edits its work and its duration
Then the entry shows the escaped edited work and duration
```

```gherkin
Scenario: Delete an entry with undo
Given an entry exists for today
When the person deletes the entry
Then the entry is removed from today's list
And an undo appears and is announced to screen readers and reachable by keyboard
When the person chooses undo
Then the entry reappears in today's list
```

```gherkin
Scenario: Entries stay after a reload
Given an entry exists for today
When the page reloads
Then the entry still appears with its work, its project and its duration
```
