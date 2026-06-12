import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
let addToast: ((msg: ToastMessage) => void) | null = null;

export function toast(text: string, type: ToastMessage['type'] = 'info') {
  addToast?.({ id: ++toastId, text, type });
}

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToast = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 3000);
    };
    return () => {
      addToast = null;
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            backgroundColor:
              msg.type === 'success' ? '#10b981' : msg.type === 'error' ? '#ef4444' : '#3b82f6',
          }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
