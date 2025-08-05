export function linkifyText(text = '') {
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
  return text.replace(urlRegex, url => {
    let href = url;
    if (!href.match(/^https?:\/\//)) {
      href = 'http://' + href;
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">${url}</a>`;
  });
}
