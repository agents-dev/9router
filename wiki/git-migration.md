# Maintain the agents-dev fork

- Use `https://github.com/agents-dev/9router.git` as `origin`. Keep the repository private.
- Track `origin/master` from `master`. Keep `upstream` for `decolua/9router` and `n9router` for `nightwalker89/n9router`.
- Commit pending feature changes before integrating upstream. Merge upstream first on an integration branch, then merge the feature branch.
- Preserve upstream OpenCode session handling, provider resolvers, combo capabilities, and token limits when resolving live-catalog conflicts.
- Preserve the `9router-vibefin` CLI package identity. Keep upstream version numbers instead of downgrading to the feature branch version.
- Run Vitest with an explicit repository root and config. Compare failures against untouched upstream under the same runtime and dependencies before attributing them to the merge.
- Include `AI_PROVIDERS` in provider-registry mocks used by credential-selection tests.
- Keep inherited publishing workflows disabled until configuring fork-owned publishing destinations and secrets.
