import PropTypes from "prop-types";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import { VariableSizeList as List } from "react-window";

import TaskCard from "./TaskCard";

function VirtualizedTaskList({
  tasks,
  onView,
  onEdit,
  onDelete,
  height = 400,
  itemSize = 120,
}) {
  const listRef = useRef(null);
  const sizeMapRef = useRef({});
  const defaultSizeRef = useRef(itemSize);

  const setSize = useCallback((index, size) => {
    const prev = sizeMapRef.current[index];
    if (prev !== size && Number.isFinite(size) && size > 0) {
      sizeMapRef.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  }, []);

  const getSize = useCallback(
    (index) => sizeMapRef.current[index] || defaultSizeRef.current,
    [],
  );

  useEffect(() => {
    // tasks changed: clear cached sizes
    sizeMapRef.current = {};
    listRef.current?.resetAfterIndex(0, true);
  }, [tasks]);

  const Row = ({ index, style }) => {
    const task = tasks[index];
    const measureRef = useCallback(
      (node) => {
        if (node) {
          const rect = node.getBoundingClientRect();
          const h = Math.ceil(rect.height);
          setSize(index, h);
        }
      },
      [index],
    );
    // Use provided style (top/left/width/height) from react-window; height will be updated after measure
    return (
      <div style={style}>
        <div ref={measureRef}>
          <TaskCard
            item={task}
            onView={() => onView(task)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
          />
        </div>
      </div>
    );
  };

  const Outer = forwardRef((props, ref) => (
    <div data-testid="task-list" ref={ref} {...props} />
  ));

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={tasks.length}
      itemSize={getSize}
      width="100%"
      itemKey={(index) => tasks[index].id}
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
