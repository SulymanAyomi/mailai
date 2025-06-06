import React, { type ComponentProps } from "react";
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
// import useVim from "./kbar/use-vim"
// import { useAutoAnimate } from "@formkit/auto-animate/react"
import useThreads from "./use-threads";
import { useLocalStorage } from "usehooks-ts";
// import { isSearchingAtom } from "./search-bar"
import { thread } from "../data";

export function UnReadThreadList() {
  const { isFetching, threadId, setThreadId, threads } = useThreads();

  // const [parent] = useAutoAnimate(/* optional config */);
  // const { selectedThreadIds, visualMode } = useVim();
  const groupedThreads = threads?.reduce(
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
    <div className="max-h-[calc(100vh-120px)] max-w-full overflow-y-scroll">
      <div className="flex flex-col gap-2 p-4 pt-0">
        <ScrollArea>
          {Object.entries(groupedThreads ?? {}).map(([date, threads]) => (
            <React.Fragment key={date}>
              <div className="mt-4 text-xs font-medium text-muted-foreground first:mt-0">
                {format(new Date(date), "MMMM d, yyyy")}
              </div>
              {threads.map((item) => (
                <button
                  id={`thread-${item.id}`}
                  key={item.id}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                    // visualMode &&
                    //   selectedThreadIds.includes(item.id) &&
                    //   "bg-blue-200 dark:bg-blue-900",
                  )}
                  onClick={() => {
                    setThreadId(item.id);
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
                        <div className="font-semibold">
                          {item.emails.at(-1)?.from?.name}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "ml-auto text-xs",
                          threadId === item.id
                            ? "text-foreground"
                            : "text-muted-foreground",
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
                    <div className="text-xs font-medium">{item.subject}</div>
                  </div>
                  <div
                    className="line-clamp-2 text-xs text-muted-foreground"
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
                    <div className="flex items-center gap-2">
                      {item.emails.at(0)?.folders.map((label) => (
                        <Badge
                          key={label}
                          variant={getBadgeVariantFromLabel(label)}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </React.Fragment>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}

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
