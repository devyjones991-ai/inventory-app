import { useState } from "react";

export function useDashboardModals() {
  const [isObjectModalOpen, setIsObjectModalOpen] = useState(false);
  const [objectName, setObjectName] = useState("");
  const [editingObject, setEditingObject] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const openAddModal = () => {
    setEditingObject(null);
    setObjectName("");
    setIsObjectModalOpen(true);
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
