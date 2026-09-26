# Contributing to Jomi Hisheb

Thanks for taking the time to help. This project is maintained by **[Afterclass Studio](https://github.com/auntor69)** and this guide keeps changes easy to review.

## Ground rules

- Conversion accuracy comes first. Any change to a factor needs a **cited, checkable source** (government/registry document, reputable survey reference). Unsourced factor changes will not be merged.
- Keep it small: this is a single-page tool. Prefer editing existing files over adding new ones.
- Respect the region scope. Jomi Hisheb uses **Bangladesh conventions**. Proposals for other regional standards should be discussed in an issue first.
- Be kind. This repository follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Getting started

```bash
bun install
bun run dev        # http://localhost:5173 (binds 0.0.0.0)
```

Before opening a pull request, make sure all three pass:

```bash
bun run typecheck  # tsc, strict mode
bun run test       # Vitest suite
bun run build      # production build → dist/
```

CI runs exactly these commands, so a green local run means a green pull request.

## What to work on

- Browse issues labeled `good first issue` or `help wanted`.
- Accuracy reports: include the value, the unit, the expected result, and your source.
- UI/accessibility improvements are welcome — the app targets WCAG 2.2 AA practices and must work in both **English and বাংলা**.

## Pull request checklist

- [ ] The change is scoped to one concern.
- [ ] `bun run typecheck`, `bun run test`, and `bun run build` pass locally.
- [ ] Tests were added or updated for behavior changes (conversion invariants, validation, formatting, i18n parity, URL state, UI contracts).
- [ ] Both language maps in `src/lib/i18n.ts` were updated if any user-visible string changed.
- [ ] No secrets, tokens, or personal data are included.

## Project conventions

| Area | Convention |
|---|---|
| Conversion factors | `src/data/units.ts` is the single source of truth |
| Conversion engine | Pure, framework-free functions in `src/lib/convert.ts` |
| UI text | Never hard-coded in components — always through `src/lib/i18n.ts` (EN + BN) |
| Styling | Tailwind v4 design tokens in `src/index.css` (indigo palette, AA contrast) |
| Commits | Imperative mood, short subject, why over what |

## Reporting security issues

Do **not** use public issues for vulnerabilities. See [SECURITY.md](./SECURITY.md).

## License

By contributing you agree that your contributions are licensed under the [MIT License](./LICENSE), © Afterclass Studio.
