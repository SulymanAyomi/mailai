import React from "react";
import dynamic from "next/dynamic";
import { LinkAccountButton } from "@/components/link-account-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/server/auth";
import ComposeButton from "@/components/mail/compose-button";
import ChatAIButton from "@/components/mail/chat-ai";
import { Toaster } from "sonner";
// import Mail from "../components/mail/mail";
const Mail = dynamic(
  () => {
    return import("@/components/mail/mail");
  },
  {
    // ssr: false,
  },
);
export default async function Home() {
  const session = await auth();
  console.log(session, "session");

  if (!session) return <> no session</>;

  return (
    <div className="relative h-screen">
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center gap-2">
          {/* <UserButton/> */}
          <ThemeToggle />
          <ComposeButton />
          <ChatAIButton />
        </div>
      </div>
      <Toaster richColors position="top-right" />
      <Mail
        defaultLayout={[20, 32, 48]}
        navCollapsedSize={4}
        defaultCollapsed={false}
      />
    </div>
  );
}
