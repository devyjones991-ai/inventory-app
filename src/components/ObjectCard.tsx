// @ts-nocheck
import { memo } from 'react'
import PropTypes from 'prop-types'
import Card from './Card'

function ObjectCard({ item }) {
  return (
    <Card>
      <h4 className="font-semibold">{item.name}</h4>
      <p className="text-base-content/70 transition-colors">
        {item.description}
      </p>
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
