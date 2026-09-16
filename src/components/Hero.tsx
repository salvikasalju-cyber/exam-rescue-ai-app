import React from 'react';
import { Upload, Play } from 'lucide-react';

interface HeroProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onUploadClick, onDemoClick }) => {
  return (
    <section id="hero" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F2F7F3]">
          Exam Rescue <span className="text-[#BFE8C8]">AI</span>
        </h1>

        <p className="text-base sm:text-lg text-[#AEBDB4] max-w-xl mx-auto leading-relaxed">
          Upload your study material to generate a personalized rescue plan and active recall quiz before your exam.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="hero-upload-pdf-btn"
            onClick={onUploadClick}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-[#08110F] bg-[#BFE8C8] hover:bg-[#D9F3DE] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#08110F]" />
            <span>Upload PDF</span>
          </button>

          <button
            id="hero-try-demo-btn"
            onClick={onDemoClick}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-[#F2F7F3] hover:text-[#BFE8C8] bg-[#12211D] hover:bg-[#172A24] border border-[#294238] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 text-[#8FD3A2]" />
            <span>Try Demo</span>
          </button>
        </div>
      </div>
    </section>
  );
};
