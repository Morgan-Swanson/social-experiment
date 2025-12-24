import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />);
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should accept text input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('should handle onChange events', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<Input onChange={handleChange} placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'a');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should render with different types', () => {
    render(<Input type="email" placeholder="Email" />);
    
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render password type', () => {
    render(<Input type="password" placeholder="Password" />);
    
    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should be disabled when disabled prop is passed', () => {
    render(<Input disabled placeholder="Disabled" />);
    
    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<Input className="custom-class" placeholder="Custom" />);
    
    const input = screen.getByPlaceholderText('Custom');
    expect(input).toHaveClass('custom-class');
  });

  it('should have default styling classes', () => {
    render(<Input placeholder="Styled" />);
    
    const input = screen.getByPlaceholderText('Styled');
    expect(input).toHaveClass('flex');
    expect(input).toHaveClass('h-9');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
  });

  it('should forward ref to input element', () => {
    const ref = { current: null };
    render(<Input ref={ref} placeholder="Ref Input" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('should accept value prop for controlled input', () => {
    render(<Input value="Controlled" onChange={() => {}} placeholder="Controlled" />);
    
    const input = screen.getByPlaceholderText('Controlled');
    expect(input).toHaveValue('Controlled');
  });
});