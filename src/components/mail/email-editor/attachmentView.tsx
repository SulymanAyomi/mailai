import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { XCircleIcon, PaperclipIcon } from "lucide-react";

export default function AttachmentView({
  node,
  updateAttributes,
  editor,
}: NodeViewProps) {
  const { id, name, url, status } = node.attrs;

  return (
    <NodeViewWrapper className="inline-flex items-center space-x-2">
      <PaperclipIcon className="h-4 w-4" />
      <span>{name}</span>
      {status === "uploading" && (
        <span className="animate-pulse">Uploading…</span>
      )}
      {status === "error" && (
        <button onClick={() => editor.commands.deleteNode(id)}>
          <XCircleIcon className="h-4 w-4 text-red-500" />
        </button>
      )}
    </NodeViewWrapper>
  );
}
