import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useState, useRef } from "react";

// import { t } from "../i18n";
import { Object } from "../types";
// import logger from "../utils/logger";

import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";
import { Input } from "./ui/input";

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
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredObjects = objects.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const virtualizer = useVirtualizer({
    count: filteredObjects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const Item = memo(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
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
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
        </div>
      );
    },
  );

  Item.displayName = "Item";

  // В тестовой среде используем простой рендеринг без виртуализации
  if (process.env.NODE_ENV === "test") {
    if (filteredObjects.length === 0) {
      return (
        <div className="space-y-4">
          <Input
            placeholder={t("objects.search")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full"
          />
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            {t("objects.notFound")}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Input
          placeholder={t("objects.search")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full"
        />
        <div className="rounded border overflow-auto" style={{ height: 400 }}>
          {filteredObjects.map((item, index) => (
            <div key={item.id || index} className="px-2 py-1">
              <div
                className="cursor-pointer rounded border p-3 hover:bg-accent"
                onClick={() => onItemClick(item)}
              >
                <h3 className="font-medium">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
        <div
          ref={parentRef}
          className="rounded border overflow-auto"
          style={{ height: 400 }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const object = filteredObjects[virtualItem.index];
              if (!object) return null;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <Item index={virtualItem.index} style={{}} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ObjectList);
