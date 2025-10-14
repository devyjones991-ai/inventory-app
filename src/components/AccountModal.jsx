import PropTypes from "prop-types";
import React from "react";

import ProfileSettings from "@/components/ProfileSettings";

export default function AccountModal({
  user: _user,
  onClose,
  onUpdated: _onUpdated,
}) {
  return <ProfileSettings isOpen={true} onClose={onClose} />;
}

AccountModal.propTypes = {
  user: PropTypes.shape({
    user_metadata: PropTypes.shape({
      username: PropTypes.string,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
};
