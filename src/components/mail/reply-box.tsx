"use client";
import React from "react";
import EmailEditor from "./email-editor";
import useThreads from "./use-threads";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { thread } from "../data";
import { ComposeEmailMenu } from "./compose-email-menu";
import useDraft from "./use-draft";

const ReplyBox = ({
  type,
  draftId,
}: {
  type: "reply" | "replyAll" | "forward";
  draftId: string | undefined;
}) => {
  const { accountId, threadId } = useThreads();

  const { data, isLoading } = api.account.getDraft.useQuery(
    {
      threadId: threadId!,
      id: draftId,
      accountId: accountId,
    },
    {
      enabled: !!draftId || !!threadId,
    },
  );

  if (!threadId || !data) return <></>;
  if (isLoading) return <></>;

  return (
    <>
      <ComposeEmailMenu id={data.id} />
      <Component data={data} type={type} />
    </>
  );
};

const Component = ({
  data,
  type,
}: {
  data: NonNullable<RouterOutputs["account"]["getDraft"]> | undefined;
  type: "reply" | "replyAll" | "forward";
}) => {
  const { accountId, threadId } = useThreads();

  const draft = React.useMemo(() => data, [data]);
  const [subject, setSubject] = React.useState(
    draft?.subject?.startsWith("Re:") ? draft.subject : `Re: ${draft?.subject}`,
  );
  const [body, setBody] = React.useState(draft?.body || "");

  const [toValues, setToValues] = React.useState<
    {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[]
  >([]);
  const [ccValues, setCcValues] = React.useState<
    {
      label: string;
      value: {
        name: string;
        email: string;
      };
    }[]
  >([]);

  function setDraftFunc() {
    if (draft) {
      setSubject(draft.subject ?? "");
      setBody(draft.body ?? "");
      if (Array.isArray(draft.to) && draft.to) {
        // @ts-ignore
        const to = draft.to?.map(
          // @ts-ignore
          (email: { name: string; email: string }) => ({
            label: email.name ?? email.name,
            value: { name: email.name, email: email.email },
          }),
        );
        // @ts-ignore
        setToValues(to);
      }
      if (Array.isArray(draft.cc) && draft.cc) {
        // @ts-ignore
        const cc = draft.cc?.map(
          // @ts-ignore
          (email: { name: string; email: string }) => ({
            label: email.name,
            value: { name: email.name, email: email.email },
          }),
        );
        setCcValues(cc);
      }
    }
  }

  const sendEmail = api.account.sendEmail.useMutation();

  React.useEffect(() => {
    if (draft) {
      setDraftFunc();
    }
    return () => {
      setSubject("");
      setBody("");
      setCcValues([]);
      setToValues([]);
    };
  }, [threadId, draft]);

  const handleSend = async (draft: object) => {
    // sendEmail.mutate(
    //   {
    //     accountId,
    //     threadId: threadId ?? undefined,
    //     body: value,
    //     subject,
    //     from: replyDetails.from,
    //     to: replyDetails.to.map((to) => ({
    //       name: to.name ?? to.email,
    //       email: to.email,
    //       id: to.id,
    //     })),
    //     cc: replyDetails.cc.map((cc) => ({
    //       name: cc.name ?? cc.email,
    //       email: cc.email,
    //       id: cc.id,
    //     })),
    //     replyTo: replyDetails.from,
    //     inReplyTo: replyDetails.from,
    //   },
    //   {
    //     onSuccess: () => {
    //       toast.success("Email sent");
    //       // editor?.commands.clearContent()
    //     },
    //   },
    // );
  };

  return (
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
      handleSend={handleSend}
      isSending={sendEmail.isPending}
      threadId={draft?.threadId ?? null}
      body={body}
      draftId={draft?.id ?? null}
    />
  );
};

export default ReplyBox;
