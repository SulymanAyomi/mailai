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
import SearchBar, { isSearchingAtom } from "./search-bar";
import { useLocalStorage } from "usehooks-ts";
import openNewMail from "./open-new-mail";
import { DraftDisplay } from "./draft-display";
import ChatAI from "./chatAi";
import PremiumBanner from "./premium-banner";
import { useBreakpoint } from "@/lib/useBreakPoint";
import SearchDisplay from "./search-display";
import { useAtom } from "jotai";

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
  const [unreadTab, setUnreadTab] = useLocalStorage<"all" | "unread">(
    "unread-tab",
    "all",
  );
  const [openMobileMail, setOpenMobileMail] = useLocalStorage<boolean>(
    "openMobileMail",
    false,
  );
  const { openMail } = openNewMail();
  const [tab] = useLocalStorage("email-tab", "inbox");
  const { isDesktop, isMobile } = useBreakpoint();
  const [isSearching, setIsSearching] = useAtom(isSearchingAtom);

  const MobileDisplay = () => {
    return (
      <TooltipProvider delayDuration={0}>
        {!openMobileMail ? (
          <>
            <ResizablePanelGroup
              direction="horizontal"
              onLayout={(sizes: number[]) => {
                document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                  sizes,
                )}`;
              }}
              className="h-full min-h-screen items-stretch"
            >
              <ResizablePanel
                defaultSize={defaultLayout[0]}
                collapsedSize={navCollapsedSize}
                collapsible={true}
                minSize={15}
                maxSize={30}
                onResize={() => {
                  setIsCollapsed(false);
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                    false,
                  )}`;
                }}
                onCollapse={() => {
                  setIsCollapsed(true);
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                    true,
                  )}`;
                }}
                className={cn(
                  isCollapsed &&
                    "min-w-[60px] transition-all duration-300 ease-in-out",
                )}
              >
                <div className="flex h-full flex-1 flex-col">
                  <div
                    className={cn(
                      "flex h-[52px] items-center justify-center",
                      isCollapsed ? "h-[52px]" : "px-2",
                    )}
                  >
                    {/* Account Switcher */}
                    <AccountSwitcher isCollapsed />
                  </div>
                  <Separator />
                  {/* Sidebar */}
                  <Sidebar isCollapsed={isCollapsed} />
                  <div className="flex-1"></div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                {!isSearching ? (
                  <Tabs
                    defaultValue="all"
                    value={unreadTab}
                    onValueChange={(tab) => {
                      console.log(tab);
                      if (tab === "all") {
                        setUnreadTab("all");
                      } else {
                        setUnreadTab("unread");
                      }
                    }}
                  >
                    <div className="flex items-center px-4 py-2">
                      <h1 className="text-xl font-bold capitalize">{tab}</h1>
                      {!(tab === "drafts") && (
                        <TabsList className="ml-auto">
                          <TabsTrigger
                            value="all"
                            className="text-zinc-600 dark:text-zinc-200"
                          >
                            All mail
                          </TabsTrigger>
                          <TabsTrigger
                            value="unread"
                            className="text-zinc-600 dark:text-zinc-200"
                          >
                            Unread
                          </TabsTrigger>
                        </TabsList>
                      )}
                    </div>
                    <Separator />
                    {/* search bar */}
                    <SearchBar />
                    <TabsContent value="all">
                      <ThreadList />
                    </TabsContent>
                    <TabsContent value="unread">
                      <ThreadList />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <>
                    <SearchBar />

                    <SearchDisplay />
                  </>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </>
        ) : (
          <>
            {openMail == "new" ? (
              <ComposeEmail />
            ) : tab === "drafts" ? (
              <DraftDisplay />
            ) : (
              <ThreadDisplay />
            )}
          </>
        )}
      </TooltipProvider>
    );
  };

  return (
    <>
      {isDesktop ? (
        <TooltipProvider delayDuration={0}>
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes: number[]) => {
              document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                sizes,
              )}`;
            }}
            className="h-full min-h-screen items-stretch"
          >
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              collapsedSize={navCollapsedSize}
              collapsible={true}
              minSize={15}
              maxSize={40}
              onResize={() => {
                setIsCollapsed(false);
                document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                  false,
                )}`;
              }}
              onCollapse={() => {
                setIsCollapsed(true);
                document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                  true,
                )}`;
              }}
              className={cn(
                isCollapsed &&
                  "min-w-[60px] transition-all duration-300 ease-in-out",
              )}
            >
              <div className="flex h-full flex-1 flex-col">
                <div
                  className={cn(
                    "flex h-[52px] items-center justify-center",
                    isCollapsed ? "h-[52px]" : "px-2",
                  )}
                >
                  {/* Account Switcher */}
                  <AccountSwitcher isCollapsed />
                  <LinkAccountButton />
                </div>
                <Separator />
                {/* Sidebar */}
                <Sidebar isCollapsed={isCollapsed} />
                <div className="flex-1"></div>
                <div className="mb-14 p-4">
                  <PremiumBanner />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
              <Tabs
                defaultValue="all"
                value={unreadTab}
                onValueChange={(tab) => {
                  console.log(tab);
                  if (tab === "all") {
                    setUnreadTab("all");
                  } else {
                    setUnreadTab("unread");
                  }
                }}
              >
                <div className="flex items-center px-4 py-2">
                  <h1 className="text-xl font-bold capitalize">{tab}</h1>
                  {!(tab === "drafts") && (
                    <TabsList className="ml-auto">
                      <TabsTrigger
                        value="all"
                        className="text-zinc-600 dark:text-zinc-200"
                      >
                        All mail
                      </TabsTrigger>
                      <TabsTrigger
                        value="unread"
                        className="text-zinc-600 dark:text-zinc-200"
                      >
                        Unread
                      </TabsTrigger>
                    </TabsList>
                  )}
                </div>
                <Separator />
                {/* search bar */}
                <SearchBar />
                <TabsContent value="all">
                  <ThreadList />
                </TabsContent>
                <TabsContent value="unread">
                  <ThreadList />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
              {openMail == "new" ? (
                <ComposeEmail />
              ) : tab === "drafts" ? (
                <DraftDisplay />
              ) : (
                <ThreadDisplay />
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>
      ) : (
        <MobileDisplay />
      )}
    </>
  );
};

export default Mail;
