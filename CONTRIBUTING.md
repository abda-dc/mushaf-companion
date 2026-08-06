# Contributing to Mushaf Companion

Thank you for helping improve Mushaf Companion. Changes that affect Quran text, page geometry, tajweed markup, or verse mapping need especially careful source verification and review.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install Node.js 22 or newer and run `npm ci`.
3. Make the smallest complete change that solves the issue.
4. Run `npm test` and `npm run lint`.
5. Open a pull request explaining the user impact, data sources, and validation performed.

## Content integrity

- Do not introduce Quran content without a stable source, edition identifier, license, and attribution.
- Never silently render fallback text as verified content.
- Include representative page and surah-boundary checks for changes to page layout or mapping.
- Keep credentials, signing files, and private environment values out of commits.

By contributing, you agree that your contribution is licensed under the repository’s MIT License.
