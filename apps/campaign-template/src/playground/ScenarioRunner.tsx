import { registerSections } from "./section-registry";
import type { Scenario } from "./types";
import type { SectionStatus } from "../contracts/section";

const sections = registerSections();

function renderSection(
  sectionId: string,
  status: SectionStatus,
  contentOverride?: Record<string, unknown>,
) {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) {
    return (
      <div className="flex items-center justify-center min-h-[160px] text-gray-400 text-sm">
        未找到 Section: {sectionId}
      </div>
    );
  }

  if (status !== "ready" && section.stateViews[status]) {
    const StateComp = section.stateViews[status]!;
    const messages: Record<string, string> = {
      loading: "加载中...",
      empty: "暂无内容",
      error: "加载失败，请稍后重试",
    };
    return <StateComp message={messages[status]} />;
  }

  const content = {
    ...section.defaultContent,
    ...(contentOverride ?? {}),
  };

  return (
    <section.component content={content} actions={section.defaultActions} />
  );
}

/** 根据 step.sections 渲染当前业务步骤中的一个或多个 Section */
function StepRenderer({
  scenario,
  stepIndex,
}: {
  scenario: Scenario;
  stepIndex: number;
}) {
  const step = scenario.steps[stepIndex];
  if (!step) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">
        无效步骤
      </div>
    );
  }

  if (step.sections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">
        此步骤未指定要渲染的 Section
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {step.sections.map((entry) => (
        <div key={entry.sectionId} className="relative">
          {renderSection(
            entry.sectionId,
            entry.status || "ready",
            entry.content,
          )}
        </div>
      ))}
    </div>
  );
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
                {currentStep?.name ?? ""}
              </span>
            </div>
            {currentStep?.sections?.length ? (
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                {scenario.group}
              </span>
            ) : null}
          </div>

          <div className="relative">
            <StepRenderer scenario={scenario} stepIndex={stepIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
