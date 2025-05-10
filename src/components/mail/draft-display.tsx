"use client";

import { Separator } from "@/components/ui/separator";
import EmailEditor from "./email-editor";
import { useEffect, useState } from "react";

import { ComposeEmailMenu } from "./compose-email-menu";
import useThreads from "./use-threads";

export function DraftDisplay() {
  const { isFetchingDraft, drafts, draftId } = useThreads();

  const draft = drafts?.find((draft) => draft.id === draftId);

  const [toValues, setToValues] = useState<
    {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[]
  >(() => {
    if (Array.isArray(draft?.to) && draft?.to) {
      // @ts-ignore
      return draft.to?.map(
        // @ts-ignore
        (email: { name: string; email: string }) => ({
          label: email.name ?? email.email,
          value: { name: email.name, email: email.email },
        }),
      );
      // @ts-ignore
    }
    return [];
  });
  const [ccValues, setCcValues] = useState<
    {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[]
  >(() => {
    if (Array.isArray(draft?.cc) && draft.cc) {
      // @ts-ignore
      return draft.cc?.map(
        // @ts-ignore
        (email: { name: string; email: string }) => ({
          label: email.name ?? email.email,
          value: { name: email.name, email: email.email },
        }),
      );
    }
    return [];
  });
  const [bccValues, setBccValues] = useState<
    { label: string; value: string }[]
  >([]);
  const [subject, setSubject] = useState(draft?.subject);
  const [body, setBody] = useState(draft?.body);

  function setDraftFunc() {
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
      if (Array.isArray(draft.to) && draft.to) {
        // @ts-ignore
        const to = draft.to?.map(
          // @ts-ignore
          (email: { name: string; email: string }) => ({
            label: email.name ?? email.email,
            value: { name: email.name, email: email.email },
          }),
        );
        setToValues(to);
      }
      if (Array.isArray(draft.cc) && draft.cc) {
        // @ts-ignore
        const cc = draft.cc?.map(
          // @ts-ignore
          (email: { name: string; email: string }) => ({
            label: email.name ?? email.email,
            value: { name: email.name, email: email.email },
          }),
        );
        setCcValues(cc);
      }
    }
  }

  useEffect(() => {
    setDraftFunc();
  }, [draftId]);

  return (
    <div className="flex h-full flex-col">
      <Separator />
      {draft && !isFetchingDraft && (
        <>
          <ComposeEmailMenu id={draft.id} />
          <EmailEditor
            toValues={toValues}
            ccValues={ccValues}
            onToChange={(values) => {
              setToValues(values);
            }}
            onCcChange={(values) => {
              setCcValues(values);
            }}
            subject={subject || ""}
            setSubject={setSubject}
            handleSend={() => {}}
            isSending={false}
            threadId={null}
            body={draft.body ?? ""}
            draftId={draft?.id!}
          />
        </>
      )}
    </div>
  );
}
