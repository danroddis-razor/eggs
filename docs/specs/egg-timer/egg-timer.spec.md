---
id: egg-timer
status: approved
dependsOn: []
---

# Feature
A page where a person picks how to boil their egg — soft, medium, or hard — starts a countdown, and sees a clear message when the egg is ready.

The egg timer page adopts the `eggs-web` blueprint.

# Intention & objectives
Let a person know how long to boil their egg and when to take it out, on one small page. The person picks a doneness, presses Start, watches a countdown, and reads a message when the egg is ready.

# In scope — acceptance criteria
- **AC1 —** The page shows three options: soft, medium, and hard boiled. _(Scenario: "Three doneness options visible")_
- **AC2 —** Selecting an option marks it as the current choice. _(Scenario: "Selecting an option marks it")_
- **AC3 —** Pressing Start begins a countdown for the selected doneness. _(Scenario: "Start begins countdown")_
- **AC4 —** The countdown shows the remaining time in minutes and seconds and decreases by one second each second. _(Scenario: "Countdown decreases each second")_
- **AC5 —** The countdown for soft boiled lasts 6 minutes. _(Scenario: "Soft boiled duration")_ _(assumed)_
- **AC6 —** The countdown for medium boiled lasts 9 minutes. _(Scenario: "Medium boiled duration")_ _(assumed)_
- **AC7 —** The countdown for hard boiled lasts 12 minutes. _(Scenario: "Hard boiled duration")_ _(assumed)_
- **AC8 —** When the countdown reaches zero the page shows a message that the egg is ready. _(Scenario: "Ready message at zero")_

# Out of scope
Nothing waits yet.

# Contract
Inputs: the person's selection of doneness (soft, medium, or hard) and a press of Start. Outputs: a countdown of remaining time in minutes and seconds, and a ready message when the countdown ends. State mutations: None.

# Scenarios (Gherkin)
```gherkin
Scenario: Three doneness options visible
Given the egg timer page loads
When no further action is taken
Then the page shows three options labelled soft, medium, and hard boiled
```

```gherkin
Scenario: Selecting an option marks it
Given the egg timer page loads
When the person selects medium boiled
Then medium boiled is marked as the current choice
```

```gherkin
Scenario: Start begins countdown
Given the person has selected soft boiled
When the person presses Start
Then a countdown begins from 6 minutes 00 seconds
```

```gherkin
Scenario: Countdown decreases each second
Given the countdown is running and shows 6 minutes 00 seconds
When one second passes
Then the countdown shows 5 minutes 59 seconds
```

```gherkin
Scenario: Soft boiled duration
Given the person has selected soft boiled
When the person presses Start
And the countdown runs to zero
Then the countdown started at 6 minutes 00 seconds
```

```gherkin
Scenario: Medium boiled duration
Given the person has selected medium boiled
When the person presses Start
And the countdown runs to zero
Then the countdown started at 9 minutes 00 seconds
```

```gherkin
Scenario: Hard boiled duration
Given the person has selected hard boiled
When the person presses Start
And the countdown runs to zero
Then the countdown started at 12 minutes 00 seconds
```

```gherkin
Scenario: Ready message at zero
Given the countdown is running and shows 0 minutes 01 second
When one second passes
Then the page shows a message that the egg is ready
```
