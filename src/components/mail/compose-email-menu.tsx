"use client";
import {
  Trash2,
  Send,
  ArrowLeft,
  MoreVertical,
  File,
  Table,
  PictureInPicture2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import openNewMail from "./open-new-mail";
import { useBreakpoint } from "@/lib/useBreakPoint";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { isAIComposeOpenAtom } from "./email-editor/ai-compose-button";
import { useAtom } from "jotai";

export const ComposeEmailMenu = ({ id }: { id: string }) => {
  const [editorMenu, setEditorMenu] = useLocalStorage("editorMenu", "");
  const [accountId] = useLocalStorage("accountId", "");
  const { openMail, setOpenMail } = openNewMail();
  const [openMobileMail, setOpenMobileMail] = useLocalStorage<boolean>(
    "openMobileMail",
    false,
  );
  const [isAIComposeOpen, setIsAIComposeOpenAtom] =
    useAtom(isAIComposeOpenAtom);
  const { isDesktop, isMobile } = useBreakpoint();

  const menu = ["format", "insert", "options", "table"];

  const utils = api.useUtils();
  const deleteMutation = api.account.deleteDraft.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(data.message);
        utils.account.getDrafts.invalidate({ accountId, tab: "drafts" });
        utils.account.getNumThreads.invalidate({ accountId, tab: "drafts" });
      } else {
        toast.error(data?.message);
      }
    },
    onError: (data) => {
      console.log(data);
      toast.error(data?.message);
      setOpenMail("close");
    },
  });

  const sendMutation = api.account.sendDraft.useMutation({
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(data.message);
        utils.account.getDrafts.invalidate({ accountId, tab: "drafts" });
        utils.account.getDrafts.invalidate({ accountId, tab: "sent" });
        utils.account.getNumThreads.invalidate({ accountId, tab: "drafts" });
      } else {
        toast.error(data?.message);
      }
    },
    onError: (data) => {
      console.log(data);
      toast.error(data?.message);
      setOpenMail("close");
    },
  });

  const handleDelete = async () => {
    console.log("im here", id);
    deleteMutation.mutate({ accountId, id });
    setOpenMail("close");
  };
  const handleSend = async () => {
    console.log("im here", id);
    sendMutation.mutate({ accountId, id });
  };

  const DesktopMenu = () => (
    <div className="flex items-center p-2">
      <div className="flex items-center gap-2">
        {menu.map((label) => (
          <div
            key={label}
            onClick={() => setEditorMenu(label)}
            className={cn(
              editorMenu == label
                ? "h-9 border-collapse cursor-pointer rounded-md px-4 py-2 font-medium dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white"
                : "h-9 cursor-pointer justify-start rounded-md px-4 py-2 text-muted-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
            )}
          >
            <span className="capitalize">{label}</span>
          </div>
        ))}
      </div>
      <div className="ml-auto flex items-center">
        <Button
          variant="ghost"
          size="default"
          className="flex items-center gap-1"
          onClick={() => handleDelete()}
        >
          <Trash2 className="h-4 w-4" />
          <span>Discard</span>
        </Button>
        <Button
          variant="ghost"
          size="default"
          className="flex items-center gap-1"
          onClick={() => handleSend()}
        >
          <Send className="h-4 w-4" />
          <span>Send</span>
        </Button>
      </div>
    </div>
  );

  const MobileMenu = () => (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpenMobileMail(false)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
      </div>
      <div className="relative ml-auto flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <File className="h-4 w-4" />
              <span className="sr-only">Insert</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <PictureInPicture2 className="h-4 w-4" />
              Photos
            </DropdownMenuItem>
            <DropdownMenuItem>
              <File className="h-4 w-4" />
              File
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Table className="h-4 w-4" />
              Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="default"
          className="flex items-center gap-1"
          onClick={() => handleDelete()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="default"
          className="flex items-center gap-1"
          onClick={() => handleSend()}
        >
          <Send className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsAIComposeOpenAtom(true)}>
              Auto compose
            </DropdownMenuItem>
            <DropdownMenuItem>Schedule send</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSend()}>
              Save draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return <>{isMobile ? <MobileMenu /> : <DesktopMenu />}</>;
};
