import { Info, type LucideIcon } from 'lucide-react';

export interface LocalTip {
  text: string;
  icon?: LucideIcon;
}

export const TipRow = ({ text, icon: Icon = Info }: LocalTip) => (
  <li className="border-border-tertiary flex items-start gap-2 border-b py-2 last:border-b-0">
    <Icon size={16} className="text-text-tertiary mt-0.5 flex-shrink-0" aria-hidden="true" />
    <span className="text-body font-regular text-text-secondary leading-relaxed">{text}</span>
  </li>
);
