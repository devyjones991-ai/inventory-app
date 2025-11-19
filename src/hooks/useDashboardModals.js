import { useState } from "react";

export function useDashboardModals() {
  const [isObjectModalOpen, setIsObjectModalOpen] = useState(false);
  const [objectName, setObjectName] = useState("");
  const [editingObject, setEditingObject] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const openAddModal = () => {
    console.log("openAddModal called");
    setEditingObject(null);
    setObjectName("");
    setIsObjectModalOpen(true);
    console.log("isObjectModalOpen should be true now");
  };

  const openEditModal = (obj) => {
    setEditingObject(obj);
    setObjectName(obj.name);
    setIsObjectModalOpen(true);
  };

  const closeObjectModal = () => setIsObjectModalOpen(false);

  return {
    isObjectModalOpen,
    objectName,
    setObjectName,
    editingObject,
    deleteCandidate,
    setDeleteCandidate,
    isAccountModalOpen,
    setIsAccountModalOpen,
    openAddModal,
    openEditModal,
    closeObjectModal,
  };
}
