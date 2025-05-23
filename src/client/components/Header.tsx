import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="app-header__container">
        <a href="/" className="app-header__logo">
          <span className="app-header__logo-icon">🐾</span>
          <span className="app-header__logo-text">PetBnB</span>
        </a>
        <nav className="app-header__nav">
          <a href="/search" className="app-header__link">Find Sitters</a>
          <a href="/become-sitter" className="app-header__link">Become a Sitter</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;