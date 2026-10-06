# Model-listing gauntlet

## Bar

- A healthy database with zero provider connections must not expose the full static placeholder catalog.
- No-auth/free providers must still contribute live models; OpenCode must use `https://opencode.ai/zen/v1/models`.
- Static models remain an emergency fallback only when the database is unavailable.
- Existing configured-connection, custom-model, combo, and kind-filter behavior must remain intact.
- Evidence: focused unit tests plus a live `/v1/models` check.

## Rounds

| Round | Evidence | Verdict | Next gap |
|---|---|---|---|
| 0 | VansRouter `allowedModels.js` and OpenCode registry inspected; local 9router returns 686 models with healthy empty DB | fail | Implement healthy-empty + live no-auth merge |
| 1 | Builder implementation + focused tests: 3/3 pass; independent critic found active-OpenCode edge case | fail | Merge live catalog when active connection has no curated enabled list |
| 2 | Critic fix + 3/3 focused tests; live `/v1/models` after restart returns 7 current `oc/*` models, not 686 | pass | Final diff/runtime handoff |
