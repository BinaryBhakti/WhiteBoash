"use client";

import { useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

type CollaborativeEditorProps = {
  doc: Y.Doc;
  provider: HocuspocusProvider;
  readOnly: boolean;
  title: string;
};

export function CollaborativeEditor({ doc, provider, readOnly, title }: CollaborativeEditorProps) {
  const user = useMemo(
    () => ({
      name: "Collaborator",
      color: "#0f766e",
    }),
    [],
  );

  const editor = useEditor({
    editable: !readOnly,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCursor.configure({
        provider,
        user,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[520px] rounded-md border bg-white px-8 py-7 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20",
      },
    },
  }, [doc, provider, readOnly, user]);

  return (
    <div className="mx-auto grid min-h-full max-w-6xl grid-cols-1 gap-5 px-6 py-10 lg:grid-cols-[1fr_280px]">
      <main>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            {readOnly ? "Read-only document" : "Live document"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
        </div>
        <EditorContent editor={editor} />
      </main>
      <aside className="h-fit rounded-md border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-950">Outline</h2>
        <p className="mt-3 text-sm text-slate-500">
          Headings and collaborator activity will appear here as the document grows.
        </p>
      </aside>
    </div>
  );
}
