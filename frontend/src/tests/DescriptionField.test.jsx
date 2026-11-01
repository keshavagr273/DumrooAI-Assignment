import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DescriptionField from '../features/feedback/components/DescriptionField.jsx';

describe('DescriptionField Component', () => {
  it('renders with placeholder and current character count', () => {
    render(<DescriptionField value="Sample text" onChange={() => {}} />);

    const textarea = screen.getByPlaceholderText(/Tell us what happened/i);
    expect(textarea).toBeInTheDocument();
    expect(screen.getByText(/11 \/ 5000/)).toBeInTheDocument();
  });

  it('calls onChange handler when typing', () => {
    const handleChange = vi.fn();
    render(<DescriptionField value="" onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText(/Tell us what happened/i);
    fireEvent.change(textarea, { target: { value: 'Something broke' } });

    expect(handleChange).toHaveBeenCalledWith('Something broke');
  });

  it('shows minimum length warning when below 10 characters', () => {
    render(<DescriptionField value="Short" onChange={() => {}} />);

    expect(screen.getByText(/Please write at least 5 more character/i)).toBeInTheDocument();
  });
});

