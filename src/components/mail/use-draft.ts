import { EmailAddress } from "@/lib/types";
import { api, RouterOutputs } from "@/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { atom, useAtom } from "jotai";
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import useThreads from "./use-threads";

interface saveDraftProp {
    threadId?: string;
    accountId: string;
    replyType: "reply" | "replyAll" | "forward"
    thread: RouterOutputs["account"]["getThreads"][0]
}

const useDraft = ({ threadId, accountId, replyType, thread }: saveDraftProp) => {
    let subject = ""
    const email = thread?.emails[0]!;
    const user = email.to.find((add) => accountId == add.userAccountId)
    const from = {
        name: user?.name ?? "",
        email: user?.email as string
    }
    let cc: EmailAddress[] = []

    let to: EmailAddress[] = [
        {
            name: email.from.name ?? email.from.email,
            email: email.from.email,
        },
    ]
    let body = ""

    let bcc: EmailAddress[] = []

    if (replyType == "reply") {
        subject = thread?.subject.startsWith("Re:") ? thread.subject : `Re: ${thread?.subject}`
        cc = []
    }
    else if (replyType == "replyAll") {
        subject = thread?.subject.startsWith("Re:") ? thread.subject : `Re: ${thread?.subject}`
        const allRecipients = email.to?.filter((email) => email.id !== accountId);
        cc = [
            {
                name: email?.from.name ?? email?.from.email,
                email: email?.from.email,
            },
            ...allRecipients.map((email) => ({
                name: email?.name ?? email?.email,
                email: email?.email,
            })),
        ]
    }
    else {
        subject =
            thread?.subject.startsWith("Fw:")
                ? thread.subject
                : `Fw: ${thread?.subject}`

        cc = []
        to = []
        bcc = []
    }



    return {
        accountId,
        threadId,
        subject,
        body,
        from,
        to,
        cc,
        bcc,
    }

};

export default useDraft;
