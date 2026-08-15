"use client";

import { useActionState } from "react";
import {
  createOrgAction,
  createProjectAction,
  type FormState,
} from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: FormState = {};

export function CreateOrgForm() {
  const [state, action, pending] = useActionState(createOrgAction, initial);
  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="org-name">New organization name</Label>
        <Input id="org-name" name="name" required />
      </div>
      {state.error ? (
        <p className="text-sm text-[#f85149]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}

export function CreateProjectForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(createProjectAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div>
        <Label htmlFor="project-name">Project name</Label>
        <Input id="project-name" name="name" required />
      </div>
      <div>
        <Label htmlFor="environment">Environment</Label>
        <select
          id="environment"
          name="environment"
          defaultValue="development"
          className="flex h-10 w-full rounded-md border border-border bg-[#0d1117] px-3 text-sm"
        >
          <option value="development">development</option>
          <option value="staging">staging</option>
          <option value="production">production</option>
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-[#f85149]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
