import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSections } from './section-registry';

const sections = registerSections();

function PhonePreview() {
  return (
    <main className="min-h-screen" style={{ background: '#0a1a0a' }}>
      {sections.map((section) => (
        <section.component
          key={section.id}
          content={section.defaultContent}
          actions={section.defaultActions}
        />
      ))}
    </main>
  );
}

export function renderPhonePreview() {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <PhonePreview />
    </React.StrictMode>,
  );
}
