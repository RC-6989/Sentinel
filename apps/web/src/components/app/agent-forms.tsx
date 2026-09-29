"use client";

import { useActionState, useState } from "react";
import { agentAction, type AgentFormState } from "@/app/(app)/agent-actions";
import type { Agent, ApiKey } from "@/lib/agents";
import type { Project } from "@/lib/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "control-field block h-11 w-full rounded-md border border-border bg-white px-3 text-sm";

function AgentForm({ organizationId, operation, children, label }: {
  organizationId: string; operation: string; children: React.ReactNode; label: string;
}) {
  const [state, action, pending] = useActionState<AgentFormState, FormData>(agentAction, {});
  const [dismissedToken, setDismissedToken] = useState<string>();
  return <form action={action} className="space-y-3">
    <input type="hidden" name="organizationId" value={organizationId} />
    <input type="hidden" name="operation" value={operation} />
    {children}
    {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    {state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
    {state.token && state.token !== dismissedToken && <div className="space-y-2 rounded border border-border p-3">
      <p className="text-sm">Copy this key now. It cannot be retrieved after leaving this page.</p>
      <code className="block break-all text-sm select-all">{state.token}</code>
      <Button type="button" size="sm" variant="secondary" onClick={() => setDismissedToken(state.token)}>Hide key</Button>
    </div>}
    <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : label}</Button>
  </form>;
}

export function CreateAgentForm({ organizationId, projects }: { organizationId: string; projects: Project[] }) {
  return <AgentForm organizationId={organizationId} operation="create" label="Create agent">
    <label className="block text-sm">Name<Input name="name" required maxLength={80} /></label>
    <label className="block text-sm">Description<Input name="description" maxLength={500} /></label>
    <label className="block text-sm">Project<select name="projectId" className={selectClass} required>
      {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.environment})</option>)}
    </select></label>
  </AgentForm>;
}

export function EditAgentForm({ agent }: { agent: Agent }) {
  return <AgentForm organizationId={agent.organization_id} operation="update" label="Save agent">
    <input type="hidden" name="agentId" value={agent.id} />
    <label className="block text-sm">Name<Input name="name" defaultValue={agent.name} required maxLength={80} /></label>
    <label className="block text-sm">Description<Input name="description" defaultValue={agent.description} maxLength={500} /></label>
    <label className="block text-sm">Status<select name="status" defaultValue={agent.status} className={selectClass}>
      <option value="active">Active</option><option value="paused">Paused</option>
    </select></label>
    <p className="text-xs text-muted">Pausing rejects all of this agent’s keys. Resuming re-enables unexpired, unrevoked keys.</p>
  </AgentForm>;
}

export function IssueKeyForm({ agent, keys }: { agent: Agent; keys: ApiKey[] }) {
  return <AgentForm organizationId={agent.organization_id} operation="issue" label="Generate key">
    <input type="hidden" name="agentId" value={agent.id} />
    <label className="block text-sm">Key operation<select name="rotateKeyId" defaultValue="" className={selectClass}>
      <option value="">Create additional key</option>
      {keys.filter(key => !key.revoked_at).map(key => <option key={key.id} value={key.id}>Replace {key.name} ({key.token_prefix}…)</option>)}
    </select></label>
    <label className="block text-sm">Key name<Input name="name" required maxLength={80} /></label>
    <label className="block text-sm">Expires in<select name="days" defaultValue="30" className={selectClass}>
      <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>
    </select></label>
    <p className="text-xs text-muted">Replacing a key immediately revokes the selected key and shows its replacement once.</p>
  </AgentForm>;
}

export function RevokeKeyForm({ organizationId, keyId }: { organizationId: string; keyId: string }) {
  return <AgentForm organizationId={organizationId} operation="revoke" label="Revoke key">
    <input type="hidden" name="keyId" value={keyId} />
  </AgentForm>;
}
