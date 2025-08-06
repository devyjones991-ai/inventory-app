import React, { useState } from 'react';

export default function AttachmentPreview({ url }) {
  const [open, setOpen] = useState(false);

  const extension = url
    .split('?')[0]
    .split('#')[0]
    .split('.')
    .pop()
    .toLowerCase();
  const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExt = ['mp4', 'webm', 'ogg', 'mov'];

  const isImage = imageExt.includes(extension);
  const isVideo = videoExt.includes(extension);

  const handleOpen = () => setOpen(true);
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
        />
        {open && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            data-testid="image-modal"
          >
            <div className="relative">
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 bg-white px-2 py-1 rounded"
              >
                Закрыть
              </button>
              <img src={url} alt="full" className="max-h-screen" />
            </div>
          </div>
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
          onClick={handleOpen}
          data-testid="attachment-video"
        />
        {open && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            data-testid="video-modal"
          >
            <div className="relative">
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 bg-white px-2 py-1 rounded"
              >
                Закрыть
              </button>
              <video src={url} controls autoPlay className="max-h-screen" />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
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
  );
}

