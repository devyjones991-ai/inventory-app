export interface Notification {
  id: string;
  type: "overdue_task" | "new_message" | "task_assigned" | "system";
  title: string;
  message: string;
  user_id: string;
  object_id?: string;
  created_at: string;
  read?: boolean;
  _optimistic?: boolean;
}
