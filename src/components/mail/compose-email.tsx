"use client";
import { Trash2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";

import EmailEditor from "./email-editor";
import { useEffect, useRef, useState } from "react";
import { atom, useAtom } from "jotai";
import { useLocalStorage } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { ComposeEmailMenu } from "./compose-email-menu";
import { api, type RouterOutputs } from "@/trpc/react";
import { object } from "zod";

export function ComposeEmail() {
  const [accountId] = useLocalStorage("accountId", "");
  const [userCurrentEmail, setUserCurrentEmail] = useLocalStorage(
    "userCurrentEmail",
    {
      emailAddress: "",
      name: "",
      id: "",
    },
  );
  const [toValues, setToValues] = useState<
    {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[]
  >([]);
  const [ccValues, setCcValues] = useState<
    {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[]
  >([]);
  const [bccValues, setBccValues] = useState<
    { label: string; value: string }[]
  >([]);
  const [subject, setSubject] = useState("subject");
  const [draftId, setDraftId] = useState<string | null>(null);
  const hasCreated = useRef(false);
  const utils = api.useUtils();
  const saveDraft = api.account.saveDraft.useMutation({
    onSuccess: (data) => {
      if (data != null) {
        setDraftId(data.id!);
        utils.account.getDrafts.invalidate({ accountId, tab: "drafts" });
        utils.account.getNumThreads.invalidate({ accountId, tab: "drafts" });
      }
    },
  });

  useEffect(() => {
    if (!hasCreated.current) {
      saveDraft.mutate({
        accountId,
        subject,
        body: "",
        fromId: userCurrentEmail.id,
        to: [],
        cc: [],
        bcc: [],
        new: true,
      });
      hasCreated.current = true;
      console.log("new draftt");
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Separator />
      {draftId && (
        <>
          <ComposeEmailMenu id={draftId} />
          <EmailEditor
            toValues={toValues}
            ccValues={ccValues}
            onToChange={(values) => {
              setToValues(values);
            }}
            onCcChange={(values) => {
              setCcValues(values);
            }}
            subject={subject}
            setSubject={setSubject}
            handleSend={() => {}}
            isSending={false}
            threadId={null}
            body={"<br><br> sent form emailAI"}
            draftId={draftId}
          />
        </>
      )}
    </div>
  );
}
