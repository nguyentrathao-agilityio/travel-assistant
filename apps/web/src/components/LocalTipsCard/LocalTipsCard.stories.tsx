import type { Meta, StoryObj } from '@storybook/react';

import { LocalTipsCard } from './index';
import type { TipsResult } from '@repo/types';

const meta: Meta<typeof LocalTipsCard> = {
  title: 'Components/LocalTipsCard',
  component: LocalTipsCard,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof LocalTipsCard>;

const sampleData: TipsResult = {
  city: 'Bangkok',
  country: 'Thailand',
  count: 3,
  summary: 'Key tips for first-time visitors, including transport, safety, and culinary etiquette.',
  tips: [
    {
      id: 'tip-1',
      category: 'transport',
      scope: 'city',
      title: 'Use river taxis for faster travel',
      content: 'River taxis bypass traffic and are a scenic way to travel across Bangkok.',
      isEssential: true,
    },
    {
      id: 'tip-2',
      category: 'culture',
      scope: 'city',
      title: 'Respect the royal family',
      content: 'Avoid any negative comments or jokes about the monarchy in public.',
      isEssential: false,
    },
    {
      id: 'tip-3',
      category: 'food',
      scope: 'city',
      title: 'Try street food at night markets',
      content: 'Look for busy stalls with fresh ingredients and high turnover.',
      isEssential: false,
    },
  ],
};

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const NoTips: Story = {
  args: {
    data: {
      city: 'Bangkok',
      country: 'Thailand',
      count: 0,
      summary: 'No tips available yet.',
      tips: [],
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
