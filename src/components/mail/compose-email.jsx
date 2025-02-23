"use client";
import { Trash2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";

import EmailEditor from "./email-editor";
import { useState } from "react";
import { atom, useAtom } from "jotai";
import { useLocalStorage } from "usehooks-ts";
import { cn } from "@/lib/utils";

export function ComposeEmail() {
  const [toValues, setToValues] = useState([]);
  const [ccValues, setCcValues] = useState([]);
  const [subject, setSubject] = useState("subject");
  const [editorMenu, setEditorMenu] = useLocalStorage("editorMenu", "");
  const menu = ["format", "insert", "options", "table"];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          {menu.map((label) => (
            <div
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
          >
            <Trash2 className="h-4 w-4" />
            <span>Discard</span>
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="flex items-center gap-1"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </Button>
        </div>
      </div>
      <Separator />

      <EmailEditor
        toValues={[]}
        ccValues={[]}
        onToChange={(values) => {
          setToValues(values);
        }}
        onCcChange={(values) => {
          setCcValues(values);
        }}
        subject={subject}
        setSubject={setSubject}
        to={[]}
        handleSend={() => {}}
        isSending={false}
      />
    </div>
  );
}
