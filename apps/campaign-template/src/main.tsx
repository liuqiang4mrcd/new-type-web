import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import './index.css';

const searchParams = new URLSearchParams(window.location.search);

// Designer Playground 仅在开发环境可用（?mode=designer）
// 生产构建会自动 tree-shake 整个 playground 代码
if (import.meta.env.DEV && searchParams.get('mode') === 'designer') {
  import('./playground').then(({ Playground }) => {
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <Playground />
      </React.StrictMode>,
    );
  });
} else if (import.meta.env.DEV && searchParams.get('mode') === 'phone-preview') {
  import('./playground/phone-preview').then(({ renderPhonePreview }) => {
    renderPhonePreview();
  });
} else {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
