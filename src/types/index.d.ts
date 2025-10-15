// Основные типы для приложения

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string;
  assigned_at?: string;
  created_at: string;
  updated_at: string;
  object_id: string;
  user_id: string;
  assigned_to?: string;
  assignee?: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  progress?: number;
  notes?: string;
  attachments?: string[];
  created_by?: string;
  updated_by?: string;
}

export interface Object {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: "active" | "inactive" | "maintenance" | "retired";
  location?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  parent_id?: string;
  children?: Object[];
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
  role?: "admin" | "user" | "moderator";
  is_active?: boolean;
  last_login?: string;
  preferences?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  object_id: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  reply_to?: string;
  edited_at?: string;
  deleted_at?: string;
  client_generated_id?: string;
  _optimistic?: boolean;
}

export interface Notification {
  id: string;
  type: "overdue_task" | "new_message" | "task_assigned" | "system";
  title: string;
  message: string;
  user_id: string;
  object_id?: string;
  task_id?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  backup_email?: string;
  phone?: string;
  avatar_url?: string;
  role: "admin" | "user" | "moderator";
  preferences: {
    theme: "light" | "dark" | "auto";
    language: "ru" | "en";
    notifications: {
      email: boolean;
      push: boolean;
      overdue_tasks: boolean;
      new_messages: boolean;
      task_assignments: boolean;
    };
    timezone: string;
    date_format: string;
    time_format: "12h" | "24h";
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface Hardware {
  id: string;
  name: string;
  type: string;
  model?: string;
  serial_number?: string;
  status: "active" | "inactive" | "maintenance" | "retired";
  location?: string;
  assigned_to?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  cost?: number;
  vendor?: string;
  specifications?: Record<string, unknown>;
  notes?: string;
  created_at: string;
  updated_at: string;
  object_id: string;
  user_id: string;
}

// Типы для форм
export interface LoginForm {
  email: string;
  password: string;
  username?: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
}

export interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export interface ProfileForm {
  fullName: string;
  email: string;
  backupEmail?: string;
  phone?: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Типы для API ответов
export interface ApiResponse<T = unknown> {
  data: T;
  error: Error | null;
  success: boolean;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Типы для хуков
export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export interface UseObjectsReturn {
  objects: Object[];
  loading: boolean;
  error: string | null;
  createObject: (object: Partial<Object>) => Promise<void>;
  updateObject: (id: string, updates: Partial<Object>) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;
  refreshObjects: () => Promise<void>;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, file?: File) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
  markAsRead: (messageId: string) => Promise<void>;
}

// Типы для компонентов
export interface ButtonProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "info";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
  "aria-haspopup"?: string;
  "aria-expanded"?: boolean;
}

export interface InputProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  name?: string;
  id?: string;
  "aria-describedby"?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  draggable?: boolean;
}

export interface DialogContentProps extends DialogProps {
  "data-dialog-handle"?: boolean;
}

export interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
  "data-dialog-handle"?: boolean;
}

export interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

// Типы для утилит
export type LogLevel = "info" | "warn" | "error";

export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  setLevel: (level: LogLevel) => void;
}

// Типы для контекстов
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}
