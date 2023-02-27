import { capitalizeFirstLetter } from '../../lib/common';

export default function CityCoinUserIds({ userId, city, version }) {
  return (
    <div className="row">
      <div className="col-6 text-end text-nowrap">{userId}</div>
      <div className="col-6 text-start">
        {city.toUpperCase()} ({capitalizeFirstLetter(version)})
      </div>
    </div>
  );
}
