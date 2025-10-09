import { useCallback, useEffect, useMemo, useState } from "react";

import { apiBaseUrl, isApiConfigured } from "@/apiConfig";
import { supabase } from "@/supabaseClient";
import logger from "@/utils/logger";

const EMPTY_PERMISSIONS = {
  can_manage_object: false,
  can_view_tasks: false,
  can_edit_tasks: false,
  can_view_hardware: false,
  can_manage_hardware: false,
  can_view_chat: false,
  can_manage_chat: false,
  can_manage_finances: false,
  can_manage_roles: false,
};

async function getSessionToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function useObjectMembers(objectId) {
  const [members, setMembers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!objectId) {
      setMembers([]);
      setAvailableRoles([]);
      setPermissions(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [membersResult, rolesResult] = await Promise.all([
        supabase
          .from("object_members")
          .select("user_id, role, inserted_at, profiles(full_name, avatar_url)")
          .eq("object_id", objectId)
          .order("inserted_at", { ascending: true }),
        supabase
          .from("object_roles")
          .select(
            "role, can_manage_object, can_view_tasks, can_edit_tasks, can_view_hardware, can_manage_hardware, can_view_chat, can_manage_chat, can_manage_finances, can_manage_roles",
          )
          .eq("object_id", objectId)
          .order("role", { ascending: true }),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (rolesResult.error) throw rolesResult.error;

      setMembers(membersResult.data ?? []);
      setAvailableRoles(rolesResult.data ?? []);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const { data: myMembership, error: membershipError } = await supabase
          .from("object_members")
          .select(
            "role, object_roles!inner(can_manage_object, can_view_tasks, can_edit_tasks, can_view_hardware, can_manage_hardware, can_view_chat, can_manage_chat, can_manage_finances, can_manage_roles)",
          )
          .eq("object_id", objectId)
          .eq("user_id", userId)
          .maybeSingle();
        if (membershipError) throw membershipError;
        if (myMembership?.object_roles) {
          setPermissions({
            role: myMembership.role,
            ...myMembership.object_roles,
          });
        } else {
          setPermissions(null);
        }
      } else {
        setPermissions(null);
      }
    } catch (err) {
      logger.error("Failed to load object members", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    load();
  }, [load]);

  const canManageRoles = Boolean(permissions?.can_manage_roles);

  const callManageRole = useCallback(
    async ({ memberId, role, action }) => {
      if (!objectId) {
        throw new Error("Object not selected");
      }
      if (!isApiConfigured) {
        throw new Error("API не настроено для управления доступами");
      }
      const token = await getSessionToken();
      if (!token) {
        throw new Error("Нет активной сессии");
      }
      const res = await fetch(`${apiBaseUrl}/functions/v1/access/manage-role`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectId, memberId, role, action }),
      });
      if (!res.ok) {
        let message = await res.text();
        try {
          const body = JSON.parse(message);
          message = body.error || message;
        } catch {
          // ignore parse error and use raw text
        }
        throw new Error(message || "Не удалось обновить доступ");
      }
      await load();
      return true;
    },
    [objectId, load],
  );

  const assignRole = useCallback(
    async (memberId, role) => {
      await callManageRole({ memberId, role, action: "assign" });
    },
    [callManageRole],
  );

  const removeMember = useCallback(
    async (memberId) => {
      await callManageRole({ memberId, action: "remove" });
    },
    [callManageRole],
  );

  const permissionsWithFallback = useMemo(() => {
    if (!permissions) return null;
    return {
      role: permissions.role,
      ...EMPTY_PERMISSIONS,
      ...permissions,
    };
  }, [permissions]);

  return {
    members,
    availableRoles,
    permissions: permissionsWithFallback,
    canManageRoles,
    loading,
    error,
    reload: load,
    assignRole,
    removeMember,
  };
}
