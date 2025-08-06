import React from 'react';

export default function AttachmentPreview({ url, onImageClick }) {
  if (!url) return null;

  const cleanUrl = url.split('?')[0];
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(cleanUrl);

  if (isImage) {
    return (
      <img
        src={url}
        alt="attachment"
        className="max-w-full mt-1 cursor-pointer"
        onClick={() => onImageClick?.(url)}
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 underline block"
    >
      📎 Прикреплённый файл
    </a>
  );
}
