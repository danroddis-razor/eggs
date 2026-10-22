---
id: egg-page
status: approved
dependsOn: []
---

# Feature
A page shows one egg emoji in the middle. Below it, the word 'Eggs' appears in sans-serif text.

# Intention & objectives
The page lets a visitor see an egg emoji centered on the screen. The word 'Eggs' sits under it in a plain sans-serif typeface.

# In scope — acceptance criteria
- **AC1 —** One egg emoji appears centered on the page. _(Scenario: "Centered egg emoji")_
- **AC2 —** The word 'Eggs' appears below the emoji in sans-serif text. _(Scenario: "Eggs text below emoji")_
- **AC3 —** Today's date appears below the word 'Eggs'. _(Scenario: "Today's date shown")_

# Out of scope
Nothing waits yet.

# Contract
Inputs: None. Outputs: one centered egg emoji and the word 'Eggs' in sans-serif text below it. State mutations: None.

# Scenarios (Gherkin)
```gherkin
Scenario: Centered egg emoji
Given the egg page loads
When no further action is taken
Then a single egg emoji appears centered on the page
```

```gherkin
Scenario: Eggs text below emoji
Given the egg page loads
When no further action is taken
Then the word 'Eggs' appears below the emoji in sans-serif text
```

```gherkin
Scenario: Today's date shown
Given the egg page loads
When no further action is taken
Then today's date appears below the word 'Eggs'
```
