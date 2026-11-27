# WORTHSY + OpenJarvis Integration Plan

Status: customer UI and fail-closed API gateway implemented on staging. OpenJarvis inference is still disabled; no production services or production website have been changed.

## Decisions

- Model strategy: hybrid (local model first where capacity and quality are adequate; approved cloud fallback).
- Automation: safe tasks may run automatically; consequential changes require explicit human approval.
- Customer data: consent-based personalisation. Consent must be explicit, purpose-specific, revocable, and enforced server-side.

## Non-negotiable compatibility requirements

- Keep the existing WORTHSY HTML/CSS/JS presentation, black-and-white visual system, logo, header, footer, navigation, product cards, filters, cart, account, wishlist, and affiliate behaviour unchanged.
- Do not replace the existing product catalogue or existing Personalisation API.
- Do not expose OpenJarvis credentials, model-provider keys, Supabase service credentials, or other secrets to browser code.
- No direct OpenJarvis-to-production database writes.
- No production deployment or production data migration from an agent.

## Target architecture

1. Existing WORTHSY frontend remains the customer interface.
2. Existing WORTHSY backend remains the trusted application boundary and source of truth.
3. A WORTHSY AI gateway now exists at `POST /openjarvis/chat`. It validates short chat histories, enriches prompts only with public catalogue matches, and proxies to OpenJarvis. It is fail-closed until explicitly enabled. Before enabling, add edge-level rate limits and confirm the hosting network boundary.
4. Run OpenJarvis as an isolated service on a persistent Linux host/container, reachable only from the gateway over a private network or authenticated TLS.
5. Configure a hybrid inference router: local inference for eligible requests; approved cloud provider only for allowed request classes and only after data minimisation. Never send payment credentials or unnecessary identity data to a model.
6. Expose narrowly scoped tools to agents. Tools return structured data and cannot accept arbitrary shell commands or arbitrary SQL.

## Customer-facing capabilities (phased)

- Phase A: AI-assisted product discovery using only public catalogue fields.
- Phase B: product comparison and gift discovery grounded in verified catalogue data.
- Phase C: consent-based personalisation using only declared preferences and approved first-party behavioural signals.
- AI must not invent product records, prices, availability, ratings, specifications, images, or affiliate destinations. Missing facts must be described as unknown and linked back to the catalogue/partner.

## Consent and customer-data controls

- Default state is no behavioural personalisation until affirmative consent is recorded.
- Separate consent purposes: (a) essential request processing, (b) personalised recommendations using browsing/wishlist signals, and (c) optional analytics/model improvement. Do not bundle these purposes.
- Record consent version, timestamp, purpose, and withdrawal state in a server-controlled consent record; do not trust browser-supplied metadata as proof of consent.
- Provide a clear way to withdraw consent and delete or expire associated personalisation data.
- Minimise inputs: prefer category/brand affinity over raw clickstreams; exclude passwords, payment details, authentication tokens, precise location, and unnecessary identifiers.
- Set retention periods and deletion jobs before enabling persistent profiles.
- Cloud fallback must be disabled for sensitive payload classes; apply redaction and provider data-retention controls before enabling it.
- Do not train or fine-tune models on identifiable customer data by default.

## Automation permission tiers

### Automatic (safe, read-only)
- Catalogue schema and duplicate checks.
- Broken-link and image availability checks with rate limits.
- Product/brand/category consistency reports.
- Service health checks and alert generation.
- Draft issue creation or reports, if configured.

### Approval required (write or customer impact)
- Product catalogue edits, affiliate URL changes, brand/category corrections.
- Customer messaging or account-affecting actions.
- Supabase writes, schema changes, policy changes, or data deletion.
- GitHub commits, pull requests, dependency changes, configuration changes.
- Deployments, DNS, secrets, billing, and infrastructure changes.

### Prohibited
- Unrestricted shell/terminal access on production hosts.
- Arbitrary SQL or direct production database credentials.
- Reading secrets or exporting customer databases.
- Making purchases, changing payment settings, or sending external communications without a separate approved workflow.

## Network and service security

- OpenJarvis must not be publicly reachable without authentication. Prefer private networking; otherwise require TLS and a strong server-side API key with rotation.
- Keep all provider keys and OpenJarvis credentials in the hosting platform's secret manager, never in Git.
- Restrict inbound traffic to the WORTHSY gateway and administrative operators.
- Run as a non-root user with read-only filesystem where possible, bounded CPU/memory, persistent model volume only, and no Docker socket mount.
- Disable unused channels, plugins, shell tools, and agent capabilities.
- Apply request size limits, timeouts, concurrency limits, per-user/IP rate limits, and structured audit logs.
- Pin OpenJarvis to a reviewed release/commit and pin container/model versions; update only through staging.

## Staging and release sequence

1. Preserve the current main branch; all work remains on `staging/openjarvis-integration`.
2. The isolated monochrome customer assistant UI is now included on the existing HTML pages. It adds a floating launcher and an `Ask AI` hand-off beside the existing search controls; existing catalogue search remains unchanged.
3. The FastAPI gateway is added at `POST /openjarvis/chat` and defaults to HTTP 503 until enabled. The frontend config also defaults to disabled, so the assistant is a staging preview and cannot send messages yet.
4. Deploy OpenJarvis to a separate persistent staging host, bind it to a private interface/network, and configure its OpenAI-compatible `/v1/chat/completions` endpoint.
5. Configure `OPENJARVIS_ENABLED=true`, `OPENJARVIS_BASE_URL`, and `OPENJARVIS_MODEL` only in the staging API host's secret/environment settings. Add `OPENJARVIS_API_KEY` only if the OpenJarvis ingress is configured to require it. Set `enabled: true` and the staging API `apiBase` in `worthsy-openjarvis-config.js` only after the gateway is reachable.
6. Configure hosting-edge rate limiting, request logging without message-body retention, TLS/private networking, and a restrictive OpenJarvis ingress policy before enabling the endpoint. CORS is not authentication.
7. Verify that customer messages contain no passwords, payment details, OTPs, tokens, or unnecessary personal data; verify catalogue grounding, model errors, rate limits, and shutdown behaviour.
8. Run compatibility tests against existing WORTHSY search, product catalogue, affiliate links, cart, account, wishlist, header/footer, and mobile layouts.
9. Open a reviewed pull request from staging to main. Production rollout requires explicit human approval and a rollback plan.

## Rollback

- Feature-flag all AI entry points and default them off.
- Gateway timeout/error must fall back to existing WORTHSY search/recommendation behaviour.
- Disable the OpenJarvis service or revoke its gateway credential without changing the website.
- Revert the integration pull request if compatibility or security checks fail.
- Keep customer profile retention/deletion procedures independent of model service availability.

## Current repository observations

- The repository already has a Python FastAPI personalisation service and a Render Blueprint.
- The current personalisation API describes itself as stateless and currently handles catalogue search, recommendations, gift discovery, and comparison.
- Its existing health endpoint reports that customer data is not stored.
- Therefore, consent-based persistent personalisation is a new capability and must be designed explicitly; it must not be silently added to the existing stateless endpoints.
- The current Render Blueprint uses the free plan. It is not an assumed production host for persistent model inference. OpenJarvis should be evaluated on separate persistent infrastructure.

## Current staging implementation

- Added `worthsy-openjarvis.css`, `worthsy-openjarvis.js`, and `worthsy-openjarvis-config.js` to the repository and referenced them from the existing HTML pages. The assistant uses the existing black-and-white visual language.
- The floating launcher and search-to-AI hand-off are present in staging. The main search/catalogue flow is not replaced.
- Added `personalization_api/openjarvis_gateway.py`, included its router in the existing FastAPI app, and added `httpx` as a dependency.
- The gateway forwards only bounded user/assistant messages plus up to eight public catalogue matches. It does not accept browser-supplied system prompts, tool definitions, arbitrary URLs, or customer account/payment data.
- Both frontend and backend are disabled by default. No AI response can be generated until a private OpenJarvis host and staging configuration are supplied.
- No OpenJarvis process has been installed or deployed; no Render service or production deployment was changed.

## Go-live gates

- Security review passed.
- Consent and withdrawal flows tested end-to-end.
- No secrets committed or exposed in client bundles.
- Tool allowlist and approval gates verified.
- Existing site regression suite passes.
- Staging model quality, latency, and cost are acceptable.
- Monitoring, incident response, and rollback tested.
- Explicit approval to merge and deploy to production.
