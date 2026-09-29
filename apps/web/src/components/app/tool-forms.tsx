"use client";

import { useActionState } from "react";
import { toolAction, type ToolFormState } from "@/app/(app)/tool-actions";
import type { Tool } from "@/lib/tools";
import type { Project } from "@/lib/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "control-field block h-11 w-full rounded-md border border-border bg-white px-3 text-sm";
const textareaClass = "control-field mt-2 block w-full rounded-md border border-border bg-white p-3 font-mono text-xs leading-6";
const exampleSchema = JSON.stringify({
  type: "object", properties: { query: { type: "string", minLength: 1, maxLength: 200 } },
  required: ["query"], additionalProperties: false,
}, null, 2);

function ToolForm({ organizationId, operation, children, label }: {
  organizationId: string; operation: string; children: React.ReactNode; label: string;
}) {
  const [state, action, pending] = useActionState<ToolFormState, FormData>(toolAction, {});
  return <form action={action} className="space-y-3">
    <input type="hidden" name="organizationId" value={organizationId} />
    <input type="hidden" name="operation" value={operation} />
    {children}
    {!pending && state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    {!pending && state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
    {!pending && state.validation && <div role="status" className="space-y-1 text-sm">
      <p>{state.validation.valid ? "Input matches the saved schema. No tool was executed." : "Input does not match the saved schema."}</p>
      {state.validation.errors.map((error, index) => <p key={index} className="break-all font-mono text-xs text-danger">{error}</p>)}
    </div>}
    <Button type="submit" size="sm" disabled={pending}>{pending ? "Checking…" : label}</Button>
  </form>;
}

function DetailsFields({ tool }: { tool?: Tool }) {
  return <>
    <label className="block text-sm">Name<Input name="name" defaultValue={tool?.name} required maxLength={80} /></label>
    <label className="block text-sm">Description<Input name="description" defaultValue={tool?.description} maxLength={500} /></label>
    <label className="block text-sm">Risk level<select name="riskLevel" defaultValue={tool?.risk_level ?? "medium"} className={selectClass}>
      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
    </select></label>
    <p className="text-xs text-muted">This risk classification can be matched by project policy rules. It is supplied by your organization, not calculated by Sentinel.</p>
    <label className="block text-sm">Input JSON Schema<textarea name="inputSchema" required maxLength={16384} rows={12} spellCheck={false}
      defaultValue={tool ? JSON.stringify(JSON.parse(tool.input_schema_json), null, 2) : exampleSchema} className={textareaClass} /></label>
    <p className="text-xs text-muted">Use an object schema with properties, required fields, arrays, enums, and size or numeric limits. Maximum 16 KiB. References, patterns, formats, and schema combinations are not supported yet.</p>
    <label className="block text-sm">HTTPS target URL (optional)<Input name="targetUrl" type="url" defaultValue={tool?.target_url ?? ""} maxLength={2048} placeholder="https://api.example.com/execute" /></label>
    <p className="text-xs text-muted">Sentinel posts validated JSON to this URL. The server operator must allow its exact origin. No credentials or query strings are supported.</p>
    <label className="flex items-start gap-2 text-sm"><input name="executionEnabled" type="checkbox" defaultChecked={tool?.execution_enabled === 1} className="mt-1" />
      <span>Enable live execution for this tool. Only low and medium risk tools can run until the approval workflow is available.</span>
    </label>
    <p className="text-xs text-muted">Execution is off by default. Enabled calls still require an active matching allow policy, an agent API key, a unique idempotency key, and quota headroom.</p>
  </>;
}

export function CreateToolForm({ organizationId, projects }: { organizationId: string; projects: Project[] }) {
  if (!projects.length) return <p className="text-sm text-muted">Create a project in Settings before registering a tool.</p>;
  return <ToolForm organizationId={organizationId} operation="create" label="Register tool">
    <label className="block text-sm">Project<select name="projectId" className={selectClass} required>
      {projects.map(project => <option key={project.id} value={project.id}>{project.name} ({project.environment})</option>)}
    </select></label>
    <DetailsFields />
  </ToolForm>;
}

export function EditToolForm({ tool }: { tool: Tool }) {
  return <ToolForm organizationId={tool.organization_id} operation="update" label="Save tool">
    <input type="hidden" name="toolId" value={tool.id} />
    <DetailsFields tool={tool} />
    <label className="block text-sm">Status<select name="status" defaultValue={tool.status} className={selectClass}>
      <option value="active">Active</option><option value="disabled">Disabled</option>
    </select></label>
  </ToolForm>;
}

export function TestToolInputForm({ tool }: { tool: Tool }) {
  return <ToolForm organizationId={tool.organization_id} operation="test" label="Validate input">
    <input type="hidden" name="toolId" value={tool.id} />
    <label className="block text-sm">Example input (JSON)<textarea name="input" required maxLength={65536} rows={5} spellCheck={false}
      defaultValue={'{\n  "query": "hello"\n}'} className={textareaClass} /></label>
    <p className="text-xs text-muted">Checks the saved schema only, including for disabled tools. Does not execute a tool or authorize access. Use sample data; input is not stored.</p>
  </ToolForm>;
}
