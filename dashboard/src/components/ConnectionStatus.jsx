export default function ConnectionStatus({ connected }) {
  return (
    <div
      className={`conn ${connected ? "conn--on" : "conn--off"}`}
      title={connected ? "Live Socket.IO connection to the backend" : "Backend unreachable"}
    >
      <span className="conn-dot" />
      {connected ? "Live" : "Offline"}
    </div>
  );
}
