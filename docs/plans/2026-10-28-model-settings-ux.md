# Model settings UX — phase 1, 2026-10-28

## Architecture and scope

Beginner-first model settings with no backend/schema/API changes. Keep the
existing GlobalSettingsDraft as the single source of truth: validation,
If-Match conflicts, save/readback, masked secret sentinels, promotion headers,
unknown fields, isolated environments, and JSON editing retain their behavior.

Split the previous all-in-one view into shared fields/constants, quick setup,
provider editor, Computer Use routes, image settings, catalog test and accessible
section tabs. No new dependency or duplicate model-config store. The service
selector edits the existing provider field; it is not a vendor template or
protocol autodetector. Existing unknown provider values remain representable.

Initial worktree clean at 280f52c; pulled origin/main. All changes here belong to
this task. No branches/worktrees or changes to the original go-e2e project.

## Implemented behavior

- Default Quick setup: service, model ID, API URL and API key (or existing
  Auth Token-only authentication). Configuration summary is not runtime status.
- One shared save/validate/reset toolbar at the bottom. Save does not claim to
  apply immediately; existing restart/readback feedback remains authoritative.
- Protocols, Responses, alternate authentication and fallback promotion remain
  in Advanced setup. Computer Use and Image generation have dedicated sections.
- Capability links navigate directly without enabling or writing anything.
- File/shared-service details and credential guidance are disclosures, not large
  always-visible banners. Image limits/worker parameters remain collapsed.
- Primary catalog health ignores fallback test results; changing a draft clears
  stale test results. Catalog connectivity is not proof of chat/tool/vision support.
- Empty key fields are not called misconfigured: credentials may be inherited.
- Arrow/Home/End keyboard tabs; original advanced provider selection is retained,
  but quick-form protocol actions explicitly select the primary connection.

## Verification and change ledger

1. Implementation: reviewed; source changes limited to model UI/components,
   associated settings copy/layout/navigation metadata, and tests.
2. Automated: 82 suites / 812 tests pass, typecheck passes, focused lint passes.
   Settings E2E: 27 cases pass across desktop/narrow/mobile, plus 3 Chinese
   light/dark cases pass (30 total). Requests use mock fixtures, not real keys.
   Existing unknown-field/secret/JSON/conflict tests are retained; added tests
   for scoped connection status, optional routes, Auth Token-only configuration,
   keyboard focus, primary selection and edit/save/reload preservation.
3. Visual browser acceptance: Chinese light/dark desktop and mobile screenshots
   inspected; English layouts checked. Screenshots contain fixture settings.
4. Native build: Wails macOS build and nested local signature validation pass.
5. BLOCKED — final native UI acceptance: CUA reports the Mac is locked and asks
   for manual unlock. Earlier native screenshots show an intermediate build,
   not this final version. Do not count them as final acceptance. Unlock, launch
   the final local build and verify quick/advanced/computer/image transitions.
6. Delivery: tested source slice committed/pushed; see git history and the ignored
   evidence ledger for the exact hash. No release/download package published.

Evidence: desktop-v2/build/validation/20261028/model-settings-ux/ (ignored).
Final screenshots are browser fixture evidence, not native screenshots.
The existing Appearance E2E selector was stale; it now uses the actual unchanged
`Appearance · Skin` heading/navigation label. No appearance UI logic changed.

## Remaining / explicitly deferred

Highest priority: native acceptance after manual unlock; no backend or model-task
acceptance is claimed. Provider-specific templates, automatic model discovery,
protocol detection, paid minimal-inference tests, capability verification and
runtime hot-reload are later phases, not implemented or advertised here.
