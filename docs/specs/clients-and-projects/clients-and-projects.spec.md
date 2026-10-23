---
id: clients-and-projects
status: draft
dependsOn: [time-today]
---

# Feature
A person adds clients by name. A person adds projects under a client. Each project has an hourly rate in pounds and a billable flag. The project picker on [time-today](../time-today/time-today.spec.md) lists these projects grouped by client, in place of the fixed short list. When there are no projects yet, the picker offers Admin, Client work and Internal under a client called Eggs. Today's total also shows the billable amount: billable hours times each project's rate. A project can be archived, which hides it from the picker but keeps its entries.

# Intention & objectives
A person who bills by the hour organises time by client and project, so each hour carries the right rate and billable flag when they bill or report it later. Clients and projects come after [time-today](../time-today/time-today.spec.md)'s core loop, before reports and weeks.

# In scope — acceptance criteria
- **AC1 —** A person adds a client by name only when no client with that name already exists. Adding a duplicate client is denied. _(Scenario: "Add a client by name")_
- **AC2 —** A person adds a project under a client with an hourly rate in pounds and a billable flag. _(Scenario: "Add a project under a client")_
- **AC3 —** The project picker lists projects grouped by client, in place of the fixed short list. Clients and projects appear in the order they were added. When a person starts a typed entry and projects exist, the first project under the first client is chosen first, and this replaces time-today's Admin-first default once any project exists.  While no projects exist, Admin stays first and is chosen first when a typed entry starts. _(Scenario: "Pick a project grouped by client")_
- **AC4 —** When there are no projects yet, the picker offers Admin, Client work and Internal under a client called Eggs. _(Scenario: "No projects yet shows the Eggs client")_
- **AC5 —** Today's total shows the sum of today's entry durations, and a separate billable amount shows each billable project's hours today times its own rate, added together. _(Scenario: "Day's total shows the billable amount", Scenario: "Billable amount from one billable entry")_
- **AC6 —** A project can be archived, which hides it from the picker but keeps its entries. _(Scenario: "Archive a project")_
- **AC7 —** A rate shows in pounds with two decimals. _(Scenario: "Rate shows pounds with two decimals")_
- **AC8 —** An entry keeps the project it was made with, and Admin, Client work and Internal stay in the picker while any entry uses them. _(Scenario: "An entry keeps its project after more projects are added")_
- **AC9 —** The clients page uses the eggs-web look, as time-today does: the same page background, text colour and font, and its Add client and Add project buttons in the same filled style as the Start button on time-today, reachable by keyboard and announced to screen readers. _(Scenario: "Clients page uses the eggs-web look")_

# Out of scope
Editing or deleting a client. Unarchiving a project. Entries for days other than today. Reports, invoicing, currency other than pounds, user accounts, sharing and exporting.

# Contract
Inputs: a client name of up to 100 characters, a project name under a client, an hourly rate in pounds, a billable flag, an archive choice, and a project choice from the picker.
Outputs: the client list, the project list grouped by client, the default Eggs client with Admin, Client work and Internal, today's entry list with durations, the day's total and the billable amount, and an error message when an action fails.
State mutations: each saved client, project or archive is saved before the action returns. Archiving a project hides it from the picker and keeps its entries. A saved entry remains after a reload.

# Scenarios (Gherkin)

```gherkin
Scenario: Add a client by name
Given no clients exist
When the person adds a client named "Acme"
Then the client list shows "Acme" as plain text
```

```gherkin
Scenario: Add a project under a client
Given a client named "Acme" exists
When the person adds a project named "Design" under client "Acme" with rate £75.00, which must be zero or more, and billable
Then the project list shows "Design" under client "Acme" with rate £75.00 and billable, and announces billable to screen readers
```

```gherkin
Scenario: Pick a project grouped by client
Given projects exist under clients
When the person opens the project picker
Then the picker shows projects grouped by client
And when the person starts a typed entry, the first listed project is chosen first
```

```gherkin
Scenario: No projects yet shows the Eggs client
Given no projects exist
When the person opens the project picker
Then the picker shows Admin, Client work and Internal under client "Eggs"
And Admin is chosen first when a typed entry starts
```

```gherkin
Scenario: Day's total shows the billable amount
Given today has entries on billable and non-billable projects
When the page shows today's total
Then for each billable project, its hours today times its own rate are added together to give the billable amount
```

```gherkin
Scenario: Billable amount from one billable entry
Given today has no entries
When the person adds an entry by hand with duration 1:00 on project "Design" at £75.00 and billable
Then today's list shows the entry with duration 1:00
And the billable amount is £75.00
```

```gherkin
Scenario: Archive a project
Given a project named "Design" under client "Acme"
When the person archives project "Design"
Then "Design" is hidden from the project picker
And the archive is announced to screen readers and reachable by keyboard
And its entries remain
```

```gherkin
Scenario: Rate shows pounds with two decimals
Given a project has rate 75
When the rate is shown
Then it shows £75.00
```

```gherkin
Scenario: Clients page uses the eggs-web look
Given the person opens the clients page
Then the page background, text colour and font match time-today, and the Add client and Add project buttons use the same filled style as time-today's Start button

```

```gherkin
Scenario: An entry keeps its project after more projects are added
Given no projects exist
When the person makes an entry on Admin
And the person adds client "Acme"
And the person adds project "Design" under client "Acme"
Then the entry still shows Admin
And Admin, Client work and Internal still appear in the project picker
```
