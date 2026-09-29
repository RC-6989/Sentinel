"use client";

import { useActionState } from "react";
import { policyAction, type PolicyFormState } from "@/app/(app)/policy-actions";
import type { Policy } from "@/lib/policies";
import type { Project } from "@/lib/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "control-field block h-11 w-full rounded-md border border-border bg-white px-3 text-sm";
const textareaClass = "control-field mt-2 block w-full rounded-md border border-border bg-white p-3 font-mono text-xs leading-6";
const example = JSON.stringify([{ id: "allow-low-risk", effect: "allow", riskLevel: "low" }], null, 2);

function PolicyForm({ organizationId, operation, policy, projects }: {
  organizationId: string; operation: "create" | "update"; policy?: Policy; projects?: Project[];
}) {
  const [state, action, pending] = useActionState<PolicyFormState, FormData>(policyAction, {});
  return <form action={action} className="space-y-3">
    <input type="hidden" name="organizationId" value={organizationId} />
    <input type="hidden" name="operation" value={operation} />
    {policy && <input type="hidden" name="policyId" value={policy.id} />}
    {!policy && <label className="block text-sm">Project<select name="projectId" className={selectClass} required>
      {projects?.map(project => <option key={project.id} value={project.id}>{project.name} ({project.environment})</option>)}
    </select></label>}
    <label className="block text-sm">Name<Input name="name" defaultValue={policy?.name} required maxLength={80} /></label>
    <label className="block text-sm">Rules JSON<textarea name="rulesJson" required maxLength={16384} rows={10} spellCheck={false}
      defaultValue={policy ? JSON.stringify(JSON.parse(policy.rules_json), null, 2) : example} className={textareaClass} /></label>
    {policy && <label className="block text-sm">Status<select name="status" defaultValue={policy.status} className={selectClass}>
      <option value="active">Active</option><option value="disabled">Disabled</option>
    </select></label>}
    <p className="text-xs text-muted">Each rule needs an ID and an allow, deny, or approval effect. Optional matches: toolId, agentId, environment, riskLevel, or one argument condition. Deny overrides approval, then allow. No match denies.</p>
    {!pending && state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    {!pending && state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
    <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : policy ? "Save policy" : "Create policy"}</Button>
  </form>;
}

export function CreatePolicyForm({ organizationId, projects }: { organizationId: string; projects: Project[] }) {
  if (!projects.length) return <p className="text-sm text-muted">Create a project in Settings first.</p>;
  return <PolicyForm organizationId={organizationId} operation="create" projects={projects} />;
}

export function EditPolicyForm({ policy }: { policy: Policy }) {
  return <PolicyForm organizationId={policy.organization_id} operation="update" policy={policy} />;
}
