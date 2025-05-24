import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../../src/client/components/Header';

describe('Header component', () => {
  it('renders the PetBnB logo text', () => {
    render(<Header />);
    const logoText = screen.getByText('PetBnB');
    expect(logoText).toBeDefined();
  });

  it('renders the paw emoji icon', () => {
    render(<Header />);
    const logoIcon = screen.getByText('🐾');
    expect(logoIcon).toBeDefined();
  });

  it('renders navigation links', () => {
    render(<Header />);
    const findSittersLink = screen.getByText('Find Sitters');
    const becomeSitterLink = screen.getByText('Become a Sitter');
    
    expect(findSittersLink).toBeDefined();
    expect(becomeSitterLink).toBeDefined();
  });
});