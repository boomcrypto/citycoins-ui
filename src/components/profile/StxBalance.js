export default function StxBalance({ balance, symbol }) {
  return (
    <div className="row align-items-center">
      <div className="col-6 text-nowrap text-end">{balance}</div>
      <div className="col-3">{symbol.toUpperCase()}</div>
      <div className="w-100"></div>
    </div>
  );
}
