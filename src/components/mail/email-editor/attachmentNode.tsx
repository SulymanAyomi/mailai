import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import AttachmentView from "./attachmentView";

export default Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      id: { default: null },
      name: { default: "" },
      url: { default: null },
      status: { default: "uploading" },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="attachment"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "attachment" }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(AttachmentView);
  },
});
