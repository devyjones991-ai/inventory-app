import PropTypes from "prop-types";
import React, { useState } from "react";

import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";

export default function AttachmentPreview({ url, onImageClick = null }) {
  const [open, setOpen] = useState(false);

  const cleanUrl = url?.split("?")[0].split("#")[0] || "";
  const extension = cleanUrl.split(".").pop().toLowerCase();

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
          alt="attachment"
          className="max-w-full cursor-pointer"
          onClick={handleOpen}
          data-testid="attachment-image"
          loading="lazy"
          decoding="async"
        />
        {!onImageClick && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent data-testid="image-modal">
              <img
                src={url}
                alt="full"
                className="max-h-screen"
                loading="lazy"
                decoding="async"
              />
              <DialogFooter>
                <button onClick={handleClose}>Закрыть</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  if (isVideo) {
    return (
      <>
        <video
          src={url}
          controls
          className="max-w-full cursor-pointer"
          onClick={() => setOpen(true)}
          data-testid="attachment-video"
          preload="metadata"
          playsInline
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent data-testid="video-modal">
            <video src={url} controls autoPlay className="max-h-screen" />
            <DialogFooter>
              <button onClick={handleClose}>Закрыть</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline block"
        data-testid="attachment-link"
      >
        📎 Прикреплённый файл
      </a>

      <div className="mt-1 space-x-2">
        <a href={url} download className="text-blue-500 underline">
          Скачать
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          Открыть
        </a>
      </div>
    </>
  );
}

AttachmentPreview.propTypes = {
  url: PropTypes.string.isRequired,
  onImageClick: PropTypes.func,
};
