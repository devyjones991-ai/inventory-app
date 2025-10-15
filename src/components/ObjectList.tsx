import { memo, useState, forwardRef } from "react";
import { FixedSizeList as List } from "react-window";
import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";
import { Input } from "./ui/input";
import { t } from "../i18n";
import logger from "../utils/logger";
import { Object } from "../types";

interface ObjectListProps {
  objects?: Object[];
  loading?: boolean;
  error?: string | null;
  onItemClick?: (item: Object) => void;
}

function ObjectList({
  objects = [],
  loading = false,
  error = null,
  onItemClick = () => {},
}: ObjectListProps) {
  const [filter, setFilter] = useState("");

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const filteredObjects = objects.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  const Item = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = filteredObjects[index];
    if (!item) return null;

    return (
      <div style={style} className="px-2 py-1">
        <div
          className="cursor-pointer rounded border p-3 hover:bg-accent"
          onClick={() => onItemClick(item)}
        >
          <h3 className="font-medium">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
      </div>
    );
  });

  Item.displayName = "Item";

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("objects.search")}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full"
      />
      {filteredObjects.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {t("objects.notFound")}
        </p>
      ) : (
        <List
          height={400}
          itemCount={filteredObjects.length}
          itemSize={80}
          className="rounded border"
        >
          {Item}
        </List>
      )}
    </div>
  );
}

export default memo(ObjectList);
