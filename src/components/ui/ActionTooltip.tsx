import { cloneElement, isValidElement } from 'react';
import type { CSSProperties, ReactElement, Ref } from 'react';
import { Tooltip } from '@heroui/react';

interface Props {
  content: string;
  children: ReactElement;
}

type AnyProps = Record<string, unknown> & { ref?: Ref<unknown>; className?: string; style?: CSSProperties };

const setRef = (ref: Ref<unknown> | undefined, value: unknown) => {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: unknown }).current = value;
};

/** Merge the trigger props HeroUI hands us into the child's own props (handlers chained, refs merged). */
const mergeTriggerProps = (child: AnyProps, trigger: AnyProps): AnyProps => {
  const { role: _role, tabIndex: _tabIndex, children: _children, ...rest } = trigger;
  const merged: AnyProps = { ...child, ...rest };
  for (const key of Object.keys(rest)) {
    const a = child[key];
    const b = rest[key];
    if (/^on[A-Z]/.test(key) && typeof a === 'function' && typeof b === 'function') {
      merged[key] = (...args: unknown[]) => {
        (a as (...a: unknown[]) => void)(...args);
        (b as (...a: unknown[]) => void)(...args);
      };
    }
  }
  merged.className = [child.className, rest.className].filter(Boolean).join(' ') || undefined;
  merged.style = child.style || rest.style ? { ...child.style, ...rest.style } : undefined;
  merged.ref = (node: unknown) => {
    setRef(child.ref, node);
    setRef(rest.ref, node);
  };
  return merged;
};

/**
 * Tooltip around a single element. The child itself becomes the trigger (no wrapper element is
 * added), so layout, focus order and the child's own props are untouched.
 */
const ActionTooltip = ({ content, children }: Props) => {
  if (!isValidElement<AnyProps>(children)) return children;
  return (
    <Tooltip delay={300} closeDelay={0}>
      <Tooltip.Trigger render={props => cloneElement(children, mergeTriggerProps(children.props, props as AnyProps))}>
        {null}
      </Tooltip.Trigger>
      <Tooltip.Content
        placement="top"
        className="max-w-[240px] rounded-lg border border-(--border-primary) bg-(--bg-secondary) px-3 py-2 text-xs leading-relaxed text-(--text-primary) shadow-lg"
      >
        {content}
      </Tooltip.Content>
    </Tooltip>
  );
};

export default ActionTooltip;
