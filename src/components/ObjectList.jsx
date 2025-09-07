import PropTypes from "prop-types";
import { memo, useState, forwardRef } from "react";
import { FixedSizeList as List } from "react-window";

import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";

import { Input } from "@/components/ui/input";
import logger from "@/utils/logger";

function ObjectList({
  objects = [],
  loading = false,
  error = null,
  onItemClick = () => {},
}) {
  const [filter, setFilter] = useState("");

  if (loading) return <Spinner />;

  if (error) {
    logger.error("ObjectList error:", error);
    return <ErrorMessage error={error} />;
  }

  const filtered = objects.filter((o) =>
    o.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const Outer = forwardRef((props, ref) => <ul ref={ref} {...props} />);

  return (
    <div>
      <Input
        aria-label="Поиск"
        placeholder="Поиск"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p>Нет объектов</p>
      ) : (
        <List
          height={Math.min(filtered.length * 50, 400)}
          itemCount={filtered.length}
          itemSize={50}
          width="100%"
          itemKey={(index) => filtered[index].id}
          outerElementType={Outer}
        >
          {({ index, style }) => {
            const o = filtered[index];
            return (
              <li style={style}>
                <button onClick={() => onItemClick(o)}>{o.name}</button>
              </li>
            );
          }}
        </List>
      )}
    </div>
  );
}

ObjectList.propTypes = {
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onItemClick: PropTypes.func,
};

export default memo(ObjectList);
