import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maskClosable?: boolean;
}

export function Modal({ open, onClose, children, maskClosable = true }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        onClick={maskClosable ? onClose : undefined}
      />
      <div
        style={{
          position: 'relative',
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: '85vw',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
