import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  args: { page: 1, totalPages: 10, onChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const FirstPage: Story = {};
export const Middle: Story = { args: { page: 12, totalPages: 30 } };
export const LastPage: Story = { args: { page: 10, totalPages: 10 } };
/** 한 페이지뿐이면 아무것도 그리지 않는다. */
export const SinglePage: Story = { args: { totalPages: 1 } };
