import Card from './Card';

export default function ObjectCard({ item }) {
  return (
    <Card>
      <h4 className="font-semibold">{item.name}</h4>
      <p className="text-gray-500">{item.description}</p>
    </Card>
  )
}
