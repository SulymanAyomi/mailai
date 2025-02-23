"use client";
import GhostExtension from "./extension";
import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import TipTapMenuBar from "./menu-bar";
import Text from "@tiptap/extension-text";
import { Button } from "@/components/ui/button";

import { generate } from "./action";
// import { readStreamableValue } from 'ai/rsc';
import { Separator } from "@/components/ui/separator";
// import { useThread } from "../../use-thread";
// import useThreads from "../../use-threads";
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import TagInput from "./tag-input";
// import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useLocalStorage } from "usehooks-ts";
import { Bot } from "lucide-react";
import { contacts } from "@/components/data";
import AIComposeButton from "./ai-compose-button";

type EmailEditorProps = {
  toValues: { label: string; value: string }[];
  ccValues: { label: string; value: string }[];

  subject: string;
  setSubject: (subject: string) => void;
  to: string[];
  handleSend: (value: string) => void;
  isSending: boolean;

  onToChange: (values: { label: string; value: string }[]) => void;
  onCcChange: (values: { label: string; value: string }[]) => void;

  defaultToolbarExpand?: boolean;
};

const EmailEditor = ({
  toValues,
  ccValues,
  subject,
  setSubject,
  to,
  handleSend,
  isSending,
  onToChange,
  onCcChange,
  defaultToolbarExpand,
}: EmailEditorProps) => {
  // const [ref] = useAutoAnimate();
  const [accountId] = useLocalStorage("accountId", "");
  // const { data: suggestions } = api.account.getEmailSuggestions.useQuery({ accountId: accountId, query: '' }, { enabled: !!accountId });
  const suggestions = contacts;

  const [expanded, setExpanded] = React.useState(defaultToolbarExpand ?? false);

  const [generation, setGeneration] = React.useState("");

  // const aiGenerate = async (prompt: string) => {
  //     const { output } = await generate(prompt)

  //     for await (const delta of readStreamableValue(output)) {
  //         if (delta) {
  //             setGeneration(delta);
  //         }
  //     }

  // }

  const customText = Text.extend({
    addKeyboardShortcuts() {
      return {
        "Meta-j": () => {
          // aiGenerate(this.editor.getText());
          console.log("Editor");
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    autofocus: false,
    extensions: [StarterKit, customText, GhostExtension],
    editorProps: {
      attributes: {
        placeholder: "Write your email here...",
      },
    },
    onUpdate: ({ editor, transaction }) => {
      setValue(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        editor &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName || "",
        )
      ) {
        editor.commands.focus();
      }
      if (event.key === "Escape" && editor) {
        editor.commands.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  React.useEffect(() => {
    if (!generation || !editor) return;
    editor.commands.insertContent(generation);
  }, [generation, editor]);

  const [value, setValue] = React.useState("");

  return (
    <div>
      <div className="flex border-b bg-muted">
        {editor && <TipTapMenuBar editor={editor} />}
      </div>

      {/* <div ref={ref} className="space-y-2 p-4 pb-0"> */}
      <div className="space-y-2 px-4 pb-0 pt-0">
        <TagInput
          suggestions={suggestions?.map((s) => s.email) || []}
          value={toValues}
          placeholder="Add tags"
          label="To"
          onChange={onToChange}
          setExpanded={() => setExpanded((e) => !e)}
          expanded={expanded}
        />
        {expanded && (
          <>
            <TagInput
              suggestions={suggestions?.map((s) => s.email) || []}
              value={ccValues}
              placeholder="Add tags"
              label="Cc"
              onChange={onCcChange}
            />
          </>
        )}
        <Input
          id="subject"
          className="w-full rounded-none border-0 border-b border-solid shadow-none"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 text-xs">
          <AIComposeButton
            isComposing={defaultToolbarExpand}
            onGenerate={setGeneration}
          />
          <span className="text-xs">
            Tip: Press{" "}
            <kbd className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800">
              Cmd + J
            </kbd>{" "}
            for AI autocomplete
          </span>
          {/* <Button
            onClick={async () => {
              editor?.commands.clearContent();
              handleSend(value);
            }}
            //   isLoading={isSending}
          >
            Send
          </Button> */}
        </div>
      </div>
      <div className="prose h-1/3 w-full px-4">
        <EditorContent
          value={value}
          editor={editor}
          placeholder="Write your email here..."
        />
      </div>
    </div>
  );
};

export default EmailEditor;
