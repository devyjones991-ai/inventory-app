import { memo } from "react";

import { Object } from "../types";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface ObjectCardProps {
  item: Object;
}

function ObjectCard({ item }: ObjectCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      {item.description && (
        <CardContent className="pt-0">
          <p className="text-muted-foreground">{item.description}</p>
        </CardContent>
      )}
    </Card>
  );
}

export default memo(ObjectCard);
