import { memo } from 'react'
import PropTypes from 'prop-types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function ObjectCard({ item }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base-content/70 transition-colors">
          {item.description}
        </p>
      </CardContent>
    </Card>
  )
}

export default memo(ObjectCard)

ObjectCard.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
}
