// import EmailEditor from "./email-editor";
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api, type RouterOutputs } from "@/trpc/react";
import { addDays, addHours, format, nextSaturday } from "date-fns";
// import EmailDisplay from "./email-display";
// import { useThread } from "../use-thread";
import useThreads from "./use-threads";
import { useAtom } from "jotai";
// import { isSearchingAtom, searchValueAtom } from "./search-bar";
// import SearchDisplay from "./search-display";
import { useLocalStorage } from "usehooks-ts";
import { thread as threadd } from "@/components/data";
import EmailDisplay from "./email-display";
import ReplyBox from "./reply-box";
import React, { useEffect, useState } from "react";
import openNewMail from "./open-new-mail";
import useDraft from "./use-draft";
import SearchDisplay from "./search-display";
import { isSearchingAtom } from "./search-bar";
import { BackwardIcon } from "@heroicons/react/24/solid";
import { useBreakpoint } from "@/lib/useBreakPoint";
import { cn } from "@/lib/utils";

export function ThreadDisplay() {
  const { isFetching, threadId, setThreadId, threads } = useThreads();
  const [userCurrentEmail, setUserCurrentEmail] = useLocalStorage(
    "userCurrentEmail",
    {
      emailAddress: "",
      name: "",
      id: "",
    },
  );
  const today = new Date();
  const thread = threads?.find((t) => t.id === threadId);
  // const [isSearching, setIsSearching] = useAtom(isSearchingAtom);

  const [accountId] = useLocalStorage("accountId", "");
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState<"reply" | "replyAll" | "forward">("reply");
  const [forward, setForward] = useState(false);
  const [newDraft, setNewDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);

  const { openMail } = openNewMail();
  const saveDraft = api.account.saveDraft.useMutation({
    onSuccess: (data) => {
      console.log(data);
      if (data) {
        setDraftId(data?.id!);
      }
    },
  });

  useEffect(() => {
    setOpen(thread?.hasDrafts ?? false);
    return () => setDraftId(undefined);
  }, [thread]);

  const openReply = (type: "reply" | "replyAll" | "forward") => {
    setOpen(true);
    setReply(type);
    if (thread) {
      const {
        accountId: accountid,
        threadId: threadid,
        subject,
        body,
        from,
        to,
        cc,
        bcc,
      } = useDraft({
        threadId: threadId as string,
        accountId,
        replyType: reply,
        thread,
      });

      saveDraft.mutate({
        accountId: accountid,
        threadId: threadid,
        subject,
        body,
        fromId: userCurrentEmail.id,
        to,
        cc,
        bcc,
        new: false,
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {!open ? (
        <Component thread={thread} openReply={openReply} />
      ) : (
        <ReplyBox type={reply} draftId={draftId} />
      )}
    </div>
  );
}

const Component = ({
  thread,
  openReply,
}: {
  thread: NonNullable<RouterOutputs["account"]["getThreads"][0]> | undefined;
  openReply: (type: "reply" | "replyAll" | "forward") => void;
}) => {
  const today = new Date();
  const [isSearching, setIsSearching] = useAtom(isSearchingAtom);
  const [openMobileMail, setOpenMobileMail] = useLocalStorage<boolean>(
    "openMobileMail",
    false,
  );

  const { isMobile } = useBreakpoint();

  return (
    <React.Fragment>
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpenMobileMail(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!thread}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), "E, h:m b")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!thread}
                onClick={() => openReply("reply")}
              >
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!thread}
                onClick={() => openReply("replyAll")}
              >
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!thread}
                onClick={() => openReply("forward")}
              >
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!thread}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />

      {!isMobile && isSearching ? (
        <SearchDisplay />
      ) : (
        <>
          {thread ? (
            <div className="flex flex-1 flex-col overflow-auto">
              <div className="flex items-start p-4">
                <div className="flex items-start gap-4 text-sm">
                  <Avatar>
                    <AvatarImage alt={"lol"} />
                    <AvatarFallback>
                      {thread?.emails[0]?.from?.name
                        ?.split(" ")
                        .map((chunk) => chunk[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <div
                      className={cn("font-semibold", isMobile && "text-[10px]")}
                    >
                      {thread.emails[0]?.from?.name}
                    </div>
                    <div
                      className={cn(
                        "line-clamp-1 text-xs",
                        isMobile && "text-[10px]",
                      )}
                    >
                      {thread.emails[0]?.subject}
                    </div>
                    <div
                      className={cn(
                        "line-clamp-1 text-xs",
                        isMobile && "text-[10px]",
                      )}
                    >
                      <span className="font-medium">Reply-To:</span>{" "}
                      {thread.emails[0]?.from?.email}
                    </div>
                  </div>
                </div>
                {thread.emails[0]?.createdTime && (
                  <div
                    className={cn(
                      "ml-auto text-xs text-muted-foreground",
                      isMobile && "text-[8px]",
                    )}
                  >
                    {format(new Date(thread.emails[0].createdTime), "PPpp")}
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex max-h-[calc(100vh-180px)] max-w-full flex-col overflow-auto">
                <div className="flex flex-col gap-4 p-6">
                  <ScrollArea>
                    {thread.emails.map((email) => {
                      return <EmailDisplay key={email.id} email={email} />;
                    })}
                  </ScrollArea>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-8 text-center text-muted-foreground">
                No message selected
              </div>
            </>
          )}
        </>
      )}
    </React.Fragment>
  );
};
