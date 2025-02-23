import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
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
} from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

const TipTapMenuBar = ({ editor }: { editor: Editor }) => {
  const [editorMenu, setEditorMenu] = useLocalStorage("editorMenu", "");
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
            onClick={() => console.log(editorMenu)}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
          >
            <File className="size-5 text-secondary-foreground" />
            <span>Files</span>
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
            onClick={() => console.log(editorMenu)}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className="flex flex-1 flex-row items-center justify-center gap-2 p-4 py-2 hover:rounded-md hover:bg-muted-foreground"
          >
            <Image className="size-5 text-secondary-foreground" />
            <span>Pictures</span>
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
    </>
  );
};

export default TipTapMenuBar;
