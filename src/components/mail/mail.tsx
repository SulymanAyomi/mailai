"use client";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkAccountButton } from "@/components/link-account-button";
import AccountSwitcher from "./AccountSwitcher";
import Sidebar from "./Sidebar";
import { ThreadList } from "./thread-list";
import { ThreadDisplay } from "./thread-display";
import { ComposeEmail } from "./compose-email";
import SearchBar from "./search-bar";

type MailProps = {
  defaultLayout: number[] | undefined;
  navCollapsedSize: number;
  defaultCollapsed: boolean;
};
const Mail = ({
  defaultLayout = [20, 32, 48],
  navCollapsedSize,
  defaultCollapsed,
}: MailProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [openNewMail, setOpenNewMail] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        // onLayout={(size: number) => console.log(size)}
        className="h-full min-h-screen items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={40}
          onResize={() => setIsCollapsed(false)}
          onCollapse={() => setIsCollapsed(true)}
          className={cn(
            isCollapsed &&
              "min-w-[60px] transition-all duration-300 ease-in-out",
          )}
        >
          <div className="flex h-full flex-1 flex-col">
            <div
              className={cn(
                "flex h-[52px] items-center justify-between",
                isCollapsed ? "h-[52px]" : "px-2",
              )}
            >
              {/* Account Switcher */}
              <AccountSwitcher isCollapsed />
              <LinkAccountButton />
            </div>
            <Separator />
            {/* Sidebar */}
            <Sidebar isCollapsed={false} />
            <div className="flex-1"></div>
            {/* AskAi */}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="inbox">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="inbox"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Inbox
                </TabsTrigger>
                <TabsTrigger
                  value="done"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Done
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            {/* search bar */}
            <SearchBar />
            <TabsContent value="inbox">{/* <ThreadList /> */}</TabsContent>
            <TabsContent value="done">done</TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          {openNewMail ? <ThreadDisplay /> : <ComposeEmail />}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
};

export default Mail;
