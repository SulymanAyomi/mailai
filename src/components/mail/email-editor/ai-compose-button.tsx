"use client";
import TurndownService from "turndown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import React from "react";
import { generateEmail } from "./action";
import { readStreamableValue } from "ai/rsc";
import { Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useThreads from "../use-threads";
import { turndown } from "@/lib/turndown";
import { atom, useAtom } from "jotai";

type Props = {
  onGenerate: (value: string) => void;
  isComposing?: boolean;
};

export const isAIComposeOpenAtom = atom(false);

const AIComposeButton = (props: Props) => {
  const [prompt, setPrompt] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isAIComposeOpen, setIsAIComposeOpenAtom] =
    useAtom(isAIComposeOpenAtom);
  const { account, threads, threadId } = useThreads();
  const thread = threads?.find((t) => t.id === threadId);
  const aiGenerate = async (prompt: string) => {
    let context: string | undefined = "";
    if (!props.isComposing) {
      context = thread?.emails
        .map(
          (m) =>
            `Subject: ${m.subject}\nFrom: ${m.from.email}\n\n${turndown.turndown(m.body ?? m.bodySnippet ?? "")}`,
        )
        .join("\n");
    }

    const { output } = await generateEmail(
      context + `\n\nMy name is: ${account?.name}`,
      prompt,
    );

    for await (const delta of readStreamableValue(output)) {
      console.log(delta);
      if (delta) {
        props.onGenerate(delta);
        console.log("yes i have");
      }
      console.log("nooooo i have");
    }
  };
  return (
    <Dialog open={isAIComposeOpen} onOpenChange={setIsAIComposeOpenAtom}>
      <DialogTrigger>
        <Button
          asChild
          onClick={() => setIsAIComposeOpenAtom(true)}
          size="icon"
          variant={"outline"}
        >
          <Bot className="size-1" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Compose</DialogTitle>
          <DialogDescription>
            AI will compose an email based on the context of your previous
            emails.
          </DialogDescription>
          <div className="h-2"></div>
          <Textarea
            placeholder="What would you like to compose?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="h-2"></div>
          <Button
            onClick={() => {
              aiGenerate(prompt);
              setOpen(false);
              setPrompt("");
            }}
          >
            Generate
          </Button>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AIComposeButton;
