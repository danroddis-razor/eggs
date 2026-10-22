Augments: [egg-page.spec.md](egg-page.spec.md)

# End-to-end test infrastructure

End-to-end tests exercise the egg page through its public contract: the egg emoji and the word 'Eggs' below it. A test runner drives the page and checks those outcomes. The test runner and its configuration are not chosen here.

Why: the specification promises only what a visitor sees, so end-to-end tests verify what a visitor sees, not internal files or symbols.

# Test selector

Tests select elements by their visible output, not by internal classes or ids.

Why: internal classes may change without a change to what the page shows.
