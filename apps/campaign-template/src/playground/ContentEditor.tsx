import { useState, useEffect } from 'react';

interface ContentEditorProps {
  defaultContent: Record<string, unknown>;
  customContent: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
}

export function ContentEditor({
  defaultContent,
  customContent,
  onChange,
}: ContentEditorProps) {
  const [text, setText] = useState(() =>
    JSON.stringify(customContent ?? defaultContent, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(customContent ?? defaultContent, null, 2));
    setError(null);
  }, [defaultContent, customContent]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) {
        setError('内容必须是 JSON 对象');
        return;
      }
      onChange(parsed);
      setError(null);
    } catch {
      setError('JSON 格式错误，无法解析');
    }
  };

  const handleReset = () => {
    setText(JSON.stringify(defaultContent, null, 2));
    onChange(defaultContent);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full h-32 text-xs font-mono bg-gray-800 text-gray-200 border border-gray-700 rounded p-2 resize-y"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
      {error && <div className="text-xs text-red-400">{error}</div>}
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white"
          onClick={handleApply}
        >
          应用
        </button>
        <button
          className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
          onClick={handleReset}
        >
          重置为默认
        </button>
      </div>
    </div>
  );
}
