export default function CityCoinUserIds({ userId, city, version }) {
  return (
    <div className="row">
      <div className="col-5 text-end text-nowrap">{userId}</div>
      <div className="col-3 text-start">
        {city.toUpperCase()} ({version})
      </div>
      <div className="w-100"></div>
    </div>
  );
}
