export default function ErrorMessage({ message = 'Ошибка загрузки данных' }) {
  return (
    <div className="text-center text-red-500 p-4" role="alert">
      {message}
    </div>
  );
}
