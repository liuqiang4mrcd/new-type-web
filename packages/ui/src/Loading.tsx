interface LoadingProps {
  size?: number;
  color?: string;
  text?: string;
}

export function Loading({ size = 32, color = '#3b82f6', text }: LoadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid #e5e7eb',
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && (
        <span style={{ fontSize: 14, color: '#6b7280' }}>{text}</span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
