interface ActionsLogProps {
  logs: Array<{ time: string; action: string; args: unknown[] }>;
}

export function ActionsLog({ logs }: ActionsLogProps) {
  if (logs.length === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-4">
        暂无 actions 调用记录
      </div>
    );
  }
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {[...logs].reverse().map((log, idx) => (
        <div
          key={idx}
          className="text-xs font-mono text-gray-300 bg-gray-800 rounded px-2 py-1"
        >
          <span className="text-gray-500">[{log.time}]</span>{' '}
          <span className="text-blue-400">{log.action}</span>
          {log.args.length > 0 && (
            <span className="text-gray-400">
              ({log.args.map((a) => JSON.stringify(a)).join(', ')})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
