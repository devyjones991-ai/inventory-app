import React from 'react';

export function linkifyText(text = '') {
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let index = 0;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;
    if (start > lastIndex) {
      const nonUrl = text.slice(lastIndex, start);
      parts.push(<React.Fragment key={`text-${index}`}>{nonUrl}</React.Fragment>);
      index++;
    }
    let href = url;
    if (!/^https?:\/\//.test(href)) {
      href = 'http://' + href;
    }
    parts.push(
      <a
        key={`link-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
      >
        {url}
      </a>
    );
    index++;
    lastIndex = start + url.length;
  }
  if (lastIndex < text.length) {
    parts.push(<React.Fragment key={`text-${index}`}>{text.slice(lastIndex)}</React.Fragment>);
  }
  return parts;
}
