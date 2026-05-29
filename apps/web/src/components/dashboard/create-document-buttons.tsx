"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Plus } from "lucide-react";
import type { DocumentType } from "@/lib/types";

type CreateDocumentButtonsProps = {
  workspaceId: string;
};

type Template = {
  label: string;
  title: string;
  type: DocumentType;
  summary: string;
};

const templates: Template[] = [
  {
    label: "Brainstorm",
    title: "Brainstorm board",
    type: "canvas",
    summary: "Template for collaborative idea mapping.",
  },
  {
    label: "Sprint plan",
    title: "Sprint planning document",
    type: "text",
    summary: "Template for goals, scope, owners, and follow-ups.",
  },
  {
    label: "Research doc",
    title: "Research notes",
    type: "text",
    summary: "Template for findings, references, and decisions.",
  },
  {
    label: "Flow map",
    title: "Flow map board",
    type: "canvas",
    summary: "Template for mapping flows and system paths.",
  },
];

export function CreateDocumentButtons({ workspaceId }: CreateDocumentButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <CreateButton workspaceId={workspaceId} type="canvas" title="Untitled whiteboard" variant="primary" />
      <CreateButton workspaceId={workspaceId} type="text" title="Untitled document" variant="secondary" />
    </div>
  );
}

export function TemplateGrid({ workspaceId }: CreateDocumentButtonsProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {templates.map((template) => (
        <TemplateButton key={template.label} template={template} workspaceId={workspaceId} />
      ))}
    </div>
  );
}

function CreateButton({
  workspaceId,
  type,
  title,
  variant,
}: {
  workspaceId: string;
  type: DocumentType;
  title: string;
  variant: "primary" | "secondary";
}) {
  const label = type === "canvas" ? "Board" : "Doc";
  const Icon = type === "canvas" ? Plus : FileText;

  return (
    <CreateDocumentTrigger
      className={
        variant === "primary"
          ? "inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      }
      payload={{ workspaceId, type, title }}
    >
      <Icon className="size-4" />
      {label}
    </CreateDocumentTrigger>
  );
}

function TemplateButton({ workspaceId, template }: { workspaceId: string; template: Template }) {
  return (
    <CreateDocumentTrigger
      className="rounded-md border px-3 py-6 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      payload={{
        workspaceId,
        type: template.type,
        title: template.title,
        summary: template.summary,
      }}
    >
      {template.label}
    </CreateDocumentTrigger>
  );
}

function CreateDocumentTrigger({
  children,
  className,
  payload,
}: {
  children: React.ReactNode;
  className: string;
  payload: {
    workspaceId: string;
    type: DocumentType;
    title: string;
    summary?: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { href?: string; error?: string };
      if (!response.ok || !result.href) {
        setError(result.error ?? "Could not create document.");
        return;
      }

      router.push(result.href);
      router.refresh();
    });
  }

  return (
    <div>
      <button className={className} disabled={isPending} onClick={create} type="button">
        {isPending ? "Creating..." : children}
      </button>
      {error ? <p className="mt-2 max-w-40 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
