import type { ReactNode } from 'react';
import { Tooltip } from '@heroui/react';

interface Props {
  content: string;
  children: ReactNode;
}

const ActionTooltip = ({ content, children }: Props) => (
  <Tooltip delay={300} closeDelay={0}>
    <Tooltip.Trigger render={props => <span {...props} role={undefined} tabIndex={undefined} className="inline-flex" />}>
      {children}
    </Tooltip.Trigger>
    <Tooltip.Content
      placement="top"
      className="max-w-[240px] rounded-lg border border-(--border-primary) bg-(--bg-secondary) px-3 py-2 text-xs leading-relaxed text-(--text-primary) shadow-lg"
    >
      {content}
    </Tooltip.Content>
  </Tooltip>
);

export default ActionTooltip;
