import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onUploadClick: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onUploadClick,
  activeSection,
  onNavigate
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'upload') {
      onUploadClick();
    } else {
      onNavigate(sectionId);
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'upload', label: 'Upload PDF' },
    { id: 'plan', label: 'Rescue Plan' },
    { id: 'learn', label: 'Topic Learning' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'progress', label: 'Progress' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 bg-[#08110F]/90 backdrop-blur-md border-b border-[#294238]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <button
          id="nav-brand-btn"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 text-left focus:outline-none cursor-pointer"
        >
          <span className="text-lg sm:text-xl font-bold tracking-tight text-[#F2F7F3]">
            Exam Rescue <span className="text-[#BFE8C8]">AI</span>
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0D1916] p-1 rounded-xl border border-[#294238]">
          {navItems.map((item) => {
            const isCurrent = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}-btn`}
                onClick={() => handleNavClick(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? 'text-[#08110F] bg-[#BFE8C8]'
                    : 'text-[#AEBDB4] hover:text-[#F2F7F3] hover:bg-[#12211D]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#AEBDB4] hover:text-[#F2F7F3] hover:bg-[#12211D] rounded-xl border border-[#294238] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#F2F7F3]" /> : <Menu className="w-5 h-5 text-[#F2F7F3]" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 pt-2 pb-2 border-t border-[#294238] space-y-1 bg-[#0D1916] rounded-xl p-2"
          >
            {navItems.map((item) => {
              const isCurrent = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}-btn`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'text-[#08110F] bg-[#BFE8C8] font-bold'
                      : 'text-[#AEBDB4] hover:text-[#F2F7F3] hover:bg-[#172A24]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
