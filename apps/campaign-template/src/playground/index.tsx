import { useState } from 'react';
import { SectionPanel } from './SectionPanel';
import { ScenarioRunner } from './ScenarioRunner';
import { registerSections } from './section-registry';

const sections = registerSections();

export function Playground() {
  const [mode, setMode] = useState<'single' | 'scenario'>('single');

  return (
    <div className="min-h-screen bg-white">
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">
            [@new-type] Designer Playground
          </h1>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
            campaign-template
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`px-3 py-1 rounded text-sm ${
              mode === 'single' ? 'bg-blue-500' : 'bg-gray-700'
            }`}
            onClick={() => setMode('single')}
          >
            单组件预览
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              mode === 'scenario' ? 'bg-blue-500' : 'bg-gray-700'
            }`}
            onClick={() => setMode('scenario')}
          >
            场景流程
          </button>
        </div>
      </header>

      {/* 内容区 */}
      <main className="max-w-3xl mx-auto py-8 px-4">
        {mode === 'single' && (
          <div className="space-y-12">
            {sections.map((section) => (
              <SectionPanel key={section.id} section={section} />
            ))}
          </div>
        )}
        {mode === 'scenario' && <ScenarioRunner />}
      </main>
    </div>
  );
}
