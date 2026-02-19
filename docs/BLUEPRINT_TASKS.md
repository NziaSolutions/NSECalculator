# End-to-End Task Blueprint for Indie Devs

Follow these steps before writing production code.

## Phase 1 — Discovery
- [ ] Fill `docs/product/PROJECT_BRIEF.md`
- [ ] Define success metrics
- [ ] Identify personas in `USER_PERSONAS.md`

## Phase 2 — Planning
- [ ] Draft `PRD.md` and `USER_STORIES.md`
- [ ] Map journeys in `JOURNEYS.md`
- [ ] Competitive analysis

## Phase 3 — Architecture
- [ ] High-level `ARCHITECTURE.md`
- [ ] Create first ADR `docs/engineering/ADR/0001-record-architecture-decisions.md`
- [ ] Define data model and APIs (`DATA_MODEL.md`, `API/OPENAPI.yaml`)

## Phase 4 — Security & Ops
- [ ] `THREAT_MODEL.md` and `SECURITY_POLICY.md`
- [ ] Decide environments in `ENVIRONMENT.md`
- [ ] Set up CI (GitHub Actions or GitLab CI)

## Phase 5 — Design
- [ ] Brand basics in `docs/design/BRAND_GUIDE.md`
- [ ] Wireframes in `design/wireframes`
- [ ] Mockups in `design/mockups`

## Phase 6 — Implementation Prep
- [ ] Create `.env.local` from `env/.env.example`
- [ ] Prepare `docker-compose.yml` for local DB/cache
- [ ] Write initial tests directories structure

## Phase 7 — Coding
- [ ] Implement minimal skeleton in `src/`
- [ ] Keep commits atomic and conventional
- [ ] Add or update ADRs for significant decisions

## Phase 8 — Testing
- [ ] Unit, integration, e2e baselines
- [ ] Performance budget checks

## Phase 9 — Deployment
- [ ] Containerize with `config/docker/`
- [ ] Staging deploy
- [ ] Production deploy (tag release)

## Phase 10 — Operate & Iterate
- [ ] Observability: logs, metrics, traces
- [ ] Incident response runbooks
- [ ] Changelog for each release
- [ ] Iterate roadmap and backlog
