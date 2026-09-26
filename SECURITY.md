# Security Policy

Jomi Hisheb is a **static, client-side application** published by [Afterclass Studio](https://github.com/auntor69). There is no backend, no database, and no user accounts — the whole app is a single-page bundle served as static files. That removes most classic attack surface, but we still take reports seriously.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private reporting flow:

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, the impact, and (if you have one) a minimal reproduction.

If private reporting is unavailable, open a minimal issue that says only *"security report — please contact me privately"* and no technical detail.

**What to expect**

| Stage | Target |
|---|---|
| Acknowledgement | within 72 hours |
| Initial assessment | within 7 days |
| Fix or documented decision | as soon as practical |

Please give us reasonable time to ship a fix before any public disclosure. We are happy to credit reporters in the release notes unless you ask us not to.

## Scope

In scope:

- The application bundle and its source in this repository
- The published site (`https://jomihisheb.vercel.app`)
- Build, CI, and dependency configuration

Out of scope:

- Conversion-accuracy disputes (report those as a normal issue — see below)
- Denial of service or volumetric attacks against GitHub/Vercel infrastructure
- Third-party services we merely link to
- Reports produced solely by an automated scanner with no demonstrated impact

## Accuracy is not a security issue

This tool converts land units using documented Bangladeshi conventions (see `README.md` and `MASTERPLAN.md` §2). It is a **calculator, not a legal instrument**: it does not determine ownership, boundaries, or official measurements. If you find a wrong factor, please open a regular issue with a source — that is a correctness bug, not a vulnerability.

## Our security practices

- **No secrets in the repository.** The app requires no API keys, tokens, or environment variables at runtime. `.gitignore` blocks `.env` files, and CI runs with `permissions: contents: read` only.
- **No user data is collected or stored server-side.** Measurements never leave the browser. The only network requests are the static bundle, Google Fonts, and privacy-friendly cookie-free page counts via Vercel Analytics (no personal data, no cross-site profiles).
- **Dependencies are pinned** by `bun.lock` and kept current by Dependabot; every update PR must pass the full CI suite (typecheck, tests, production build).
- **Pinned tool versions.** Preview builds and dependency installs are reproducible via `--frozen-lockfile`.
- **Least-privilege CI.** Workflows request only read access to repository contents.

## Supported versions

This is a continuously deployed web app. Only the current `main` branch — i.e. what is live at `https://jomihisheb.vercel.app` — is supported. Older commits are not maintained.
