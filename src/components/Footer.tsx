import React from 'react';

interface FooterProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onUploadClick,
  onNavigate
}) => {
  return (
    <footer className="border-t border-[#294238] bg-[#08110F] text-[#AEBDB4] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-bold text-[#F2F7F3]">
            Exam Rescue <span className="text-[#BFE8C8]">AI</span>
          </span>
          <span className="mx-2 text-[#7F9188]">•</span>
          <span className="text-[#7F9188]">Personalized emergency exam preparation</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('hero')}
            className="hover:text-[#F2F7F3] transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={onUploadClick}
            className="hover:text-[#BFE8C8] transition-colors cursor-pointer"
          >
            Upload PDF
          </button>
          <button
            onClick={() => onNavigate('rescue-plan-section')}
            className="hover:text-[#F2F7F3] transition-colors cursor-pointer"
          >
            Rescue Plan
          </button>
          <button
            onClick={() => onNavigate('progress-section')}
            className="hover:text-[#F2F7F3] transition-colors cursor-pointer"
          >
            Progress
          </button>
        </div>
      </div>
    </footer>
  );
};
