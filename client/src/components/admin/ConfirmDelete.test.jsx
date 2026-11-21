import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import ConfirmDelete from './ConfirmDelete';

it('only deletes after the second click', async () => {
  const onConfirm = vi.fn().mockResolvedValue();
  render(<ConfirmDelete onConfirm={onConfirm} />);

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(onConfirm).not.toHaveBeenCalled(); // first click only asks

  await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

it("shows the server's message when the delete is refused", async () => {
  const onConfirm = vi.fn().mockRejectedValue(new Error('Members booked this class: cancel their bookings first'));
  render(<ConfirmDelete onConfirm={onConfirm} />);

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
  expect(await screen.findByText(/members booked this class/i)).toBeInTheDocument();
});
