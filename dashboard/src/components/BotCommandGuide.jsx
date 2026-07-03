const COMMANDS = [
  { cmd: "!status", desc: "All-room summary — who's burning watts right now" },
  { cmd: "!room <name>", desc: 'One room in detail — accepts "drawing", "work1", "work room 2"…' },
  { cmd: "!usage", desc: "Total power, estimated kWh today and per-room breakdown" },
  { cmd: "!alerts", desc: "Active after-hours / long-running alerts" },
  { cmd: "!help", desc: "Command list" },
];

/** The Discord bot reads the same backend — this card advertises its commands. */
export default function BotCommandGuide() {
  return (
    <div className="panel bot-guide">
      <h2>
        <span>🤖</span> Discord bot
        <small>same backend, same live data</small>
      </h2>
      <ul>
        {COMMANDS.map((c) => (
          <li key={c.cmd}>
            <code>{c.cmd}</code>
            <span>{c.desc}</span>
          </li>
        ))}
      </ul>
      <p className="bot-guide-note">
        New alerts are also pushed proactively to the configured Discord channel.
      </p>
    </div>
  );
}
