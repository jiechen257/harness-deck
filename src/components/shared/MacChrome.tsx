function TrafficLights() {
  return (
    <div className="traffic-lights" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export function MacChrome({ compact = false, status, title }: { compact?: boolean; status?: string; title: string }) {
  return (
    <div className={compact ? "mac-chrome compact" : "mac-chrome"}>
      {compact ? <div className="panel-grabber" aria-hidden="true" /> : <TrafficLights />}
      <span>{title}</span>
      {status ? <em>{status}</em> : null}
    </div>
  );
}
