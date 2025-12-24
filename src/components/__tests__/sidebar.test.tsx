import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../sidebar';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('should render the logo', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Experiment')).toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Classifiers')).toBeInTheDocument();
    expect(screen.getByText('Constraints')).toBeInTheDocument();
    expect(screen.getByText('Studies')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('should render navigation links with correct hrefs', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Data').closest('a')).toHaveAttribute('href', '/dashboard/data');
    expect(screen.getByText('Classifiers').closest('a')).toHaveAttribute('href', '/dashboard/classifiers');
    expect(screen.getByText('Constraints').closest('a')).toHaveAttribute('href', '/dashboard/constraints');
    expect(screen.getByText('Studies').closest('a')).toHaveAttribute('href', '/dashboard/study');
    expect(screen.getByText('Account').closest('a')).toHaveAttribute('href', '/dashboard/account');
  });

  it('should highlight active navigation item for /dashboard/data', () => {
    mockUsePathname.mockReturnValue('/dashboard/data');
    render(<Sidebar />);
    
    const dataLink = screen.getByText('Data').closest('a');
    expect(dataLink).toHaveClass('bg-primary');
  });

  it('should highlight active navigation item for /dashboard/classifiers', () => {
    mockUsePathname.mockReturnValue('/dashboard/classifiers');
    render(<Sidebar />);
    
    const classifiersLink = screen.getByText('Classifiers').closest('a');
    expect(classifiersLink).toHaveClass('bg-primary');
  });

  it('should highlight active navigation item for nested routes', () => {
    mockUsePathname.mockReturnValue('/dashboard/data/123/view');
    render(<Sidebar />);
    
    const dataLink = screen.getByText('Data').closest('a');
    expect(dataLink).toHaveClass('bg-primary');
  });

  it('should render version number', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Version 0.1.0')).toBeInTheDocument();
  });

  it('should not highlight non-active items', () => {
    mockUsePathname.mockReturnValue('/dashboard/data');
    render(<Sidebar />);
    
    const classifiersLink = screen.getByText('Classifiers').closest('a');
    expect(classifiersLink).not.toHaveClass('bg-primary');
    expect(classifiersLink).toHaveClass('text-muted-foreground');
  });
});