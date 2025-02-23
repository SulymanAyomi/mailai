import { api } from "@/trpc/react";
import { getQueryKey } from "@trpc/react-query";
import { atom, useAtom } from "jotai";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

export const threadIdAtom = atom<string | null>(null);
const useThreads = () => {
  const { data: accounts } = api.account.getAccounts.useQuery();
  const [accountId] = useLocalStorage("accountId", "");
  const [tab] = useLocalStorage("email-tab", "inbox");
  const [done] = useLocalStorage("email-done", false);
  const [threadId, setThreadId] = useAtom(threadIdAtom);

  const queryKey = getQueryKey(
    api.account.getThreads,
    { accountId, tab, done },
    "query",
  );
  const {
    data: threads,
    isFetching,
    refetch,
  } = api.account.getThreads.useQuery(
    {
      accountId,
      done,
      tab,
    },
    {
      enabled: !!accountId && !!tab,
      placeholderData: (e) => e,
      refetchInterval: 1000 * 5,
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
  };
};

export default useThreads;
