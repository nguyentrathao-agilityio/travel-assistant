Keep the current ticket branch healthy. Work through these in order and stop
at the first one that needs attention:

1. If the conversation has unfinished work on the current ticket, continue it.
2. Run `git fetch origin` and check whether the branch has fallen behind
   `feat/ai-tool-training` or conflicts with it. If it conflicts, list the
   conflicting files and stop; don't rebase or merge without asking.
3. Run `pnpm lint` and `pnpm test`. If either fails, find the cause and fix it
   in the working tree. Run `pnpm test:e2e` only when files under `src/` or
   `prisma/` changed since the last iteration.
4. Check the ticket under `docs/tickets/` for the current branch: its status and
   workflow checklist should match what the code actually does. Fix drift in
   the ticket file.

Never commit, push, or run migrations against a shared database from this loop.
If everything is green and nothing changed, say so in one line.
