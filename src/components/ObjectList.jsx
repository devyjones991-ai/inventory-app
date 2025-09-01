import { memo, useState } from "react";
import PropTypes from "prop-types";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
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
        <ul>
          {filtered.map((o) => (
            <li key={o.id}>
              <button onClick={() => onItemClick(o)}>{o.name}</button>
            </li>
          ))}
        </ul>
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
