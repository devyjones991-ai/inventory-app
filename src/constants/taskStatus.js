export const STATUS_MAP = {
  запланировано: 'planned',
  'в работе': 'in_progress',
  выполнено: 'done',
  отменено: 'canceled',
}

export const REVERSE_STATUS_MAP = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [v, k]),
)
