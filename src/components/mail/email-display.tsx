"use client";
import Avatar from "react-avatar";
import { Letter } from "react-letter";
import { api, type RouterOutputs } from "@/trpc/react";
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import useThreads from "./use-threads";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useBreakpoint } from "@/lib/useBreakPoint";

type Props = {
  email: RouterOutputs["account"]["getThreads"][number]["emails"][number];
};

const EmailDisplay = ({ email }: Props) => {
  const { account } = useThreads();
  const letterRef = React.useRef<HTMLDivElement>(null);
  const { isMobile } = useBreakpoint();

  React.useEffect(() => {
    if (letterRef.current) {
      const gmailQuote = letterRef.current.querySelector(
        'div[class*="_gmail_quote"]',
      );
      if (gmailQuote) {
        gmailQuote.innerHTML = "";
      }
    }
  }, [email]);

  const isMe = account?.emailAddress === email.from.email;

  return (
    <div
      className={cn(
        "cursor-pointer rounded-md border p-4 transition-all hover:translate-x-2",
        {
          "border-l-4 border-l-gray-900": isMe,
        },
      )}
      ref={letterRef}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isMe && (
            <Avatar
              name={email.from.name ?? email.from.email}
              email={email.from.email}
              size="35"
              textSizeRatio={2}
              round={true}
            />
          )}
          <span className={cn("font-medium", isMobile && "text-[10px]")}>
            {isMe ? "Me" : email.from.email}
          </span>
        </div>
        <p
          className={cn(
            "text-xs text-muted-foreground",
            isMobile && "text-[10px]",
          )}
        >
          {formatDistanceToNow(email.createdTime ?? new Date(), {
            addSuffix: true,
          })}
        </p>
      </div>
      <Letter
        className={cn(
          "rounded-mds mt-2 text-foreground",
          isMobile && "text-[10px]",
        )}
        html={email?.body ?? ""}
      />
    </div>
  );
};

export default EmailDisplay;
