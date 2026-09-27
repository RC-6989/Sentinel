"use client";

import { useActionState } from "react";
import { toolAction, type ToolFormState } from "@/app/(app)/tool-actions";
import type { Tool } from "@/lib/tools";
import type { Project } from "@/lib/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "block h-10 w-full rounded-md border border-border bg-[#0d1117] px-3 text-sm";
const textareaClass = "mt-1 block w-full rounded-md border border-border bg-[#0d1117] p-3 font-mono text-xs";
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
    {!pending && state.error && <p role="alert" className="text-sm text-[#f85149]">{state.error}</p>}
    {!pending && state.message && <p role="status" className="text-sm text-muted">{state.message}</p>}
    {!pending && state.validation && <div role="status" className="space-y-1 text-sm">
      <p>{state.validation.valid ? "Input matches the saved schema. No tool was executed." : "Input does not match the saved schema."}</p>
      {state.validation.errors.map((error, index) => <p key={index} className="break-all font-mono text-xs text-[#f85149]">{error}</p>)}
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
    <p className="text-xs text-muted">Your risk classification will inform future policies. It does not enforce a policy yet.</p>
    <label className="block text-sm">Input JSON Schema<textarea name="inputSchema" required maxLength={16384} rows={12} spellCheck={false}
      defaultValue={tool ? JSON.stringify(JSON.parse(tool.input_schema_json), null, 2) : exampleSchema} className={textareaClass} /></label>
    <p className="text-xs text-muted">Use an object schema with properties, required fields, arrays, enums, and size or numeric limits. Maximum 16 KiB. References, patterns, formats, and schema combinations are not supported yet.</p>
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
