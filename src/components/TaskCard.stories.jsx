import TaskCard from "./TaskCard.jsx";

export default {
  title: "Components/TaskCard",
  component: TaskCard,
};

const sampleItem = {
  title: "Пример задачи",
  status: "planned",
  assignee: "Иван",
  due_date: "2024-12-31",
  created_at: "2024-01-01",
};

const Template = (props) => <TaskCard {...props} />;

export const Mobile = {
  render: (args) => (
    <div className="w-80">
      <Template {...args} />
    </div>
  ),
  args: {
    item: sampleItem,
    onEdit: () => {},
    onDelete: () => {},
    onView: () => {},
  },
};

export const Desktop = {
  render: (args) => (
    <div className="w-[700px]">
      <Template {...args} />
    </div>
  ),
  args: {
    item: sampleItem,
    onEdit: () => {},
    onDelete: () => {},
    onView: () => {},
  },
};
