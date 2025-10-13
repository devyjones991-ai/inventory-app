import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createFocusTrap } from "focus-trap";
import PropTypes from "prop-types";
import * as React from "react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(function DialogOverlay(
  { className, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/30 dark:bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef(function DialogContent(
  { className, children, draggable = false, ...props },
  ref,
) {
  const contentRef = React.useRef(null);
  const trapRef = React.useRef(null);
  const previousRef = React.useRef(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const dragStart = React.useRef(null);

  React.useImperativeHandle(ref, () => contentRef.current);

  React.useEffect(() => {
    if (!contentRef.current) return undefined;
    trapRef.current = createFocusTrap(contentRef.current, {
      fallbackFocus: contentRef.current,
    });
    trapRef.current.activate();
    return () => {
      trapRef.current?.deactivate({ returnFocus: false });
      previousRef.current?.focus?.();
    };
  }, []);

  const isPointerFine =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(pointer: fine)").matches;

  const handleMouseDown = (e) => {
    if (!draggable || !isPointerFine) return;
    if (!e.target.closest("[data-dialog-handle]")) return;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragStart.current) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    dragStart.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const transform =
    draggable && isPointerFine
      ? `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`
      : undefined;

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        onOpenAutoFocus={(e) => {
          previousRef.current = document.activeElement;
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onMouseDown={handleMouseDown}
        style={transform ? { transform } : undefined}
        className={cn(
          "fixed bottom-0 left-1/2 z-50 grid w-full max-h-[80vh] -translate-x-1/2 gap-4 overflow-y-auto rounded-t-md bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:bottom-auto sm:top-1/2 sm:max-h-screen sm:rounded-md sm:-translate-y-1/2",
          draggable && isPointerFine && "cursor-move",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef(function DialogTitle(
  { className, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef(function DialogDescription(
  { className, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// PropTypes
DialogContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  draggable: PropTypes.bool,
};

DialogHeader.propTypes = {
  className: PropTypes.string,
};

DialogFooter.propTypes = {
  className: PropTypes.string,
};

DialogTitle.propTypes = {
  className: PropTypes.string,
};

DialogDescription.propTypes = {
  className: PropTypes.string,
};
