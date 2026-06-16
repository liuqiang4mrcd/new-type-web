import { ContentEditor } from './ContentEditor';
import { ActionsLog } from './ActionsLog';
import type { PreviewMode, PlaygroundSection, Scenario } from './types';

interface ControlPanelProps {
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  sections: PlaygroundSection[];
  selectedSectionId: string | null;
  onSectionSelect: (id: string) => void;
  customContent: Record<string, unknown> | null;
  onContentChange: (content: Record<string, unknown>) => void;
  actionsLog: Array<{ time: string; action: string; args: unknown[] }>;
  scenarios: Scenario[];
  selectedScenario: Scenario;
  onScenarioSelect: (s: Scenario) => void;
  activeStepIndex: number;
  onStepChange: (index: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  flowInspectorCollapsed: boolean;
  onToggleFlowInspectorCollapse: () => void;
}

export function ControlPanel({
  mode,
  onModeChange,
  sections,
  selectedSectionId,
  onSectionSelect,
  customContent,
  onContentChange,
  actionsLog,
  scenarios,
  selectedScenario,
  onScenarioSelect,
  activeStepIndex,
  onStepChange,
  isPlaying,
  onPlayToggle,
  onReset,
  flowInspectorCollapsed,
  onToggleFlowInspectorCollapse,
}: ControlPanelProps) {
  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  return (
    <aside className="w-72 shrink-0 bg-gray-900 text-white h-[calc(100vh-56px)] overflow-y-auto border-l border-gray-700">
      {/* 预览模式 */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          预览模式
        </h3>
        <div className="space-y-1">
          {([
            { value: 'full' as const, label: '完整页面' },
            { value: 'single' as const, label: '单组件' },
            { value: 'flow' as const, label: '流程预览' },
          ]).map(({ value, label }) => (
            <button
              key={value}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                mode === value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              onClick={() => onModeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 列表 — 仅单组件模式 */}
      {mode === 'single' && (
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Section
          </h3>
          <div className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`w-full text-left px-3 py-1.5 rounded text-sm ${
                  selectedSectionId === s.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                onClick={() => onSectionSelect(s.id)}
              >
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content 编辑器 — 仅单组件模式 */}
      {mode === 'single' && selectedSection && (
        <details className="p-4 border-b border-gray-700" open>
          <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer select-none">
            Content 编辑
          </summary>
          <div className="mt-3">
            <ContentEditor
              defaultContent={selectedSection.defaultContent}
              customContent={customContent}
              onChange={onContentChange}
            />
          </div>
        </details>
      )}

      {/* Actions 日志 — 仅单组件模式 */}
      {mode === 'single' && (
        <details className="p-4 border-b border-gray-700" open>
          <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer select-none">
            Actions 日志
          </summary>
          <div className="mt-3">
            <ActionsLog logs={actionsLog} />
          </div>
        </details>
      )}

      {/* 场景 + 控制 — 仅流程模式 */}
      {mode === 'flow' && (
        <div className="p-4 border-b border-gray-700">
          {/* 场景列表 */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              场景
            </h3>
            <div className="space-y-1">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedScenario.id === s.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => onScenarioSelect(s)}
                >
                  <div className="font-medium">{s.label}</div>
                  {s.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {s.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 步骤导航 */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              步骤
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {selectedScenario.steps.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isPast = idx < activeStepIndex;
                return (
                  <button
                    key={step.id}
                    className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white ring-2 ring-blue-400'
                        : isPast
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    onClick={() => onStepChange(idx)}
                    title={step.name}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* 当前步骤描述 */}
            {selectedScenario.steps[activeStepIndex] && (
              <div className="text-xs text-gray-400 mb-3">
                <span className="font-medium text-gray-200">
                  {selectedScenario.steps[activeStepIndex].name}
                </span>
                {selectedScenario.steps[activeStepIndex].description && (
                  <span className="block text-gray-500 mt-0.5">
                    {selectedScenario.steps[activeStepIndex].description}
                  </span>
                )}
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex items-center gap-2">
              <button
                className="flex-1 px-2 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 transition-colors"
                disabled={activeStepIndex === 0}
                onClick={() => onStepChange(activeStepIndex - 1)}
              >
                ◀ 上一步
              </button>
              <button
                className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 transition-colors"
                onClick={onPlayToggle}
              >
                {isPlaying ? '⏸ 暂停' : '▶ 播放'}
              </button>
              <button
                className="flex-1 px-2 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 transition-colors"
                disabled={activeStepIndex >= selectedScenario.steps.length - 1}
                onClick={() => onStepChange(activeStepIndex + 1)}
              >
                下一步 ▶
              </button>
              <button
                className="px-2 py-1.5 text-xs rounded bg-gray-700 hover:bg-red-800 transition-colors"
                onClick={onReset}
                title="重置"
              >
                ↺
              </button>
            </div>
          </div>

          {/* Store 数据折叠面板 */}
          {selectedScenario.steps[activeStepIndex]?.store && (
            <details className="mt-4">
              <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer select-none">
                Store 数据
              </summary>
              <pre className="mt-2 text-xs font-mono bg-gray-800 text-gray-300 rounded p-2 max-h-32 overflow-auto">
                {JSON.stringify(
                  selectedScenario.steps[activeStepIndex].store,
                  null,
                  2,
                )}
              </pre>
            </details>
          )}

          {/* FlowInspector 折叠控制 */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-800"
                checked={!flowInspectorCollapsed}
                onChange={onToggleFlowInspectorCollapse}
              />
              <span className="text-xs text-gray-400">
                显示浮动流程面板
              </span>
            </label>
          </div>
        </div>
      )}
    </aside>
  );
}
