"use client";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { Plus, Type } from "lucide-react";
import type { EditorBlock } from "@/lib/types";

type BlockEditorProps = {
  doc: Y.Doc;
};

export function BlockEditor({ doc }: BlockEditorProps) {
  const blocksArray = useMemo(() => doc.getArray<EditorBlock>("editor:blocks"), [doc]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    blocksArray.observe(refresh);

    if (blocksArray.length === 0) {
      blocksArray.push([createBlock("heading", "Untitled document"), createBlock("paragraph", "")]);
    }

    return () => blocksArray.unobserve(refresh);
  }, [blocksArray]);

  const blocks = useMemo(
    () => {
      void version;
      return blocksArray.toArray().sort((left, right) => left.order - right.order);
    },
    [blocksArray, version],
  );

  const updateBlock = (id: string, content: string) => {
    const index = blocksArray.toArray().findIndex((block) => block.id === id);
    if (index === -1) {
      return;
    }

    const existing = blocksArray.get(index);
    blocksArray.delete(index, 1);
    blocksArray.insert(index, [{ ...existing, content, updatedAt: Date.now() }]);
  };

  const addBlock = () => {
    blocksArray.push([createBlock("paragraph", "")]);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Live document</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Structured editor</h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          type="button"
          onClick={addBlock}
        >
          <Plus className="size-4" />
          Block
        </button>
      </div>

      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.id} className="group flex gap-3 rounded-md border bg-white p-3 shadow-sm">
            <div className="mt-2 text-slate-400">
              <Type className="size-4" />
            </div>
            <div
              className={`min-h-8 flex-1 outline-none ${
                block.type === "heading" ? "text-3xl font-semibold text-slate-950" : "text-base text-slate-700"
              }`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => updateBlock(block.id, event.currentTarget.textContent ?? "")}
            >
              {block.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function createBlock(type: EditorBlock["type"], content: string): EditorBlock {
  return {
    id: crypto.randomUUID(),
    type,
    content,
    order: Date.now(),
    updatedAt: Date.now(),
  };
}
