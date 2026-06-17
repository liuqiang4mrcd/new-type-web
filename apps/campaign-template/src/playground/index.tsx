import { useState, useCallback, useEffect, useRef } from 'react';
import { SectionPanel } from './SectionPanel';
import { PhoneFrame } from './PhoneFrame';
import { ScenarioRunner } from './ScenarioRunner';
import { ControlPanel } from './ControlPanel';
import { FlowInspector } from './FlowInspector';
import { registerSections } from './section-registry';
import { scenarios, scenarioMeta } from './scenarios';
import type { PreviewMode } from './types';
import type { Scenario } from './types';

const sections = registerSections();

export function Playground() {
  const [mode, setMode] = useState<PreviewMode>('full');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    sections[0]?.id ?? null,
  );
  const [customContent, setCustomContent] = useState<Record<string, unknown> | null>(null);
  const [actionsLog, setActionsLog] = useState<
    Array<{ time: string; action: string; args: unknown[] }>
  >([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flowCollapsed, setFlowCollapsed] = useState(false);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  // 为 selectedSection 包装带日志的 actions
  const loggedActions = selectedSection?.defaultActions
    ? Object.fromEntries(
        Object.entries(selectedSection.defaultActions).map(([key, fn]) => [
          key,
          (...args: unknown[]) => {
            setActionsLog((prev) => [
              ...prev.slice(-49),
              { time: new Date().toLocaleTimeString(), action: key, args },
            ]);
            (fn as (...args: unknown[]) => void)(...args);
          },
        ]),
      )
    : undefined;

  const handleScenarioSelect = useCallback((s: Scenario) => {
    setSelectedScenario(s);
    setActiveStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleStepChange = useCallback(
    (idx: number) => {
      if (isPlaying) setIsPlaying(false);
      setActiveStepIndex(idx);
    },
    [isPlaying],
  );

  const handlePlayToggle = useCallback(() => {
    if (activeStepIndex >= selectedScenario.steps.length - 1) {
      setActiveStepIndex(0);
    }
    setIsPlaying((p) => !p);
  }, [activeStepIndex, selectedScenario.steps.length]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStepIndex(0);
  }, []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveStepIndex((prev) => {
          const next = prev + 1;
          if (next >= selectedScenario.steps.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, selectedScenario.autoPlayDelay ?? 2000);
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, selectedScenario.steps.length, selectedScenario.autoPlayDelay]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">
            [@new-type] Designer Playground
          </h1>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
            campaign-template
          </span>
          {!scenarioMeta.hasBusinessScenarios && (
            <span className="text-xs bg-yellow-700 px-2 py-0.5 rounded text-yellow-200">
              无业务场景
            </span>
          )}
        </div>
      </header>

      <div className="flex">
        <main className="flex-1 min-h-[calc(100vh-56px)] overflow-auto">
          {mode === 'full' && <PhoneFrame />}
          {mode === 'single' && selectedSection && (
            <div className="max-w-lg mx-auto py-8 px-4">
              <SectionPanel
                section={selectedSection}
                customContent={customContent}
                actions={loggedActions}
              />
            </div>
          )}
          {mode === 'flow' && (
            <div className="py-8 px-4">
              <ScenarioRunner
                scenario={selectedScenario}
                stepIndex={activeStepIndex}
              />
            </div>
          )}
        </main>

        <ControlPanel
          mode={mode}
          onModeChange={setMode}
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSectionSelect={(id) => {
            setSelectedSectionId(id);
            setCustomContent(null);
            setActionsLog([]);
          }}
          customContent={customContent}
          onContentChange={setCustomContent}
          actionsLog={actionsLog}
          scenarios={scenarios}
          selectedScenario={selectedScenario}
          onScenarioSelect={handleScenarioSelect}
          activeStepIndex={activeStepIndex}
          onStepChange={handleStepChange}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          flowInspectorCollapsed={flowCollapsed}
          onToggleFlowInspectorCollapse={() => setFlowCollapsed((p) => !p)}
        />
      </div>

      {mode === 'flow' && !flowCollapsed && (
        <FlowInspector
          scenario={selectedScenario}
          currentStep={selectedScenario.steps[activeStepIndex]}
          currentIndex={activeStepIndex}
          totalSteps={selectedScenario.steps.length}
          isPlaying={isPlaying}
          onStepChange={handleStepChange}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          collapsed={flowCollapsed}
          onToggleCollapse={() => setFlowCollapsed((p) => !p)}
        />
      )}
    </div>
  );
}
