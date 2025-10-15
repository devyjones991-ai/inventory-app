import React from "react";

import { User } from "../types";

import ProfileSettings from "./ProfileSettings";

interface AccountModalProps {
  user: User;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AccountModal({
  user: _user,
  onClose,
  onUpdated: _onUpdated,
}: AccountModalProps) {
  return <ProfileSettings isOpen={true} onClose={onClose} />;
}
