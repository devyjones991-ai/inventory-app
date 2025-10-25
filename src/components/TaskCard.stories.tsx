import { Task } from "../types";

import TaskCard from "./TaskCard";

export default {
  title: "Components/TaskCard",
  component: TaskCard,
};

const sampleItem: Task = {
  id: "1",
  title: "Пример задачи",
  status: "pending",
  priority: "medium",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  object_id: "1",
  user_id: "1",
  assignee: "Иван",
  due_date: "2024-12-31",
};

const Template = (props: Record<string, unknown>) => <TaskCard {...props} />;

export const Mobile = {
  render: (args: Record<string, unknown>) => (
    <div className="w-80">
      <TaskCard {...args} />
    </div>
  ),
  args: {
    item: sampleItem,
    onEdit: () => console.log("Edit clicked"),
    onDelete: () => console.log("Delete clicked"),
    onView: () => console.log("View clicked"),
    canManage: true,
  },
};

export const Desktop = {
  render: (args: Record<string, unknown>) => (
    <div className="w-96">
      <TaskCard {...args} />
    </div>
  ),
  args: {
    item: sampleItem,
    onEdit: () => console.log("Edit clicked"),
    onDelete: () => console.log("Delete clicked"),
    onView: () => console.log("View clicked"),
    canManage: true,
  },
};
