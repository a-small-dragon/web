# edu-platform-web

[![CI](https://github.com/a-small-dragon/web/actions/workflows/ci.yml/badge.svg)](https://github.com/a-small-dragon/web/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuizForge web — **Next.js (App Router) + TypeScript**. Teacher authoring + student exam-taking.
Design system: `clay/brain/projects/edu-platform/artifacts/design/DESIGN.md` (Tailwind + shadcn/ui land in P2).

- **P0.1 (now):** one RSC home page that server-fetches the API `/healthz` and shows the status.
- **P0.2/P2:** auth pages, then the question-authoring editor + exam-taking UI.

## Run
```bash
# standalone (needs the API on :8080)
npm install && API_URL=http://localhost:8080 npm run dev   # http://localhost:3000

# or the whole stack
cd ../deploy && docker compose up --build
```
---

## Related repositories — QuizForge polyrepo

| Repo | Stack / role |
|------|--------------|
| [api](https://github.com/a-small-dragon/api) | Go modular-monolith REST API |
| [web](https://github.com/a-small-dragon/web) | Next.js (App Router) + TS — teacher authoring & student exam-taking |
| [android](https://github.com/a-small-dragon/android) | Kotlin + Jetpack Compose — student app |
| [contract](https://github.com/a-small-dragon/contract) | OpenAPI 3.1 — single source of truth |
| [deploy](https://github.com/a-small-dragon/deploy) | Docker Compose stack + production guide |

_Licensed under [MIT](LICENSE) © 2026 Clay._
