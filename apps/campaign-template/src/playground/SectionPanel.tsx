import { useState } from 'react';
import type { SectionStatus } from '../contracts/section';
import type { PlaygroundSection } from './types';

interface SectionPanelProps {
  section: PlaygroundSection;
  customContent?: Record<string, unknown> | null;
  actions?: Record<string, unknown>;
}

export function SectionPanel({ section, customContent, actions }: SectionPanelProps) {
  const [status, setStatus] = useState<SectionStatus>('ready');
  const [showMenu, setShowMenu] = useState(false);

  const statuses: SectionStatus[] = ['ready', 'loading', 'empty', 'error'];

  const renderContent = () => {
    if (status !== 'ready' && section.stateViews[status]) {
      const StateComponent = section.stateViews[status]!;
      const messages: Record<string, string> = {
        loading: '加载中...',
        empty: '暂无内容',
        error: '加载失败，请稍后重试',
      };
      return <StateComponent message={messages[status]} />;
    }
    const content = customContent ?? section.defaultContent;
    const actionProps = actions ?? section.defaultActions;
    return (
      <section.component
        content={content}
        actions={actionProps}
      />
    );
  };

  return (
    <div
      className="relative border border-gray-200 rounded-xl overflow-hidden"
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Section 名称 */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {section.name}
        </span>
        {showMenu && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">状态:</span>
            {statuses.map((s) => (
              <button
                key={s}
                className={`px-2 py-0.5 text-xs rounded ${
                  status === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                onClick={() => setStatus(s)}
              >
                {s === 'ready'
                  ? '正常'
                  : s === 'loading'
                    ? '加载'
                    : s === 'empty'
                      ? '空态'
                      : '错误'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 渲染区 */}
      <div className="relative">{renderContent()}</div>
    </div>
  );
}
