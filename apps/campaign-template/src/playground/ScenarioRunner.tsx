import { useState, useRef, useEffect, useCallback } from 'react';
import { scenarios } from './scenarios/lottery';
import { registerSections } from './section-registry';
import { FlowInspector } from './FlowInspector';
import type { Scenario, ScenarioStep } from './types';
import type { SectionStatus } from '../contracts/section';

const sections = registerSections();

/** 根据 step 的 sectionId 和 status 找出要渲染的组件 */
function useStepRenderer(step: ScenarioStep) {
  if (!step.sectionId) return null;

  const section = sections.find((s) => s.id === step.sectionId);
  if (!section) return null;

  const status: SectionStatus = step.status || 'ready';

  // 如果有非 ready 状态且 section 提供了对应的状态视图，渲染状态视图
  if (status !== 'ready' && section.stateViews[status]) {
    const StateComp = section.stateViews[status]!;
    const messages: Record<string, string> = {
      loading: '加载中...',
      empty: '暂无内容',
      error: '加载失败，请稍后重试',
    };
    return <StateComp message={messages[status]} />;
  }

  // 否则用 content 渲染组件（优先使用 step 自定义 content，否则用 defaultContent）
  const content = step.content || section.defaultContent;
  return <section.component content={content} />;
}

export function ScenarioRunner() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = selectedScenario.steps[activeStepIndex];
  const stepRenderer = useStepRenderer(currentStep);

  // 清除定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 自动播放逻辑
  useEffect(() => {
    if (!isPlaying) {
      clearTimer();
      return;
    }

    if (activeStepIndex >= selectedScenario.steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const delay = selectedScenario.autoPlayDelay || 2000;
    timerRef.current = setTimeout(() => {
      setActiveStepIndex((prev) => {
        const next = prev + 1;
        // 如果到最后一帧，停止播放
        if (next >= selectedScenario.steps.length - 1) {
          setIsPlaying(false);
        }
        return next;
      });
    }, delay);

    return clearTimer;
  }, [isPlaying, activeStepIndex, selectedScenario, clearTimer]);

  // 切换场景时重置
  const handleScenarioChange = (s: Scenario) => {
    setIsPlaying(false);
    clearTimer();
    setSelectedScenario(s);
    setActiveStepIndex(0);
  };

  // 切换步骤
  const handleStepChange = (idx: number) => {
    if (isPlaying) {
      setIsPlaying(false);
      clearTimer();
    }
    setActiveStepIndex(idx);
  };

  // 播放/暂停
  const handlePlayToggle = () => {
    if (activeStepIndex >= selectedScenario.steps.length - 1) {
      // 播完了，从头开始
      setActiveStepIndex(0);
    }
    setIsPlaying((p) => !p);
  };

  // 重置
  const handleReset = () => {
    setIsPlaying(false);
    clearTimer();
    setActiveStepIndex(0);
  };

  return (
    <div className="relative min-h-[60vh]">
      {/* 左右布局：左侧选场景，右侧渲染 */}
      <div className="flex gap-6">
        {/* 左侧场景列表 */}
        <div className="w-48 shrink-0 space-y-2">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            场景
          </h3>
          {scenarios.map((s) => (
            <button
              key={s.id}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                selectedScenario.id === s.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleScenarioChange(s)}
            >
              <div className="font-medium">{s.label}</div>
              {s.description && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {s.description}
                </div>
              )}
            </button>
          ))}

          {/* 场景信息卡片 */}
          {currentStep.store && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Store 数据
              </h4>
              <pre className="text-[20px] bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-48 text-gray-600">
                {JSON.stringify(currentStep.store, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* 右侧渲染区 */}
        <div className="flex-1">
          {/* 渲染区背景框 */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            {/* 顶栏指示 */}
            <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  步骤 {activeStepIndex + 1} / {selectedScenario.steps.length}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {currentStep.name}
                </span>
              </div>
              {currentStep.sectionId && (
                <span className="text-[20px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                  {currentStep.sectionId}
                </span>
              )}
            </div>

            {/* 实际渲染区 */}
            <div className="relative">
              {stepRenderer ? (
                stepRenderer
              ) : (
                <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">
                  此步骤未指定要渲染的 section
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 浮动流程面板 */}
      <FlowInspector
        scenario={selectedScenario}
        currentStep={currentStep}
        currentIndex={activeStepIndex}
        totalSteps={selectedScenario.steps.length}
        isPlaying={isPlaying}
        onStepChange={handleStepChange}
        onPlayToggle={handlePlayToggle}
        onReset={handleReset}
      />
    </div>
  );
}
