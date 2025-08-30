import { memo } from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function ObjectCard({ item }) {
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

ObjectCard.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
};
