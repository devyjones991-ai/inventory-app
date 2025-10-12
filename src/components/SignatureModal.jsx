import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { supabase } from "@/supabaseClient";

function normalizePayload(payload) {
  if (!payload) return null;
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return null;
  }
}

export default function SignatureModal({
  open,
  title,
  description,
  payload,
  confirmLabel,
  onSuccess,
  onCancel,
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const serializedPayload = useMemo(() => normalizePayload(payload), [payload]);

  useEffect(() => {
    if (!open) {
      setCode("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t("signature.modal.codeRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "signature",
        {
          body: {
            action: "verify",
            code: trimmed,
            payload: serializedPayload,
          },
        },
      );
      if (fnError) {
        throw fnError;
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      if (!data?.signatureHash) {
        throw new Error(t("signature.modal.invalidResponse"));
      }
      onSuccess?.({
        signedBy: data.signedBy,
        signedAt: data.signedAt,
        signatureHash: data.signatureHash,
      });
    } catch (err) {
      const message = err?.message || t("signature.modal.error");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel?.();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title || t("signature.modal.title")}</DialogTitle>
            <DialogDescription>
              {description || t("signature.modal.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t("signature.modal.placeholder")}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading
                ? t("signature.modal.loading")
                : confirmLabel || t("signature.modal.submit")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

SignatureModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  payload: PropTypes.any,
  confirmLabel: PropTypes.string,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

SignatureModal.defaultProps = {
  open: false,
  title: "",
  description: "",
  payload: null,
  confirmLabel: "",
  onSuccess: undefined,
  onCancel: undefined,
};
