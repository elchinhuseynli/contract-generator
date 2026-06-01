"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { toRichHtml } from "@/lib/contract/richtext";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      // Keep selection in the editor when clicking a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-muted text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  id,
  value,
  onChange,
  ariaInvalid,
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  ariaInvalid?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        code: false,
        link: false,
        underline: false,
      }),
    ],
    content: toRichHtml(value),
    editorProps: {
      attributes: {
        class: "rte-content",
        role: "textbox",
        "aria-multiline": "true",
        ...(id ? { id } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external changes (form reset, version restore) without stealing the caret.
  React.useEffect(() => {
    if (!editor) return;
    const next = toRichHtml(value);
    if (next !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      data-invalid={ariaInvalid ? "" : undefined}
      className={cn(
        "rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "data-[invalid]:border-destructive data-[invalid]:focus-within:ring-destructive/30"
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-input px-1.5 py-1">
        <ToolbarButton
          label="Tučné"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Kurzíva"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Odrážky"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Číslovaný seznam"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Zpět"
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Vpřed"
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
