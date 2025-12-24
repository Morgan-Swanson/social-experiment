import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders correctly', () => {
    render(<Switch />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('can be checked and unchecked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<Switch onCheckedChange={handleChange} />);
    const switchElement = screen.getByRole('switch');
    
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    
    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('respects controlled checked state', () => {
    const { rerender } = render(<Switch checked={false} />);
    const switchElement = screen.getByRole('switch');
    
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    
    rerender(<Switch checked={true} />);
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('can be disabled', () => {
    render(<Switch disabled />);
    const switchElement = screen.getByRole('switch');
    
    expect(switchElement).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Switch className="custom-class" />);
    const switchElement = screen.getByRole('switch');
    
    expect(switchElement).toHaveClass('custom-class');
  });
});