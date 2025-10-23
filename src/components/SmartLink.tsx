import React from "react";

import { createLinkProps, isUrl } from "../utils/linkUtils";
import { LinkOptions } from "../utils/linkUtils";

interface SmartLinkProps extends LinkOptions {
  url: string;
  children?: React.ReactNode;
}

export default function SmartLink({
  url,
  children,
  maxLength,
  showFullOnHover,
  showIcon,
  className,
  context,
}: SmartLinkProps) {
  if (!isUrl(url)) {
    return <span className={className}>{url}</span>;
  }

  const linkProps = createLinkProps(url, {
    maxLength,
    showFullOnHover,
    showIcon,
    className,
    context,
  });

  return (
    <a
      href={linkProps.href}
      target={linkProps.target}
      rel={linkProps.rel}
      title={linkProps.title}
      className={linkProps.className}
    >
      {children || linkProps.displayText}
      {linkProps.showIcon && <span className="ml-1 text-xs">🔗</span>}
    </a>
  );
}
