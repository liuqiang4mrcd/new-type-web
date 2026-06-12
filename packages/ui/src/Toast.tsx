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

  const bgClass =
    (t: ToastMessage['type']) =>
      t === 'success' ? 'bg-emerald-500' : t === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`px-5 py-2.5 rounded-lg text-white text-sm text-center whitespace-nowrap ${bgClass(msg.type)}`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
