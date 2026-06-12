import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Designer Playground 仅在开发环境可用（?mode=designer）
// 生产构建会自动 tree-shake 整个 playground 代码
if (import.meta.env.DEV) {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('mode') === 'designer') {
    import('./playground').then(({ Playground }) => {
      root.render(
        <React.StrictMode>
          <Playground />
        </React.StrictMode>,
      );
    });
  } else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
