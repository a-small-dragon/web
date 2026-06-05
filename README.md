# edu-platform-web

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
