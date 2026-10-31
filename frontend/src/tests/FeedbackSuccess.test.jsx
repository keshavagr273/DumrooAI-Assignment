import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedbackSuccess from '../features/feedback/components/FeedbackSuccess.jsx';

describe('FeedbackSuccess Component', () => {
  const mockReport = {
    referenceId: 'FB-2026-00099',
    status: 'open',
  };

  it('renders reference ID and warm confirmation message', () => {
    render(<FeedbackSuccess report={mockReport} onClose={() => {}} />);

    expect(screen.getByText('FB-2026-00099')).toBeInTheDocument();
    expect(screen.getByText(/Thank You for Your Feedback!/i)).toBeInTheDocument();
    // Verify it does NOT claim the issue is already resolved
    expect(screen.queryByText(/Issue resolved/i)).not.toBeInTheDocument();
  });

  it('copies reference ID when copy button is clicked', () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<FeedbackSuccess report={mockReport} onClose={() => {}} />);

    const copyBtn = screen.getByLabelText(/Copy Reference ID/i);
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('FB-2026-00099');
  });

  it('calls onClose when Done button is clicked', () => {
    const handleClose = vi.fn();
    render(<FeedbackSuccess report={mockReport} onClose={handleClose} />);

    const doneBtn = screen.getByRole('button', { name: /Done/i });
    fireEvent.click(doneBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
