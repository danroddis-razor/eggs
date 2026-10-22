---
id: clients-and-projects
status: approved
dependsOn: [time-today]
---

# Feature
A person adds clients by name. A person adds projects under a client. Each project has an hourly rate in pounds and a billable flag. The project picker on [time-today](../time-today/time-today.spec.md) lists these projects grouped by client, in place of the fixed short list. When there are no projects yet, the picker offers Admin, Client work and Internal under a client called Eggs. Today's total also shows the billable amount: billable hours times each project's rate. A project can be archived, which hides it from the picker but keeps its entries.

# Intention & objectives
A person who bills by the hour organises time by client and project, so each hour carries the right rate and billable flag when they bill or report it later. Clients and projects come after time-today's core loop, before reports and weeks.

# In scope — acceptance criteria
- **AC1 —** A person adds a client by name. _(Scenario: "Add a client by name")_
- **AC2 —** A person adds a project under a client with an hourly rate in pounds and a billable flag. _(Scenario: "Add a project under a client")_
- **AC3 —** The project picker lists projects grouped by client, in place of the fixed short list. When a person starts a typed entry and projects exist, the first listed project is chosen first. When no projects exist, Admin, Client work and Internal appear under client Eggs and Admin is chosen first. _(Scenario: "Pick a project grouped by client")_
- **AC4 —** When there are no projects yet, the picker offers Admin, Client work and Internal under a client called Eggs. _(Scenario: "No projects yet shows the Eggs client")_
- **AC5 —** Today's total shows the billable amount: for each billable project, its hours today times its own rate, added together. _(Scenario: "Day's total shows the billable amount")_
- **AC6 —** A project can be archived, which hides it from the picker but keeps its entries. _(Scenario: "Archive a project")_
- **AC7 —** A rate shows in pounds with two decimals. _(Scenario: "Rate shows pounds with two decimals")_

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
When the person adds a project named "Design" under client "Acme" with rate £75.00 and billable
Then the project list shows "Design" under client "Acme" with rate £75.00 and billable, and announces billable to screen readers
```

```gherkin
Scenario: Pick a project grouped by client
Given projects exist under clients
When the person opens the project picker
Then the picker shows projects grouped by client
```

```gherkin
Scenario: No projects yet shows the Eggs client
Given no projects exist
When the person opens the project picker
Then the picker shows Admin, Client work and Internal under client "Eggs"
```

```gherkin
Scenario: Day's total shows the billable amount
Given today has entries on billable and non-billable projects
When the page shows today's total
Then the billable amount equals billable hours times each project's rate
```

```gherkin
Scenario: Archive a project
Given a project named "Design" under client "Acme"
When the person archives project "Design"
Then "Design" is hidden from the project picker
And its entries remain
```

```gherkin
Scenario: Rate shows pounds with two decimals
Given a project has rate 75
When the rate is shown
Then it shows £75.00
```
