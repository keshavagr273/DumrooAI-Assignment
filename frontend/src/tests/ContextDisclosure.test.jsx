import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ContextDisclosure from '../features/feedback/components/ContextDisclosure.jsx';

describe('ContextDisclosure Component', () => {
  const mockContext = {
    pageUrl: 'https://app.example.com/billing',
    browser: 'Chrome 128',
    os: 'Windows 11',
    screenResolution: '1920x1080',
    viewport: '1440x900',
  };

  it('initially renders closed disclosure header', () => {
    render(<ContextDisclosure context={mockContext} />);

    expect(screen.getByText(/Diagnostic metadata included/i)).toBeInTheDocument();
    expect(screen.queryByText('https://app.example.com/billing')).not.toBeInTheDocument();
  });

  it('expands to reveal device context and privacy notice on click', () => {
    render(<ContextDisclosure context={mockContext} />);

    const button = screen.getByRole('button', { name: /Diagnostic metadata included/i });
    fireEvent.click(button);

    expect(screen.getByText('https://app.example.com/billing')).toBeInTheDocument();
    expect(screen.getByText('Chrome 128')).toBeInTheDocument();
    expect(screen.getByText('Windows 11')).toBeInTheDocument();
    expect(screen.getByText(/Privacy Guarantee/i)).toBeInTheDocument();
  });
});
