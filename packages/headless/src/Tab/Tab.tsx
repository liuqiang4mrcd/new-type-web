import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode, KeyboardEvent, ComponentPropsWithoutRef } from 'react';

/* ─── Types ─── */

export interface TabRootProps<T extends string = string> {
  /** 当前激活的 tab value（受控） */
  value?: T;
  /** 默认激活的 tab value（非受控） */
  defaultValue?: T;
  /** value 变化回调 */
  onValueChange?: (value: T) => void;
  /** 排列方向 */
  orientation?: 'horizontal' | 'vertical';
  /** 是否禁用 */
  disabled?: boolean;
  children: ReactNode;
}

export interface TabListProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}

export interface TabTriggerProps<T extends string = string>
  extends Omit<ComponentPropsWithoutRef<'button'>, 'value'> {
  /** 对应 Tab.Content 的 value */
  value: T;
}

export interface TabContentProps extends ComponentPropsWithoutRef<'div'> {
  /** 对应 Tab.Trigger 的 value */
  value: string;
  children: ReactNode;
}

/* ─── Context ─── */

interface TabContextValue<T extends string = string> {
  activeValue: T;
  onChange: (value: T) => void;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
  /** base id for aria attributes */
  baseId: string;
}

const TabContext = createContext<TabContextValue | null>(null);

function useTabContext() {
  const ctx = useContext(TabContext);
  if (!ctx) {
    throw new Error('Tab compound components must be used within <Tab.Root>');
  }
  return ctx;
}

/* ─── Sub-components ─── */

function TabRoot<T extends string = string>({
  value: controlledValue,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  disabled = false,
  children,
}: TabRootProps<T>) {
  const [internalValue, setInternalValue] = useState<T | undefined>(
    defaultValue,
  );
  const isControlled = controlledValue !== undefined;
  const activeValue = (isControlled ? controlledValue : internalValue) as T;

  const handleChange = useCallback(
    (val: T) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      onValueChange?.(val);
    },
    [isControlled, onValueChange],
  );

  const baseId = useId();

  const ctx = useMemo<TabContextValue<T>>(
    () => ({
      activeValue,
      onChange: handleChange,
      orientation,
      disabled,
      baseId,
    }),
    [activeValue, handleChange, orientation, disabled, baseId],
  );

  return <TabContext.Provider value={ctx as unknown as TabContextValue}>{children}</TabContext.Provider>;
}

function TabList({ children, className, ...rest }: TabListProps) {
  const { orientation, baseId } = useTabContext();
  const listRef = useRef<HTMLDivElement>(null);

  const getTriggerValues = useCallback((): string[] => {
    if (!listRef.current) return [];
    const triggers = listRef.current.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    return Array.from(triggers)
      .map((el) => el.getAttribute('data-value'))
      .filter(Boolean) as string[];
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const values = getTriggerValues();
    if (values.length === 0) return;

    const active = document.activeElement?.getAttribute('data-value');
    const currentIndex = active ? values.indexOf(active) : -1;
    const isNext =
      orientation === 'horizontal'
        ? e.key === 'ArrowRight'
        : e.key === 'ArrowDown';
    const isPrev =
      orientation === 'horizontal'
        ? e.key === 'ArrowLeft'
        : e.key === 'ArrowUp';

    let nextIndex: number | null = null;

    if (isNext) {
      nextIndex = currentIndex < values.length - 1 ? currentIndex + 1 : 0;
      e.preventDefault();
    }
    if (isPrev) {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : values.length - 1;
      e.preventDefault();
    }
    if (e.key === 'Home') {
      nextIndex = 0;
      e.preventDefault();
    }
    if (e.key === 'End') {
      nextIndex = values.length - 1;
      e.preventDefault();
    }

    if (nextIndex !== null) {
      const nextTrigger = listRef.current?.querySelector<HTMLButtonElement>(
        `[role="tab"][data-value="${values[nextIndex]}"]`,
      );
      nextTrigger?.focus();
      nextTrigger?.click();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}

function TabTrigger<T extends string = string>({
  value,
  children,
  className,
  disabled: triggerDisabled,
  ...rest
}: TabTriggerProps<T>) {
  const { activeValue, onChange, disabled: rootDisabled, baseId } = useTabContext();
  const isSelected = activeValue === value;
  const isDisabled = rootDisabled || triggerDisabled;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      id={tabId}
      role="tab"
      data-value={value}
      aria-selected={isSelected}
      aria-controls={panelId}
      aria-disabled={isDisabled || undefined}
      tabIndex={isSelected ? 0 : -1}
      disabled={isDisabled}
      onClick={() => onChange(value as unknown as T)}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}

function TabContent({ value, children, className, ...rest }: TabContentProps) {
  const { activeValue, baseId } = useTabContext();
  const isSelected = activeValue === value;
  const panelId = `${baseId}-panel-${value}`;
  const tabId = `${baseId}-tab-${value}`;

  if (!isSelected) return null;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─── Compound component ─── */

export const Tab = {
  Root: TabRoot,
  List: TabList,
  Trigger: TabTrigger,
  Content: TabContent,
};
