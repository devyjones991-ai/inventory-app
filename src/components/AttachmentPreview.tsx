import React, { useState } from "react";

import { Dialog, DialogContent, DialogFooter } from "./ui/dialog";

interface AttachmentPreviewProps {
  url: string;
  onImageClick?: ((url: string) => void) | null;
}

export default function AttachmentPreview({
  url,
  onImageClick = null,
}: AttachmentPreviewProps) {
  const [open, setOpen] = useState(false);

  const cleanUrl = url?.split("?")[0].split("#")[0] || "";
  const extension = cleanUrl.split(".").pop()?.toLowerCase() || "";

  const imageExt = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
  const videoExt = ["mp4", "webm", "ogg", "mov"];

  const isImage = imageExt.includes(extension);
  const isVideo = videoExt.includes(extension);

  const handleOpen = () => {
    if (isImage && onImageClick) {
      onImageClick(url);
    } else {
      setOpen(true);
    }
  };

  const handleClose = () => setOpen(false);

  if (isImage) {
    return (
      <>
        <img
          src={url}
          alt="Attachment"
          className="max-w-xs max-h-32 cursor-pointer rounded border object-cover"
          onClick={handleOpen}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl">
            <img
              src={url}
              alt="Attachment preview"
              className="max-h-[80vh] w-full object-contain"
            />
            <DialogFooter className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Закрыть
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isVideo) {
    return (
      <>
        <video
          src={url}
          controls
          className="max-w-xs max-h-32 rounded border"
          onClick={handleOpen}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl">
            <video src={url} controls className="max-h-[80vh] w-full" />
            <DialogFooter className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Закрыть
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded border p-2">
      <span className="text-sm text-gray-600">
        Файл: {cleanUrl.split("/").pop()}
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700"
      >
        Открыть
      </a>
    </div>
  );
}
