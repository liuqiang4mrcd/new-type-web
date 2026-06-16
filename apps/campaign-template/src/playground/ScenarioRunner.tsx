import { registerSections } from './section-registry';
import type { Scenario } from './types';
import type { SectionStatus } from '../contracts/section';

const sections = registerSections();

/** 根据 step 的 sectionId 和 status 找出要渲染的组件 */
function StepRenderer({ scenario, stepIndex }: { scenario: Scenario; stepIndex: number }) {
  const step = scenario.steps[stepIndex];
  if (!step) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">
        无效步骤
      </div>
    );
  }

  if (!step.sectionId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">
        此步骤未指定要渲染的 section
      </div>
    );
  }

  const section = sections.find((s) => s.id === step.sectionId);
  if (!section) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">
        未找到 Section: {step.sectionId}
      </div>
    );
  }

  const status: SectionStatus = step.status || 'ready';

  if (status !== 'ready' && section.stateViews[status]) {
    const StateComp = section.stateViews[status]!;
    const messages: Record<string, string> = {
      loading: '加载中...',
      empty: '暂无内容',
      error: '加载失败，请稍后重试',
    };
    return <StateComp message={messages[status]} />;
  }

  const content = step.content || section.defaultContent;
  return <section.component content={content} />;
}

interface ScenarioRunnerProps {
  scenario: Scenario;
  stepIndex: number;
}

export function ScenarioRunner({ scenario, stepIndex }: ScenarioRunnerProps) {
  const currentStep = scenario.steps[stepIndex];

  return (
    <div className="relative min-h-[60vh] flex justify-center">
      <div className="w-full max-w-lg">
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                步骤 {stepIndex + 1} / {scenario.steps.length}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {currentStep?.name ?? ''}
              </span>
            </div>
            {currentStep?.sectionId && (
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                {currentStep.sectionId}
              </span>
            )}
          </div>

          <div className="relative">
            <StepRenderer scenario={scenario} stepIndex={stepIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
