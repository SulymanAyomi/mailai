import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBreakpoint } from "@/lib/useBreakPoint";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import { useSetAtom } from "jotai";
import {
  Bold,
  Code,
  CodepenIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
  File,
  Table,
  Image,
  Link,
  Laugh,
  Rows3,
  PaperclipIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { addFileAtom } from "./attachments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
} from "@radix-ui/react-dropdown-menu";

const TipTapMenuBar = ({ editor }: { editor: Editor }) => {
  const [editorMenu, setEditorMenu] = useLocalStorage("editorMenu", "");
  const [accountId] = useLocalStorage("accountId", "");
  const [showTableMenu, setShowTableMenu] = useState(false);
  const { isDesktop, isMobile } = useBreakpoint();
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const addFile = useSetAtom(addFileAtom);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => addFile(file, accountId));
  }

  const DesktopMenu = () => {
    return (
      <>
        {editorMenu == "format" && (
          <div className="flex flex-1 flex-wrap">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("bold") ? "is-active" : "",
              )}
            >
              <Bold className="size-5 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("italic") ? "is-active" : "",
              )}
            >
              <Italic className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("strike") ? "is-active" : "",
              )}
            >
              <Strikethrough className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("code") ? "is-active" : "",
              )}
            >
              <Code className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 1 }) ? "is-active" : "",
              )}
            >
              <Heading1 className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 2 }) ? "is-active" : "",
              )}
            >
              <Heading2 className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 3 }) ? "is-active" : "",
              )}
            >
              <Heading3 className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 4 }) ? "is-active" : "",
              )}
            >
              <Heading4 className="size-4 text-secondary-foreground" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("bulletList") ? "is-active" : "",
              )}
            >
              <List className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("orderedList") ? "is-active" : "",
              )}
            >
              <ListOrdered className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("blockquote") ? "is-active" : "",
              )}
            >
              <Quote className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="p-4 py-2"
            >
              <Undo className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="p-4 py-2"
            >
              <Redo className="size-4 text-secondary-foreground" />
            </button>
          </div>
        )}
        {editorMenu == "insert" && (
          <div className="flex flex-wrap justify-between gap-0">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <PaperclipIcon className="size-5 text-secondary-foreground" />
              <span>Files</span>
              <input
                className="hidden"
                type="file"
                accept=".pdf,.doc, .docx, .txt"
                ref={fileRef}
                // disabled={isPending}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </button>
            <button
              onClick={() => console.log(editorMenu)}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <Table className="size-5 text-secondary-foreground" />
              <span>Table</span>
            </button>
            <button
              onClick={() => imgRef.current?.click()}
              className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <Image className="size-5 text-secondary-foreground" />
              <span>Pictures</span>
              <input
                className="hidden"
                type="file"
                accept=".jpg, .png, .jpeg, .svg"
                ref={imgRef}
                // disabled={isPending}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </button>
            <button
              onClick={() => console.log(editorMenu)}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <Link className="size-5 text-secondary-foreground" />
              <span>Links</span>
            </button>
            <button
              onClick={() => console.log(editorMenu)}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <Laugh className="size-5 text-secondary-foreground" />
              <span>Emoji</span>
            </button>
          </div>
        )}
        {editorMenu == "options" && (
          <div className="flex flex-wrap justify-between gap-0">
            <button className="flex items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground">
              <span>Compose</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground">
              <span>Summarise</span>
            </button>
            <button className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground">
              <span>Rewrite</span>
            </button>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground">
                    <span>Change</span>
                    <ChevronDown className="ml-auto size-5 text-secondary-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <div className="cursor-default px-1 py-2 hover:bg-secondary">
                        Make shorter
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="cursor-default px-1 py-2 hover:bg-secondary">
                        Make longer
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <div className="flex flex-1 cursor-default items-center justify-between px-1 py-2 hover:bg-secondary">
                          <span>Change tone</span>
                          <ChevronRight className="ml-auto size-5 text-secondary-foreground" />
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem>
                            <div className="cursor-default px-1 py-2 hover:bg-secondary">
                              Formal
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <div className="cursor-default px-1 py-2 hover:bg-secondary">
                              Casual
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <div className="cursor-default px-1 py-2 hover:bg-secondary">
                              Humour
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        {editorMenu == "table" && (
          <div className="flex flex-wrap justify-between gap-0">
            <button
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <Table className="size-5 text-secondary-foreground" />
              <span>Delete</span>
            </button>
            <button
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
              }
              className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <Table className="size-5 text-secondary-foreground" />
              <span>Table</span>
            </button>
            <div
              onClick={() => setShowTableMenu(!showTableMenu)}
              className="relative flex flex-1 cursor-default flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
            >
              <Rows3 className="size-5 text-secondary-foreground" />
              <span>Insert</span>
              <div
                className={cn(
                  "absolute left-0 top-full z-[99] bg-muted transition",
                  !showTableMenu && "hidden opacity-0",
                )}
              >
                <div className="flex flex-col items-start gap-2 p-2">
                  <div className="cursor-pointer border-b py-2 font-semibold">
                    Insert
                  </div>
                  <Button
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    variant="ghost"
                    className="flex flex-row items-center justify-center hover:rounded-md hover:bg-muted-foreground"
                  >
                    <Table className="size-5 text-secondary-foreground" />
                    <span>Insert Above</span>
                  </Button>
                  <Button
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    variant="ghost"
                    className="flex flex-row items-center justify-center hover:rounded-md hover:bg-muted-foreground"
                  >
                    <Table className="size-5 text-secondary-foreground" />
                    <span>Insert Below</span>
                  </Button>
                  <Button
                    onClick={() =>
                      editor.chain().focus().addColumnBefore().run()
                    }
                    variant="ghost"
                    className="flex flex-row items-center justify-center hover:rounded-md hover:bg-muted-foreground"
                  >
                    <Table className="size-5 text-secondary-foreground" />
                    <span>Insert Left</span>
                  </Button>
                  <Button
                    onClick={() =>
                      editor.chain().focus().addColumnAfter().run()
                    }
                    variant="ghost"
                    className="flex flex-row items-center justify-center hover:rounded-md hover:bg-muted-foreground"
                  >
                    <Table className="size-5 text-secondary-foreground" />
                    <span>Insert Right</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const MobileMenu = () => {
    return (
      <>
        {
          <div className="flex flex-1 flex-wrap">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("bold") ? "is-active" : "",
              )}
            >
              <Bold className="size-5 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("italic") ? "is-active" : "",
              )}
            >
              <Italic className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("strike") ? "is-active" : "",
              )}
            >
              <Strikethrough className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("code") ? "is-active" : "",
              )}
            >
              <Code className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 1 }) ? "is-active" : "",
              )}
            >
              <Heading1 className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 2 }) ? "is-active" : "",
              )}
            >
              <Heading2 className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 3 }) ? "is-active" : "",
              )}
            >
              <Heading3 className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
              className={cn(
                "p-4 py-2",
                editor.isActive("heading", { level: 4 }) ? "is-active" : "",
              )}
            >
              <Heading4 className="size-4 text-secondary-foreground" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("bulletList") ? "is-active" : "",
              )}
            >
              <List className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("orderedList") ? "is-active" : "",
              )}
            >
              <ListOrdered className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                "p-4 py-2",
                editor.isActive("blockquote") ? "is-active" : "",
              )}
            >
              <Quote className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="p-4 py-2"
            >
              <Undo className="size-4 text-secondary-foreground" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="p-4 py-2"
            >
              <Redo className="size-4 text-secondary-foreground" />
            </button>
          </div>
        }
      </>
    );
  };
  return <>{isMobile ? <MobileMenu /> : <DesktopMenu />}</>;
};

export default TipTapMenuBar;
