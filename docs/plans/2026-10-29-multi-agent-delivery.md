# Desktop V2 multi-Agent delivery ledger

Date: 2026-10-29. User approved implementation after architecture review and
clarification that Profile/Team orchestration integrates with, rather than
replaces, screen-managed channel workers. Baseline main/origin/main: 10409af.
Initial worktree: clean; no pre-existing user changes. No branches/worktrees.
Reference `/Users/konglong/GolandProjects/go-e2e` is out of the write scope.

## Ordered delivery queue

| Priority | Slice | Status / dependency | Acceptance |
|---|---|---|---|
| P1a.1 | Pure Team V2 execution contracts and static DAG compiler | Implemented, focused Go tests passing; commit/push before continuing | Canonical snapshot, bounds, cycle/dependency/authority checks |
| P1a.2 | Profile V2/role registry and persistent SQLite/MySQL run/task journal | In progress; independent workers, disjoint files | V1 compatibility, DB reopen/CAS/idempotency, atomic task checkpoint |
| P1b | Bounded scheduler, retries/deadlines, cancel and interrupted recovery | Next; requires contracts, fake Store first | Deterministic focused/race tests, no model calls |
| P1c | Safe text executor and authenticated workflow application/API | In progress adapter; application waits for persistent Store | Real production protocol against local fake provider, deny all tools/hooks/raw recording |
| P1d | Beginner-friendly V2 Team workspace, editors, real Run details | In progress behind new route; dependency: stable API | Component/typecheck, ordered reducer, offline browser E2E |
| P1e | Final regression/build/native desktop acceptance | Pending previous slices | Final Wails build/PID, actual clicks and native screenshots, cancel/restart/offline |
| P2 | Durable approval/checkpoint pause/resume | Explicitly deferred by approved plan | No fake buttons or unsupported success |
| P3 | Desktop/image executors and channel Workflow V2 dispatch | Explicitly deferred by approved plan | Preserve current screen workers/Computer Use isolation |

Implementation boundaries:
- Agent definitions reuse Profile; Workflow definitions reuse Team schema V2.
- Pure scheduler/contracts live in `internal/agentteam/workflow`, a child package
  importing only standard library. Existing parent package adapters depend on SQL;
  SQL may import this pure child but never its parent. This uses the contracts
  alternative from review to prevent an import cycle without moving V1 code.
- Workflow-owned attempts/tasks have one terminal transaction authority.
- New text adapter calls query.New directly with a bare/no-tool/empty-hook policy,
  no raw Recorder or project discovery. No CLI factory initialization side effects.
- First release supports explicit no-tool text Agents, user-supplied research
  material, static sequential/parallel/join workflows. No paid model acceptance.
- Existing model settings, pets, screen supervision and default JSONL chat remain.

## Change ownership

All changes below are current-task work, not pre-existing user edits.
- Main: pure workflow compiler/scheduler, application/API/composition, integration
  tests, delivery ledger and final verification.
- Profile worker: `internal/agentprofile`, frontend Profile parser/helpers/tests.
- Storage worker: workflow GORM models/store/migrations and SQLite migration.
- UI worker: `web/src/v2/workflows`, route/shell/sidebar wiring and tests.
- Executor worker: `internal/agentteam/runtimecompose` safe text adapter/tests.

Generated databases/logs/browser artifacts are temporary and must be removed after
acceptance. Requested native evidence is retained under
`desktop-v2/build/validation/YYYYMMDD/multi-agent-orchestration/`, normally ignored.

## Verification and commits

- P1a.1: `GOTOOLCHAIN=local /Users/konglong/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.0.darwin-arm64/bin/go test ./internal/agentteam/workflow` PASS.
- No native/browser/model acceptance claimed at this stage.
- Commit/push hashes and later gates are recorded in subsequent entries/final
  report rather than embedding a commit's own hash.

### Profile V2 slice

- Versioned role/kind metadata and extensible registry implemented; V1 canonical
  hashes preserved. Existing frontend Profile parser accepts versioned documents;
  new workflow helpers default to text/no tools/no inherited context authority.
- Main reran Profile Go tests and frontend Profile/helper tests: PASS (32 cases).
  Worker also passed Profile race tests and existing CLI/server Profile regressions.
- No new desktop UI acceptance claimed yet; only definitions/helpers in this slice.
