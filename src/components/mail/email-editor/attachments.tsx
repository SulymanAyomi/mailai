import { uploadToCloudinary } from "@/lib/upload";
import { atom, useAtom, useSetAtom } from "jotai";
import { debounce } from "lodash";
import {
  CircleArrowOutDownLeftIcon,
  PaperclipIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import React, { useState } from "react";

const Attachments = () => {
  return (
    <div className="flex items-center gap-2 bg-zinc-700 p-3">
      <PaperclipIcon className="h-4 w-4" />
      <span>Resume.pdf</span>
      <button>
        <XCircleIcon className="h-4 w-4 text-red-500" />
      </button>
    </div>
  );
};

export default Attachments;
export function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: AttachmentMeta[];
  onRemove: (id: string) => void;
}) {
  const retryUpload = useSetAtom(retryUploadAtom);

  if (attachments.length < 1) return null;

  return (
    <div className="flex flex-wrap gap-2 rounded border bg-background p-2">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="flex max-w-40 items-center gap-2 rounded border p-2 shadow-sm"
        >
          <div>
            <PaperclipIcon className="h-4 w-4" />
          </div>
          <div className="overflow-hidden truncate text-sm">
            <strong>{file.name}</strong>
            <div className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <div>
            {file.status === "uploading" && (
              <span className="text-xs text-blue-500">Uploading...</span>
            )}
            {file.status === "error" && (
              <>
                <span className="text-xs text-red-500">Failed</span>
                <button onClick={() => retryUpload(file.id)}>
                  <span>
                    <CircleArrowOutDownLeftIcon className="mr-1 h-4 w-4 text-red-500" />
                  </span>
                </button>
              </>
            )}

            <button
              className="ml-auto text-xs text-red-600 hover:underline"
              onClick={() => onRemove(file.id)}
            >
              <XIcon className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string; // For Cloudinary or local preview
  base64?: string; // If you plan to use this with Nylas
  status: "uploading" | "uploaded" | "error";
  draftId?: string;
  errorMessage?: string;
  retries?: number;
  file: File;
}

// Hook to manage attachment state
export const attachmentsAtom = atom<AttachmentMeta[]>([]);

// / Write-only atom for adding a file
export const addFileAtom = atom(
  null,
  async (get, set, file: File, accountId: string) => {
    const id = crypto.randomUUID();
    const newAttachment: AttachmentMeta = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      file,
    };
    // Add placeholder
    set(attachmentsAtom, [...get(attachmentsAtom), newAttachment]);

    // Asynchronously convert to base64
    // const reader = new FileReader();
    // reader.onloadend = () => {
    //   const base64 = reader.result?.toString().split(",")[1];
    //   set(
    //     attachmentsAtom,
    //     // @ts-ignore
    //     get(attachmentsAtom).map((a) =>
    //       a.id === id
    //         ? {
    //             ...a,
    //             base64: base64 || undefined,
    //             status: base64 ? "uploaded" : "error",
    //           }
    //         : a,
    //     ),
    //   );
    // };
    // reader.readAsDataURL(file);
    const upload = await uploadToCloudinary(
      file,
      "email_attachments",
      accountId,
    );
    const index = get(attachmentsAtom).findIndex((a) => a.id === id);
    if (index === -1) return;
    console.log("abt to");
    if (upload) {
      set(attachmentsAtom, (prev) => {
        const copy = [...prev];
        // @ts-ignore
        copy[index] = {
          ...copy[index],
          status: "uploaded",
          base64: upload.base64,
          errorMessage: "",
          url: upload.fileUrl,
        };
        return copy;
      });
    } else {
      set(attachmentsAtom, (prev) => {
        const copy = [...prev];
        // @ts-ignore
        copy[index] = {
          ...copy[index],
          status: "error",
          errorMessage: "",
        };
        return copy;
      });
    }
  },
);

export const removeFileAtom = atom(null, (get, set, id) => {
  set(
    attachmentsAtom,
    get(attachmentsAtom).filter((a) => a.id !== id),
  );
});

export const draftKeyAtom = atom<string | null>(null);
export const setDraftKeyAtom = atom(null, (get, set, newKey: string) => {
  set(draftKeyAtom, newKey);
  // clear attachment whenever draft key changes
  set(attachmentsAtom, []);
});

export const loadAttachmentsAtom = atom(null, async (get, set, draftId) => {
  // 1) Clear any stale state
  set(attachmentsAtom, []);

  // 2) Call your backend (tRPC) to get the saved attachments
  const saved: AttachmentMeta[] = await fetchAttachmentsForDraft(draftId);

  // 3) Populate the atom
  set(attachmentsAtom, saved);
});

export const retryUploadAtom = atom(null, async (get, set, fileId: string) => {
  const attachments = get(attachmentsAtom);
  console.log("i rannn");
  const index = attachments.findIndex((a) => a.id === fileId);
  if (index === -1) return;

  const target = attachments[index];
  if (!target?.draftId) return;

  let attempts = 0;
  const maxAttempts = 3;
  let uploaded = false;

  while (!uploaded && attempts < maxAttempts) {
    try {
      set(attachmentsAtom, (prev) => {
        const copy = [...prev];
        // @ts-ignore
        copy[index] = {
          ...copy[index],
          status: "uploading",
          retries: attempts,
        };

        return copy;
      });

      const upload = await uploadToCloudinary(target.file);
      if (!upload) return;
      set(attachmentsAtom, (prev) => {
        const copy = [...prev];
        // @ts-ignore
        copy[index] = {
          ...copy[index],
          status: "uploaded",
          base64: upload.base64,
          errorMessage: "",
          url: upload.fileUrl,
        };
        return copy;
      });

      uploaded = true;
    } catch (e: any) {
      attempts++;
      if (attempts >= maxAttempts) {
        set(attachmentsAtom, (prev) => {
          const copy = [...prev];
          // @ts-ignore
          copy[index] = {
            ...copy[index],
            status: "error",
            errorMessage: e.message || "Upload failed",
            retries: attempts,
          };
          return copy;
        });
      } else {
        await new Promise((res) => setTimeout(res, 1000 * 2 ** attempts));
      }
    }
  }
});

export const autosaveAttachmentsAtom = atom(null, (get) => {
  const draftId = get(draftKeyAtom);
  const attachments = get(attachmentsAtom);

  if (!draftId) return;

  const toSave = attachments
    .filter((a) => a.status === "uploaded")
    .map((a) => ({
      id: a.id,
      filename: a.file.name,
      type: a.file.type,
      size: a.file.size,
      base64: a.base64,
      url: a.url,
    }));

  saveDraftAttachments(draftId, toSave);
});

const debouncedAutosave = debounce((trigger: () => void) => trigger(), 500);

export const triggerAutosaveAtom = atom(null, (get, set) => {
  debouncedAutosave(() => set(autosaveAttachmentsAtom));
});
