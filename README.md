# Denis Andrikov — research, code and interactive learning

A static portfolio for biomedical AI, control systems and open education. The site uses HTML, CSS and JavaScript, with local fonts and illustrations. It has no runtime package dependencies or build step. All expertise panels and projects remain readable without JavaScript; JavaScript adds theme selection, accessible tabs and project filters.

## Local development

From this repository:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the server in your local browser. Edit `index.html`, `styles.css`, `theme.js` or `script.js` and reload. Cloud tasks should use the existing isolated checkout; do not create a worktree unless explicitly requested. Restart the server in each new task.

## Checks

Python 3.12 and Node.js 22 or newer are recommended. Node dependencies are development tools only:

```sh
npm ci
npm run check
npx playwright install --with-deps chromium
npm test
```

If Chromium is already installed, use it without downloading another browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Playwright starts its own server on port 8765. The tests cover themes, blocked storage, keyboard tabs, filters, no-JavaScript content, reduced motion, mobile overflow and automated WCAG checks in both themes. External requests are blocked during tests, so the portfolio must work entirely from its own assets. The tests do not validate the external educational applications or establish full accessibility conformance.

`npm run check` also validates local assets, fragment and ARIA references, SVG syntax, JavaScript syntax, and citation-selection failure cases. The `Site checks` GitHub Actions workflow runs these checks and browser tests on pushes and pull requests. Failure artifacts are retained for seven days.

GitHub Pages can continue serving the repository root from the configured publishing branch. No generated build directory is required. The check workflow does not publish changes.

## Update content

Project copy and links live in `index.html`; the full content is available to search engines without executing JavaScript. Each card describes the task, methods and something a visitor can explore. The control course, Stepik course and Bauman AI video library remain in the teaching-resources section. The contact section has no new contact actions or CV download.

The profile highlights describe the six linked interactive labs (Graph-EVT guide, EVT propagation, reservoirs, attention, autoencoders and LLM agents), three expertise areas, and English/Russian learning resources. These replace unverified, changing publication/repository/playlist totals. Recount the linked labs if the selection changes.

Publication titles and years are inherited from the previous site and still need confirmation against the public ORCID record. Refresh the selected entries with:

```sh
python3 tools/refresh_publications.py
```

The command retrieves public ORCID metadata over verified HTTPS, requires one unique self-referential DOI for each selected topic, and then replaces the marked publication block with exact titles, years, journals and direct DOI links. It fails before changing the page if metadata is missing or ambiguous; review `SELECTION` when intentionally choosing different papers. An already downloaded official ORCID works JSON can also be supplied with `--input path/to/works.json`. Review the resulting diff and run the checks before publishing. Focus summaries describe research topics, not individual authorship contributions or unverified performance claims.

The publication entries still link to the ORCID record; the metadata refresh was blocked during initial setup and has not yet been rerun. Verify the selected works before replacing those links with individual DOIs.

The profile photograph is the previous Kaggle portrait, restored with the owner's confirmation and stored locally at `assets/portrait.png`. It does not require an external request when the page loads. Original source: `https://storage.googleapis.com/kaggle-avatars/images/6828784-kg.png?t=2024-10-09-17-14-20`.

## Interactive library

The `#library` section (04 / Interactive library) is an educational catalog of every browser lab published with GitHub Pages from the `D2718281828nis` repositories. Each entry has a topic, a one-line description taken from the lab's own page or README, the live lab link (with the Russian version where one exists) and its source repository. The labs are hosted by their source repositories; this site only links to them.

| Lab | Topic | Live (EN) | Live (RU) | Source |
| --- | --- | --- | --- | --- |
| Graph-EVT: From Extreme to Source | Extreme events guide | [open](https://d2718281828nis.github.io/EVT-educational-demo/index) | [открыть](https://d2718281828nis.github.io/EVT-educational-demo/index?lang=ru) | [EVT-educational-demo](https://github.com/D2718281828nis/EVT-educational-demo) |
| Kuramoto Propagation Explorer | Extreme events, graphs | [open](https://d2718281828nis.github.io/EVT-educational-demo/kuramoto/) | — | [EVT-educational-demo](https://github.com/D2718281828nis/EVT-educational-demo) |
| Reservoir Computing Explainer | Time series, dynamics | [open](https://d2718281828nis.github.io/ML-Reservoir_Computing/) | [открыть](https://d2718281828nis.github.io/ML-Reservoir_Computing/ru/) | [ML-Reservoir_Computing](https://github.com/D2718281828nis/ML-Reservoir_Computing) |
| From Text to Attention (GPT-2) | Language models | [open](https://d2718281828nis.github.io/ML-Transformers/) | [открыть](https://d2718281828nis.github.io/ML-Transformers/ru/) | [ML-Transformers](https://github.com/D2718281828nis/ML-Transformers/tree/main/explainer) |
| Autoencoder Explainer | Representation learning | [open](https://d2718281828nis.github.io/ML-Transformers/autoencoders/) | [открыть](https://d2718281828nis.github.io/ML-Transformers/autoencoders/ru/) | [ML-Transformers](https://github.com/D2718281828nis/ML-Transformers/tree/main/explainer/autoencoders) |
| From One Token to a Team of Agents | LLM agents | [open](https://d2718281828nis.github.io/LLM_AI_agents/explainer/) | [открыть](https://d2718281828nis.github.io/LLM_AI_agents/explainer/ru/) | [LLM_AI_agents](https://github.com/D2718281828nis/LLM_AI_agents) |
| LLM AI Agents: 13 Lessons | LLM agents course | [open](https://d2718281828nis.github.io/LLM_AI_agents/) | — | [LLM_AI_agents](https://github.com/D2718281828nis/LLM_AI_agents) |

The list was compiled on 2026-10-30 from the repositories that have GitHub Pages enabled; every link returned HTTP 200 on that date. The Graph-EVT guide was added the same day; the EVT repository root now serves the guide and the Kuramoto explorer moved to `kuramoto/`. The guide selects Russian with `?lang=ru`. `TAUforPython.github.io` is excluded because it only serves an unmodified blog template. To add a lab, append a `library-item` to the list in `index.html`, add a row here and update the expected count in `tests/portfolio.spec.js`.

## Habr writing

The Articles navigation link leads to the Habr archive entry in the Research section. It points to the owner-supplied profile at [DenisDenisMIS on Habr](https://habr.com/ru/users/DenisDenisMIS/articles/). The archive link works without JavaScript and does not fetch external content while the portfolio loads.

This section links directly to the author's full archive. It does not scrape Habr, load external article content, or require Habr network access for local development.

## Content sources

Project descriptions were reviewed against these public repository snapshots on 2026-10-28:

| Source | Reviewed commit | Used for |
| --- | --- | --- |
| [Graph-EVT-agent](https://github.com/D2718281828nis/Graph-EVT-agent) | `7da15de6d188ff2fdcc1a0e85785e2b679459c97` | Deterministic detection, dependence graphs, ranking and optional learned models |
| [EVT educational demo](https://github.com/D2718281828nis/EVT-educational-demo) | `2e6bfcec087d7522f223d0f0816e145bc1c64722` | Synthetic-data notebooks and the 12-oscillator propagation explorer |
| [Reservoir computing](https://github.com/D2718281828nis/ML-Reservoir_Computing) | `a623dc837a4d933c250924f2989743f4852f42d2` | Forecasting, recurrent dynamics and control-theory explainer |
| [Transformers](https://github.com/D2718281828nis/ML-Transformers) | `c3d9a9dae7ef227a597abcf2ecfcacfd63ac9263` | GPT-2 embedding/attention and autoencoder/forecasting explainers |
| [BioMedAI](https://github.com/D2718281828nis/BioMedAI) | `f3fc84029f5b8b111406ed18fb21f77de2f47eac` | Biomedical notebook topics |

The figures are original method schematics, not experimental plots or measured results. Repository descriptions and documented verification capabilities are attributed to their sources; this portfolio task did not execute the source projects' scientific experiments. In particular, synthetic EVT examples are educational, dependence graphs do not prove causality, and no clinical performance claim is made.

## Assets and metadata

`assets/fonts/` contains Latin/Cyrillic subsets of the Inter and Manrope variable fonts from the official [Google Fonts repository](https://github.com/google/fonts). Each font's SIL Open Font License is included alongside it. Fallbacks use system sans-serif fonts.

The favicon, profile portrait, diagrams and 1200×630 social preview are local assets. Canonical, Open Graph and Twitter metadata use `https://ai-is-out-there.github.io/`; update those URLs, `robots.txt` and `sitemap.xml` together if the publishing domain changes.
