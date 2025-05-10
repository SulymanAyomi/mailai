import React, { useMemo, type ComponentProps } from "react";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
// import { useThread } from "@/app/mail/use-thread"
import { api, type RouterOutputs } from "@/trpc/react";
import { atom, useAtom } from "jotai";
// import useVim from "../kbar/use-vim"
import { useAutoAnimate } from "@formkit/auto-animate/react";
import useThreads from "./use-threads";
import { useLocalStorage } from "usehooks-ts";
import { isSearchingAtom } from "./search-bar";
import openNewMail from "./open-new-mail";
import { useBreakpoint } from "@/lib/useBreakPoint";

export function ThreadList() {
  const { isFetching, threadId, setThreadId, threads } = useThreads();
  const { isDesktop, isMobile } = useBreakpoint();

  const [tab] = useLocalStorage("email-tab", "inbox");
  const [unreadTab, setUnreadTab] = useLocalStorage<"all" | "unread">(
    "unread-tab",
    "all",
  );
  const [openMobileMail, setOpenMobileMail] = useLocalStorage<boolean>(
    "openMobileMail",
    false,
  );

  const { setOpenMail } = openNewMail();

  const [parent] = useAutoAnimate(/* optional config */);
  // const { selectedThreadIds, visualMode } = useVim();

  const filterdThread = useMemo(() => {
    return unreadTab === "unread"
      ? threads?.filter((thread) => thread.done)
      : threads;
  }, [unreadTab, threads]);

  const groupedThreads = filterdThread?.reduce(
    (acc, thread) => {
      const date = format(thread.lastMessageDate ?? new Date(), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(thread);
      return acc;
    },
    {} as Record<string, typeof threads>,
  );

  return (
    <div className="max-h-[calc(100vh-120px)] overflow-y-scroll">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {tab === "drafts" ? (
          <DraftComponet />
        ) : (
          <ScrollArea>
            {Object.entries(groupedThreads ?? {}).map(([date, threads]) => (
              <React.Fragment key={date}>
                <div className="mt-4 text-xs font-medium text-muted-foreground first:mt-0">
                  {format(new Date(date), "MMMM d, yyyy")}
                </div>
                {threads ? (
                  threads.map((item) => (
                    <button
                      id={`thread-${item.id}`}
                      key={item.id}
                      className={cn(
                        "relative flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                      )}
                      onClick={() => {
                        setThreadId(item.id);
                        setOpenMail("close");
                        setOpenMobileMail(true);
                      }}
                    >
                      {threadId === item.id && (
                        <motion.div
                          className="absolute inset-0 z-[-1] rounded-lg bg-black/10 dark:bg-white/20"
                          layoutId="thread-list-item"
                          transition={{
                            duration: 0.1,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex flex-row items-center font-semibold",
                                isMobile && "text-[12px]",
                              )}
                            >
                              {item.emails.at(-1)?.from?.name}
                              <span className="ml-4 h-2 w-2 rounded-full bg-blue-700"></span>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "ml-auto text-xs",
                              threadId === item.id
                                ? "text-foreground"
                                : "text-muted-foreground",
                              isMobile && "text-[9px]",
                            )}
                          >
                            {formatDistanceToNow(
                              item.emails.at(-1)?.createdTime ?? new Date(),
                              {
                                addSuffix: true,
                              },
                            )}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "text-xs font-medium",
                            isMobile && "text-[8px]",
                          )}
                        >
                          {item.subject}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "line-clamp-2 text-xs text-muted-foreground",
                          isMobile && "text-[8px]",
                        )}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            item.emails.at(-1)?.bodySnippet ?? "",
                            {
                              USE_PROFILES: { html: true },
                            },
                          ),
                        }}
                      ></div>
                      {item.emails[0]?.folders.length ? (
                        <div className={cn("flex items-center gap-2")}>
                          {item.emails.at(0)?.folders.map((label) => (
                            <Badge
                              key={label}
                              variant={getBadgeVariantFromLabel(label)}
                              className={cn(isMobile && "text-[8px]")}
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <div>No message available</div>
                )}
              </React.Fragment>
            ))}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

const DraftComponet = () => {
  const { drafts, draftId, setDraftId } = useThreads();
  if (drafts) {
    return (
      <ScrollArea>
        {drafts?.map((draft) => (
          <React.Fragment key={draft.id}>
            <div className="mt-4 text-xs font-medium text-muted-foreground first:mt-0">
              {format(draft.updatedAtRemote ?? draft.updatedAt, "MMMM d, yyyy")}
            </div>
            <button
              id={`thread-${draft.id}`}
              key={draft.id}
              className={cn(
                "relative flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm text-muted-foreground transition-all",
                // visualMode &&
                //   selectedThreadIds.includes(item.id) &&
                //   "bg-blue-200 dark:bg-blue-900",
              )}
              onClick={() => {
                setDraftId(draft.id);
                // setOpenMail("close");
              }}
            >
              {draftId === draft.id && (
                <motion.div
                  className="absolute inset-0 z-[-1] rounded-lg bg-black/10 dark:bg-white/20"
                  layoutId="thread-list-item"
                  transition={{
                    duration: 0.1,
                    ease: "easeInOut",
                  }}
                />
              )}
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">
                      {Array.isArray(draft.to) && draft.to
                        ? // @ts-ignore
                          draft.to?.at(-1)?.label
                        : ""}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "ml-auto text-xs",
                      draftId === draft.id
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDistanceToNow(
                      draft.updatedAtRemote ?? draft.updatedAt,
                      {
                        addSuffix: true,
                      },
                    )}
                  </div>
                </div>
                <div className="text-xs font-medium">{draft.subject}</div>
              </div>
              <div
                className="line-clamp-2 text-xs text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(draft.body ?? "", {
                    USE_PROFILES: { html: true },
                  }),
                }}
              ></div>
              <div className="flex items-center gap-2">
                <Badge
                  key={"draft"}
                  variant={getBadgeVariantFromLabel("draft")}
                >
                  {"draft"}
                </Badge>
              </div>
            </button>
          </React.Fragment>
        ))}
      </ScrollArea>
    );
  }
};

function getBadgeVariantFromLabel(
  label: string,
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary";
}
