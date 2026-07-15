import type { Meta, StoryObj } from '@storybook/react';
import { Camera, MapPin, Utensils, Coffee, AlertCircle } from 'lucide-react';

import { TipRow, type LocalTip } from './index';

const meta: Meta<typeof TipRow> = {
  title: 'Common/TipRow',
  component: TipRow,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text', description: 'Tip text' },
    icon: { description: 'Optional icon from lucide-react' },
  },
  args: {
    text: 'Visit during cherry blossom season for spectacular views.',
  },
};

export default meta;
type Story = StoryObj<typeof TipRow>;

export const Default: Story = {
  args: {
    text: 'Visit during cherry blossom season for spectacular views.',
  },
};

export const WithCamera: Story = {
  name: 'Photography tip',
  args: {
    text: 'Bring a wide-angle lens for photographing the temples.',
    icon: Camera,
  },
};

export const WithLocation: Story = {
  name: 'Location tip',
  args: {
    text: 'Stay near the train station for easy access to attractions.',
    icon: MapPin,
  },
};

export const WithFood: Story = {
  name: 'Food tip',
  args: {
    text: 'Try the local street food at the night markets.',
    icon: Utensils,
  },
};

export const WithCoffee: Story = {
  name: 'Coffee tip',
  args: {
    text: 'The third-wave coffee scene is incredible here.',
    icon: Coffee,
  },
};

export const WithAlert: Story = {
  name: 'Alert tip',
  args: {
    text: 'Book accommodations in advance during peak season.',
    icon: AlertCircle,
  },
};

export const LongText: Story = {
  name: 'Long text',
  args: {
    text: 'The local public transportation system is efficient and affordable. You can buy a multi-day pass at convenience stores, which will save you money and make getting around much easier.',
    icon: MapPin,
  },
};

export const AllTips: Story = {
  name: 'Multiple tips',
  render: () => {
    const tips: LocalTip[] = [
      { text: 'Visit during cherry blossom season' },
      { text: 'Take the bullet train for scenic views', icon: MapPin },
      { text: 'Try authentic ramen from local shops', icon: Utensils },
      { text: 'Visit temples early morning for fewer crowds', icon: Camera },
    ];

    return (
      <ul className="w-full max-w-md">
        {tips.map((tip, idx) => (
          <TipRow key={idx} text={tip.text} icon={tip.icon} />
        ))}
      </ul>
    );
  },
};
