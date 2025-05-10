"use client";
import GhostExtension from "./extension";
import React, { useCallback, useEffect, useRef } from "react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import FileHandler from "@tiptap-pro/extension-file-handler";
import AttachmentNode from "./attachmentNode";
import { StarterKit } from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Text from "@tiptap/extension-text";
import { Button } from "@/components/ui/button";
import TipTapMenuBar from "./menu-bar";

import { generate } from "./action";
import { readStreamableValue } from "ai/rsc";
import { Separator } from "@/components/ui/separator";

import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import TagInput from "./tag-input";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useLocalStorage } from "usehooks-ts";
import { Bot, PaperclipIcon, XCircleIcon } from "lucide-react";
import { contacts } from "@/components/data";
import AIComposeButton from "./ai-compose-button";
import { GeistSans } from "geist/font/sans";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import useThreads from "../use-threads";
import { useQueryClient } from "@tanstack/react-query";
import debounce from "lodash.debounce";
import { toast } from "sonner";
import { useBreakpoint } from "@/lib/useBreakPoint";
import {
  addFileAtom,
  AttachmentList,
  attachmentsAtom,
  removeFileAtom,
  setDraftKeyAtom,
} from "./attachments";
import { useAtomValue, useSetAtom } from "jotai";

type EmailEditorProps = {
  toValues: {
    label: string;
    value: {
      name: string;
      email: string;
    };
  }[];
  ccValues: {
    label: string;
    value: {
      name: string;
      email: string;
    };
  }[];

  subject: string;
  setSubject: (subject: string) => void;
  handleSend: (value: object) => void;
  isSending: boolean;

  onToChange: (
    values: {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[],
  ) => void;
  onCcChange: (
    values: {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[],
  ) => void;

  defaultToolbarExpand?: boolean;
  threadId: string | null;
  draftId: string | null;
  body: string;
};

interface updatedDraftProps {
  subject: string;
  ccValues: {
    label: string;
    value: {
      name: string;
      email: string;
    };
  }[];

  toValues: {
    label: string;
    value: {
      name: string;
      email: string;
    };
  }[];
  body: string;
}

const EmailEditor = ({
  toValues,
  ccValues,
  subject,
  setSubject,
  handleSend,
  isSending,
  onToChange,
  onCcChange,
  defaultToolbarExpand,
  threadId,
  draftId,
  body,
}: EmailEditorProps) => {
  const [ref] = useAutoAnimate();
  const [accountId] = useLocalStorage("accountId", "");
  const [tab] = useLocalStorage("email-tab", "inbox");
  const { isDesktop, isMobile } = useBreakpoint();

  // Read-only view of attachments
  const attachments = useAtomValue(attachmentsAtom);
  // Actions to modify attachments
  const addFile = useSetAtom(addFileAtom);
  const removeFile = useSetAtom(removeFileAtom);
  const setDraftKey = useSetAtom(setDraftKeyAtom);

  const [userCurrentEmail] = useLocalStorage("userCurrentEmail", {
    emailAddress: "",
    name: "",
    id: "",
  });
  const { data: suggestions } = api.account.getEmailSuggestions.useQuery(
    { accountId: accountId },
    { enabled: !!accountId },
  );

  const [expanded, setExpanded] = React.useState(defaultToolbarExpand ?? false);

  const [generation, setGeneration] = React.useState("");

  const [draft, setDraft] = React.useState({
    subject,
    ccValues,
    toValues,
    body,
  });

  const utils = api.useUtils();
  const saveDraft = api.account.saveDraft.useMutation({
    onMutate: async (updatedDraft) => {
      await utils.account.getDrafts.cancel();
      const prevDrafts = utils.account.getDrafts;
      // @ts-ignore
      utils.account.getDrafts.setData({ accountId, tab }, (oldData) => {
        return oldData?.map((draft) => {
          if (draft.id === updatedDraft.draftId) {
            console.log(draft);
            return {
              id: draft.id,
              fromId: draft.fromId,
              accountId: draft.accountId,
              threadId: draft.threadId,
              body: updatedDraft.body,
              subject: updatedDraft.subject,
              to: updatedDraft.to,
              cc: updatedDraft.cc,
              bcc: updatedDraft.bcc,
              inReplyTo: updatedDraft.inReplyTo,
              updatedAt: draft.updatedAt,
              createdAt: draft.createdAt,
            };
          } else if (draft.id === draftId) {
            return {
              id: draft.id,
              fromId: draft.fromId,
              accountId: draft.accountId,
              threadId: draft.threadId,
              body: updatedDraft.body,
              subject: updatedDraft.subject,
              to: updatedDraft.to,
              cc: updatedDraft.cc,
              bcc: updatedDraft.bcc,
              inReplyTo: updatedDraft.inReplyTo,
              updatedAt: draft.updatedAt,
              createdAt: draft.createdAt,
            };
          } else {
            return draft;
          }
        });
      });
      return prevDrafts;
    },
    onError: (err, updatedDraft, context) => {
      utils.account.getDrafts.setData({ accountId, tab }, (oldData) => {
        return oldData;
      });
    },
    onSettled: () => {
      // utils.account.getDrafts.invalidate({ accountId, tab });
    },
  });

  const syncMutation = api.account.syncDraft.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(data.message);
        utils.account.getDrafts.invalidate({ accountId, tab: "drafts" });
        utils.account.getDrafts.invalidate({ accountId, tab: "sent" });
        utils.account.getNumThreads.invalidate({ accountId, tab: "drafts" });
      } else {
        toast.error(data?.message);
      }
    },
    onError: (data) => {
      console.log(data);
      toast.error(data?.message);
    },
  });

  if (subject !== draft.subject) {
    setDraft((prev) => {
      const updatedDraft = { ...prev, subject: subject };
      return updatedDraft;
    });
  }

  useEffect(() => {
    setDraft((prev) => {
      const updatedDraft = {
        ...prev,
        ccValues: ccValues,
        toValues: toValues,
        body: body,
      };
      return updatedDraft;
    });
    editor?.commands.setContent(body);
  }, [ccValues, toValues, body]);

  // useEffect(() => {
  //   setDraft((prev) => {
  //     const updatedDraft = { ...prev, body: body };
  //     return updatedDraft;
  //   });
  //   editor?.commands.setContent(body);
  // }, [body]);

  const aiGenerate = async (prompt: string) => {
    const { output } = await generate(prompt);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setGeneration(delta);
      }
    }
  };

  const customText = Text.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-j": ({ editor }) => {
          aiGenerate(editor.getText());
          console.log("Editor");
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    content: draft.body || "\n Write your email here",
    autofocus: false,
    extensions: [
      StarterKit,
      customText,
      GhostExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: true }),

      FileHandler.configure({
        allowedMimeTypes: ["application/pdf", "image/*"],
        onDrop: (editor, files, pos) => {
          console.log("on drop");
          for (const file of files) {
            addFile(file, accountId);
          }
        },
        onPaste: (editor, files) => {
          console.log("nnnihh");
        },
      }),
      AttachmentNode,
    ],

    onUpdate: ({ editor, transaction }) => {
      const newContent = editor.getHTML();
      setDraft((prev) => {
        const updatedDraft = { ...prev, body: newContent };
        saveDraftToServer(updatedDraft);
        return updatedDraft;
      });
    },
  });

  React.useEffect(() => {
    setDraftKey(draftId!);
  }, [draftId, setDraftKey]);

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

  const saveDraftToServer = useCallback(
    debounce((updatedDraft: updatedDraftProps) => {
      console.log(updatedDraft);
      // handleSend(value);

      const threadid = threadId ? threadId : "";
      const draftid = draftId ? draftId : "";
      saveDraft.mutate({
        accountId: accountId,
        threadId: threadid,
        draftId: draftid,
        subject: updatedDraft.subject,
        body: updatedDraft.body,
        to: updatedDraft.toValues?.map((email) => ({
          name: email.value.name,
          email: email.value.email,
        })),
        cc: updatedDraft.ccValues?.map((email) => ({
          name: email.value.name,
          email: email.value.email,
        })),
        fromId: userCurrentEmail.id,
        new: false,
      });
      return;
    }, 3000),
    [],
  );

  const syncDraft = () => {
    if (draftId) {
      syncMutation.mutate({ accountId, id: draftId });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDraft((prev) => {
      const updatedDraft = { ...prev, subject: value };
      saveDraftToServer(updatedDraft);
      return updatedDraft;
    });
  };

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => addFile(file, accountId));
  }

  function onDrop(e: React.DragEvent) {
    // e.preventDefault();
    handleFiles(e.dataTransfer.files);
    console.log(attachments);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div
      className={`${GeistSans.variable}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="flex border-b bg-muted">
        {editor && <TipTapMenuBar editor={editor} />}
      </div>
      <div ref={ref} className="space-y-2 p-4 pb-0">
        <TagInput
          suggestions={
            suggestions?.map((s) => ({
              name: s.name ?? "",
              email: s.email,
            })) || []
          }
          value={draft.toValues}
          placeholder="Add tags"
          label="To"
          onChange={(e) => {
            onToChange;
            setDraft((prev) => {
              const updatedDraft = { ...prev, toValues: e };
              saveDraftToServer(updatedDraft);
              return updatedDraft;
            });
          }}
          setExpanded={() => setExpanded((e) => !e)}
          expanded={expanded}
        />
        {expanded && (
          <>
            <TagInput
              suggestions={
                suggestions?.map((s) => ({
                  name: s.name ?? "",
                  email: s.email,
                })) || []
              }
              value={draft.ccValues}
              placeholder="Add tags"
              label="Cc"
              onChange={(e) => {
                onCcChange;
                setDraft((prev) => {
                  const updatedDraft = { ...prev, ccValues: e };
                  saveDraftToServer(updatedDraft);
                  return updatedDraft;
                });
              }}
            />
          </>
        )}
        <Input
          id="subject"
          className="w-full rounded-none border-0 border-b border-solid shadow-none"
          placeholder="Subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            handleChange(e);
          }}
        />

        <div className="flex items-center justify-end gap-2 text-xs">
          <AIComposeButton
            isComposing={defaultToolbarExpand}
            onGenerate={setGeneration}
          />
          {!isMobile && (
            <span className="text-xs">
              Tip: Press{" "}
              <kbd className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800">
                Cmd + J
              </kbd>{" "}
              for AI autocomplete
            </span>
          )}
          <Button
            onClick={async () => {
              syncDraft();
            }}
            disabled={syncMutation.isPending}
          >
            Save
          </Button>
        </div>
      </div>
      <div className="m-y-2 ml-4 flex flex-wrap items-center gap-2">
        {/* Attachment area */}

        <AttachmentList attachments={attachments} onRemove={removeFile} />
      </div>
      <div className="prose h-full w-full px-4">
        <EditorContent
          value={draft.body}
          editor={editor}
          placeholder="Write your email here..."
          className="h-full"
        />
      </div>
    </div>
  );
};

export default EmailEditor;
