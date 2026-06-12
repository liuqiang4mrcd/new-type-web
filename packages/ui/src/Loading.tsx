interface LoadingProps {
  size?: number;
  color?: string;
  text?: string;
}

export function Loading({ size = 32, color = '#3b82f6', text }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className="border-[3px] rounded-full"
        style={{
          width: size,
          height: size,
          borderColor: '#e5e7eb',
          borderTopColor: color,
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && (
        <span className="text-sm text-gray-500">{text}</span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
