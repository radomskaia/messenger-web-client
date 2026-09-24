import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { useConfirmDialog } from './useConfirmDialog';

/** Opens a dialog on click and prints what the user answered. */
function Harness() {
  const { dialog, confirm } = useConfirmDialog();
  const [answer, setAnswer] = useState('none');

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void confirm({
            title: 'Receive messages here?',
            body: 'They go to https://crm.test/hook now.',
            confirmLabel: 'Take over',
            cancelLabel: 'Keep as is',
          }).then((isConfirmed) => {
            setAnswer(String(isConfirmed));
          });
        }}
      >
        ask
      </button>
      <output>{answer}</output>
      {dialog}
    </>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: 'ask' }));

  return user;
}

describe('useConfirmDialog', () => {
  it('shows nothing until asked', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a modal dialog named by its title', async () => {
    await openDialog();

    const dialog = screen.getByRole('dialog', { name: 'Receive messages here?' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveTextContent('They go to https://crm.test/hook now.');
  });

  it('resolves true and closes when the user confirms', async () => {
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Take over' }));

    expect(screen.getByRole('status')).toHaveTextContent('true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves false and closes when the user cancels', async () => {
    const user = await openDialog();

    await user.click(screen.getByRole('button', { name: 'Keep as is' }));

    expect(screen.getByRole('status')).toHaveTextContent('false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('treats Escape as cancel', async () => {
    await openDialog();

    // The browser fires `cancel` on the dialog when Escape is pressed.
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(await screen.findByText('false')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts focus on the choice that changes nothing', async () => {
    await openDialog();

    expect(screen.getByRole('button', { name: 'Keep as is' })).toHaveFocus();
  });
});
