import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CategorySelector from '../features/feedback/components/CategorySelector.jsx';
import { FEEDBACK_CATEGORIES } from '../features/feedback/utils/constants.js';

describe('CategorySelector Component', () => {
  it('renders all 5 categories from constants', () => {
    render(<CategorySelector selectedCategory="bug" onSelectCategory={() => {}} />);

    FEEDBACK_CATEGORIES.forEach((cat) => {
      expect(screen.getByText(cat.label)).toBeInTheDocument();
    });
  });

  it('triggers onSelectCategory when clicked', () => {
    const handleSelect = vi.fn();
    render(<CategorySelector selectedCategory="bug" onSelectCategory={handleSelect} />);

    const uiTile = screen.getByText('UI / UX Issue');
    fireEvent.click(uiTile);

    expect(handleSelect).toHaveBeenCalledWith('ui_ux');
  });

  it('sets aria-checked true for the currently active category', () => {
    render(<CategorySelector selectedCategory="feature_request" onSelectCategory={() => {}} />);

    const buttons = screen.getAllByRole('radio');
    const featureButton = buttons.find((btn) => btn.textContent.includes('Feature Request'));

    expect(featureButton).toHaveAttribute('aria-checked', 'true');
  });
});
