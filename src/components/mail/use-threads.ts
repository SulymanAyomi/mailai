import { api } from "@/trpc/react";
import { getQueryKey } from "@trpc/react-query";
import { atom, useAtom } from "jotai";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

export const threadIdAtom = atom<string | null>(null);
export const draftIdAtom = atom<string | null>(null);
const useThreads = () => {
  const { data: accounts } = api.account.getAccounts.useQuery();
  const [accountId] = useLocalStorage("accountId", "");
  const [tab] = useLocalStorage("email-tab", "inbox");
  const [unread] = useLocalStorage("unread", false);
  const [threadId, setThreadId] = useAtom(threadIdAtom);
  const [draftId, setDraftId] = useAtom(draftIdAtom);

  const queryKey = getQueryKey(
    api.account.getThreads,
    { accountId, tab, unread },
    "query",
  );
  const {
    data: threads,
    isFetching,
    refetch,
  } = api.account.getThreads.useQuery(
    {
      accountId,
      unread,
      tab,
    },
    {
      enabled: !!accountId && !!tab,
      placeholderData: (e) => e,
      // refetchInterval: 1000 * 5,
    },
  );

  const {
    data: drafts,
    isFetching: isFetchingDraft,
    refetch: RefetchDraft,
  } = api.account.getDrafts.useQuery(
    {
      accountId,
      tab,
    },
    {
      enabled: !!accountId && !!tab,
      placeholderData: (e) => e,
      // refetchInterval: 1000 * 5,
    },
  );

  return {
    threads,
    isFetching,
    account: accounts?.find((account) => account.id === accountId),
    refetch,
    accounts,
    queryKey,
    accountId,
    threadId,
    setThreadId,
    drafts,
    isFetchingDraft,
    setDraftId,
    draftId,
  };
};

export default useThreads;
