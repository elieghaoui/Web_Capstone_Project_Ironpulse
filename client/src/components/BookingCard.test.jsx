import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import BookingCard from './BookingCard';

const booking = {
  _id: 'b1',
  type: 'class',
  startsAt: '2030-01-07T16:00:00.000Z', // far in the future: can be cancelled
  note: '',
  classId: { title: 'Power Yoga', trainerId: { name: 'Maya Khoury' } },
};

it('asks before cancelling, then calls onCancel with the booking id', async () => {
  const onCancel = vi.fn().mockResolvedValue();
  render(<BookingCard booking={booking} onSaveNote={() => {}} onCancel={onCancel} />);

  await userEvent.click(screen.getByRole('button', { name: /cancel booking/i }));
  expect(onCancel).not.toHaveBeenCalled(); // first click only asks

  await userEvent.click(screen.getByRole('button', { name: /yes, cancel/i }));
  expect(onCancel).toHaveBeenCalledWith('b1');
});

it('hides Cancel less than 12 hours before the start', () => {
  const soon = { ...booking, startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() };
  render(<BookingCard booking={soon} onSaveNote={() => {}} onCancel={() => {}} />);
  expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument();
  expect(screen.getByText(/can't cancel less than 12 hours before/i)).toBeInTheDocument();
});
