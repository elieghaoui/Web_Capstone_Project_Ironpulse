import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import ClassRow from './ClassRow';

// Test what the user sees.
const gymClass = {
  _id: 'c1',
  title: 'HIIT Burn',
  startsAt: '2030-01-07T16:00:00.000Z',
  durationMin: 45,
  room: 'Studio A',
  capacity: 20,
  spotsLeft: 5,
  trainerId: { name: 'Lea Saad' },
};

it('shows the class, its coach and the spots left', () => {
  render(<ClassRow gymClass={gymClass} onBook={() => {}} />);
  expect(screen.getByText('HIIT Burn')).toBeInTheDocument();
  expect(screen.getByText(/with Lea Saad/)).toBeInTheDocument();
  expect(screen.getByText('5 spots left')).toBeInTheDocument();
});

it('calls onBook with the class id', async () => {
  const onBook = vi.fn();
  render(<ClassRow gymClass={gymClass} onBook={onBook} />);
  await userEvent.click(screen.getByRole('button', { name: /book/i }));
  expect(onBook).toHaveBeenCalledWith('c1');
});

it('disables Book when the class is full', () => {
  render(<ClassRow gymClass={{ ...gymClass, spotsLeft: 0 }} onBook={() => {}} />);
  expect(screen.getByText('Full')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /book/i })).toBeDisabled();
});

it('shows "Booked" instead of the button when I already booked it', () => {
  render(<ClassRow gymClass={gymClass} booked onBook={() => {}} />);
  expect(screen.getByText(/booked/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /book/i })).not.toBeInTheDocument();
});
