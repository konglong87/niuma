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

### Integration hardening: legacy parallel event ordering

- Resume audit: main/origin/main at 72c9860, pull fast-forward-only reported up to
  date. All dirty files belong to the current approved implementation; no user
  edits were overwritten. Parallel workers retain disjoint write scopes.
- V1 parallel event sequence assignment and publication now share the same lock,
  preventing a later sequence from being persisted/published before an earlier
  event. This preserves existing screen/channel observability rather than
  replacing it with Workflow V2.
- Focused race verification: `go test -race ./internal/agentteam -run
  'TestOrchestratorPersistsMemberAndMailboxEvents|TestParallelEventPublicationFollowsAssignedSequence'
  -count=20` PASS using cached Go 1.26 with GOTOOLCHAIN=local.
- Remaining priority: finish scheduler/storage/adapter safety checks; commit these
  layers; verify real-backend UI E2E; final regression/build/native acceptance.
  P2 approval/pause and P3 desktop/image execution remain deferred, not simulated.

### Bounded scheduler slice

- Implemented static sequential/parallel/join scheduling, independent step/run
  deadlines, limited retries, cancellation, durable checkpoints and explicit
  interrupted-run recovery. Immutable epoch/lease fencing rejects stale workers.
- Cancellation/stop drains bounded partial results before freezing terminal
  state. Actual executor lifetime owns concurrency slots; uncooperative calls do
  not release slots early or permit same-process recovery. Close reports timeout
  or failed checkpoint instead of claiming successful cleanup.
- Actual provider usage and unknown admission reservations are separate fields;
  missing usage is never invented, and remains conservatively budgeted. Completed
  dependency artifacts are isolated and immutable; root dependencies serialize
  as [] for UI interoperability.
- Focused workflow tests/race/vet PASS (worker independently tested 18 safety
  groups). Full root Go suite now PASS after API coverage regeneration; desktop-v2
  Go suite PASS. Broad race regression is running before subsequent commits.
- Remaining: storage/safe text/application/UI commit gates; real-backend E2E;
  final rebuilt native acceptance. No native/model success claimed here.

### Shared persistent journal slice

- Reused agent_teams/agent_team_runs; added workflow checkpoint, immutable Task
  binding and node/attempt/artifact projections, with atomic event sequence/CAS.
  SQLite migrates locally; MySQL requires explicit 000029 migration. Read-only
  schema readiness prevents accidental writes against old/half-migrated stores.
- Queue capacity and scoped idempotency enforced transactionally; terminal Runs,
  completed Nodes and artifacts cannot be rewritten. Existing generic Task
  mutation/finish/cancel/events/session stop/reaper paths refuse owned Tasks.
- Publish timestamp binding works with SQLite and MySQL. Guarded MySQL rollback
  refuses to erase live V2 history. Do not downgrade while writers run.
- Main reran full storage plus workflow/runtimecompose/workflowapp/observability
  race tests: PASS. Full root Go suite and desktop Go tests: PASS. Worker also
  passed 37 focused storage test groups under race. Real MySQL is unavailable;
  its migration/live acceptance remains an explicit deployment risk.

### Isolated text executor slice

- New adapter reuses production query/client protocols and fallback, but supplies
  no tools, hooks, workspace discovery, memory, delegation, raw recording, global
  telemetry or Computer Use authority. Prompt dump enabled => fail closed.
- Public route fingerprints pin model/endpoint/fallback configuration; credential
  rotation is allowed. Capability/model conflicts fail before queued execution.
- Secrets are registered for sanitization; scoped logging suppression prevents
  SDK retry diagnostics from exposing credentials while normal request logging
  stays unchanged. Thinking/signatures never become artifacts or UI events.
- Three protocol loopbacks, fallback, missing/partial/invalid usage, raw logging,
  secret echoes, tool refusal and cancellation tests passed. Main race regression
  PASS; worker race+coverage PASS (runtimecompose 92.9%, observability 79.9%) and
  vet PASS. No paid provider or external service invoked.
