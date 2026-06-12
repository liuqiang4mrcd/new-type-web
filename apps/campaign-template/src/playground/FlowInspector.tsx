import type { Scenario, ScenarioStep } from './types';

interface FlowInspectorProps {
  scenario: Scenario;
  currentStep: ScenarioStep;
  currentIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onStepChange: (index: number) => void;
  onPlayToggle: () => void;
  onReset: () => void;
}

export function FlowInspector({
  scenario,
  currentStep,
  currentIndex,
  totalSteps,
  isPlaying,
  onStepChange,
  onPlayToggle,
  onReset,
}: FlowInspectorProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-72 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-2.5 bg-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 shrink-0">
            流程
          </span>
          <span className="text-sm font-medium truncate">
            {scenario.label}
          </span>
        </div>
        <span className="text-xs text-gray-400 shrink-0 ml-2">
          {currentIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* 进度条 */}
      <div className="h-1 bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / totalSteps) * 100}%`,
          }}
        />
      </div>

      {/* 当前步骤信息 */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="text-sm font-medium text-blue-400">
          {currentStep.name}
        </div>
        {currentStep.description && (
          <div className="text-xs text-gray-400 mt-0.5">
            {currentStep.description}
          </div>
        )}
      </div>

      {/* 步骤导航点 */}
      <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
        {scenario.steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex;
          return (
            <button
              key={step.id}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                  : isPast
                    ? 'bg-green-500/80 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              onClick={() => onStepChange(idx)}
              title={`${idx + 1}. ${step.name}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* 控制按钮 */}
      <div className="px-4 py-2.5 bg-gray-800 flex items-center gap-2">
        {/* 上一步 */}
        <button
          className="flex-1 px-2 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 transition-colors"
          disabled={currentIndex === 0}
          onClick={() => onStepChange(currentIndex - 1)}
        >
          上一步
        </button>

        {/* 播放/暂停 */}
        <button
          className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 transition-colors"
          onClick={onPlayToggle}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>

        {/* 下一步 */}
        <button
          className="flex-1 px-2 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 transition-colors"
          disabled={currentIndex >= totalSteps - 1}
          onClick={() => onStepChange(currentIndex + 1)}
        >
          下一步
        </button>

        {/* 重置 */}
        <button
          className="px-2 py-1.5 text-xs rounded bg-gray-700 hover:bg-red-800 transition-colors"
          onClick={onReset}
          title="重置"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
