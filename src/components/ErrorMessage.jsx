export default function ErrorMessage({
  error,
  message = 'Ошибка загрузки данных',
}) {
  const text = error?.message ? `${message}: ${error.message}` : message
  return (
    <div className="text-center text-red-500 p-4" role="alert">
      {text}
    </div>
  )
}
