# Agents and API keys (Phase 2)

Sentinel currently runs the dashboard and identity endpoint in Next.js with local SQLite. The Cloudflare Worker and D1 binding remain future work. No tool execution or policy enforcement is available yet.

## Local setup

Use Node.js 22.13+ and pnpm 10. From the repository root:

```sh
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Open `/signup`, create an account, then visit `/app/agents`. Choose an organization in the sidebar, create a project in Settings if needed, and register an agent in that project. The agent inherits its project's environment. Only organization owners and admins may create/update agents or issue/revoke credentials; members may view agent and key metadata.

Expand **Generate or rotate API key**, enter a name, and choose a 7, 30, or 90 day lifetime. Leave the operation at **Create additional key**, or select an existing key to replace it. Copy the newly generated key into your agent's secret storage. It is displayed only in the action response and cannot be retrieved later.

Verify the credential locally (replace the placeholder):

```sh
curl http://localhost:3000/api/v1/identity \
  -H 'Authorization: Bearer <your-api-key>'
```

A valid credential returns `keyId`, `organizationId`, `agentId`, and `projectId`. Invalid, expired, revoked, or paused-agent credentials receive the same 401 response. Responses are not cached. This endpoint verifies identity only; it does not execute tools or grant dashboard access.

## Lifecycle and security

- Keys contain 256 random bits; only SHA-256 hashes and short display prefixes are stored. Full keys never enter audit records or listing responses.
- Rotation creates a replacement and revokes the old key in one transaction. Update your agent's secret immediately; there is no overlap period. If the response is lost, issue a new key and revoke the inaccessible replacement.
- Revocation is immediate and permanent. Pausing an agent rejects all its credentials. Resuming restores only unexpired, unrevoked credentials.
- An agent's organization and project binding cannot be changed by editing it. Register a separate agent for another project/environment.
- Mutations and their audit records are transactional. Foreign keys prevent cross-organization project and agent bindings, in addition to application authorization.
- Organization selection is carried in the `org` query parameter and checked against session membership on each data page and mutation.

Production keeps the existing waitlist gate by default. Set `SENTINEL_WAITLIST_MODE=false` only when deliberately enabling the dashboard on a persistent Node/SQLite host, with a strong `AUTH_SECRET`. Local development can also be gated with `SENTINEL_WAITLIST_MODE=true`. Do not enable this SQLite dashboard on Vercel's ephemeral filesystem. Cloud deployment remains a later phase.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The service tests use temporary databases and exercise the production service functions, covering tenant and role isolation, foreign-key integrity, hashed storage, expiry, pause/resume, rotation/revocation, validation, and rollback on audit failure.

Manual smoke: sign up, create an agent, issue a key, check the identity endpoint, rotate the key (old key must fail), pause/resume, revoke, and reload the page to verify the secret is no longer displayed. Create another organization and verify its agent list is separate.

Next phase: tool registry and JSON Schema validation, before gateway execution.
