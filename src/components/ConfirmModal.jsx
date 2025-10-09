import PropTypes from "prop-types";
import React, { useState } from "react";

import SignatureModal from "./SignatureModal";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ConfirmModal({
  open = false,
  title = "",
  message = "",
  confirmLabel = "OK",
  cancelLabel = "Отмена",
  confirmVariant = "destructive",
  requireSignature = false,
  signaturePayload = null,
  signatureTitle,
  signatureDescription,
  signatureConfirmLabel,
  onConfirm,
  onCancel,
}) {
  const [signatureOpen, setSignatureOpen] = useState(false);

  if (!open && !signatureOpen) return null;

  const handleConfirmClick = () => {
    if (requireSignature) {
      setSignatureOpen(true);
      return;
    }
    onConfirm();
  };

  const handleSignatureSuccess = (signatureResult) => {
    setSignatureOpen(false);
    onConfirm(signatureResult);
  };

  return (
    <>
      {open && (
        <Dialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              onCancel();
            }
          }}
        >
          <DialogContent>
            {title && (
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
            )}
            {message && <p>{message}</p>}
            <DialogFooter>
              <Button
                autoFocus
                variant={confirmVariant}
                onClick={handleConfirmClick}
              >
                {confirmLabel}
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                {cancelLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <SignatureModal
        open={signatureOpen}
        payload={signaturePayload}
        title={signatureTitle}
        description={signatureDescription}
        confirmLabel={signatureConfirmLabel}
        onSuccess={handleSignatureSuccess}
        onCancel={() => setSignatureOpen(false)}
      />
    </>
  );
}

ConfirmModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmLabel: PropTypes.node,
  cancelLabel: PropTypes.node,
  confirmVariant: PropTypes.string,
  requireSignature: PropTypes.bool,
  signaturePayload: PropTypes.any,
  signatureTitle: PropTypes.string,
  signatureDescription: PropTypes.string,
  signatureConfirmLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
