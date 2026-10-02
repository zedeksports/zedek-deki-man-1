# ZEDEK SPORTS SCORE

Clean rebuild for local football in Ghana/Oti.

## Stack
- Next.js App Router
- React
- Supabase
- Vercel
- GitHub

## Architecture
Public football experience and the Control Room are separate surfaces but share the same domain model.

Core football flow:

Competition -> Season -> Stage -> Group -> Team -> Player -> Match

Operational flow:

Fixtures -> Matchday Squad -> Lineups -> Live Match -> Events + Live Statistics -> Report -> Verification -> Official Result -> Statistics Engine -> Public Website

## Rules
- Do not revive the deleted legacy application.
- Keep JavaScript/TypeScript out of CSS files.
- Never expose Supabase service-role or secret keys to the browser.
- Use the publishable Supabase key only in browser-safe code.
- Keep authorization in Supabase RLS and server-side role checks.
- Preserve historical football records; archive/deactivate instead of destructive deletion when records are referenced.
- Every major phase must be verified before the next phase is expanded.

## Phase 1
Foundation, responsive public shell, Control Room shell, Supabase browser/server clients, and application architecture.

## Phase 2
Football operations: competitions, seasons, stages, groups, teams, players, coaches, fixtures, lineups, match control, reporting and verification.

## Phase 3
Football intelligence: official statistics, standings, top scorers, form and H2H.

## Phase 4+
Public fan experience, news/community, engagement, monetization architecture and production launch.
