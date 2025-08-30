import { FixedSizeList as List } from "react-window";
import PropTypes from "prop-types";
import { forwardRef } from "react";
import TaskCard from "./TaskCard";

function VirtualizedTaskList({
  tasks,
  onView,
  onEdit,
  onDelete,
  height = 400,
  itemSize = 120,
}) {
  const Row = ({ index, style }) => {
    const task = tasks[index];
    return (
      <div style={style}>
        <TaskCard
          item={task}
          onView={() => onView(task)}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task.id)}
        />
      </div>
    );
  };

  const Outer = forwardRef((props, ref) => (
    <div data-testid="task-list" ref={ref} {...props} />
  ));

  return (
    <List
      height={height}
      itemCount={tasks.length}
      itemSize={itemSize}
      width="100%"
      outerElementType={Outer}
    >
      {Row}
    </List>
  );
}

VirtualizedTaskList.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  height: PropTypes.number,
  itemSize: PropTypes.number,
};

export default VirtualizedTaskList;
