'use client';

import React, { useState, useEffect, memo } from 'react';
import { FileText, X, CheckCircle2, ArrowRight, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface MemoFlashcardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  className?: string;
}

const MemoFlashcard: React.FC<MemoFlashcardProps> = memo(({ 
  isOpen, 
  onClose, 
  onComplete,
  className = '' 
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [hasReadAll, setHasReadAll] = useState(false);

  const memoSections = [
    {
      title: "የተከላ ዝግጅት መመሪያ ለደንበኞች",
      subtitle: "Installation Preparation Guidelines for Customers",
      content: `ለጂፒኤስ ትራኪንግ ተከላ ስራው በተቀላጠፈ እና ውጤታማ በሆነ መንገድ እንዲከናወን ከዚህ በታች የተዘረዘሩትን ቅድመ ዝግጅቶች ደንበኞች እንዲያሟሉልን በአክብሮት እንጠይቃለን።`,
      type: "intro"
    },
    {
      title: "አስፈላጊ ቁሳቁሶች እና ሁኔታዎች",
      subtitle: "Required Materials and Conditions",
      content: `• የነዳጅ ማፍሰሻ ሳፋ: ነዳጅን ከታንከር ለማፍሰስ ለማዘዋወር የሚያገለግል ንፁህ ሳፋ።

• በቂ ባዶ በርሚሎች: ከተሽከርካሪው ታንከር የሚወጣውን ነዳጅ በሙሉ መያዝ የሚችሉ በቂ እና ንፁህ ባዶ በርሚሎች።

• የመጫኛ ቦታ (ጋራዥ): ተሽከርካሪዎቹ በምቾት የሚቆሙበት። የነዳጅ ታንከሩን ለማውረድ እንዲያመች "ገደል" ወይም ከፍ ያለ ቦታ ያለው ቢሆን ይመረጣል።

• መካኒኮች: እንደ አስፈላጊነቱ የተሽከርካሪውን የነዳጅ ታንከር ለማውረድ እና ለመግጠም የሚረዱ ባለሙያዎች።

• ለካሊብሬሽን የሚሆን ነዳጅ: የተከላው ሂደት ሲጠናቀቅ የነዳጅ (fuel level sensor) ለማስተካከል (calibrate) የሚያገለግል በበርሚል የተዘጋጀ ነዳጅ።

• የኤሌክትሪክ ኃይል: በተከላው ቦታ የኤሌክትሪክ ኃይል መኖሩን እና በቀላሉ ጥቅም ላይ ሊውል የሚችል ማራዘሚያ ገመድ መኖሩን ማረጋገጥ።`,
      type: "materials"
    },
    {
      title: "የስራ ሂደት እና ድጋፍ",
      subtitle: "Work Process and Support",
      content: `• የተሽከርካሪዎች መገኘት: ተከላው የሚካሄድባቸው ተሽከርካሪዎች አስቀድመው በተከላው ቦታ መገኘት አለባቸው።

• የስራ አስተባባሪ: ከተከላ ቡድኑ ጋር በመሆን ስራውን የሚያስተባብር እና አስፈላጊውን ድጋፍ የሚሰጥ ከደንበኛው በኩል የተመደበ አንድ ሰው።

• ለሰራተኞች የሚደረግ ድጋፍ: ለተከላ ቡድኑ የጠዋት፣ የምሳ እና ማታ የትራንስፖርት አገልግሎት (ሰርቪስ) ማመቻቸት።

• የተሽከርካሪዎች ብዛት: ስራውን በተያዘለት እቅድ መሰረት ለማጠናቀቅ በቀን ቢያንስ 3 ተሽከርካሪዎችን ለተከላ ዝግጁ ማድረግ።`,
      type: "process"
    },
    {
      title: "ማጠቃለያ",
      subtitle: "Summary",
      content: `እነዚህን ቅድመ ዝግጅቶች ማሟላት የተከላውን ሂደት ፈጣን፣ ደህንነቱ የተጠበቀ እና ስኬታማ እንዲሆን ያደርጋል። ስለ ትብብርዎ እናመሰግናለን!

Services Provider Name: 'TRANSLINK SOLUTIONS PLC'

These preparations ensure the installation process is fast, safe, and successful. Thank you for your cooperation!`,
      type: "summary"
    }
  ];

  const nextSection = () => {
    if (currentSection < memoSections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setHasReadAll(true);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'intro':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'materials':
        return <Info className="w-6 h-6 text-green-600" />;
      case 'process':
        return <CheckCircle2 className="w-6 h-6 text-purple-600" />;
      case 'summary':
        return <ArrowRight className="w-6 h-6 text-orange-600" />;
      default:
        return <FileText className="w-6 h-6 text-slate-600" />;
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'intro':
        return 'from-blue-600 to-blue-700';
      case 'materials':
        return 'from-green-600 to-green-700';
      case 'process':
        return 'from-purple-600 to-purple-700';
      case 'summary':
        return 'from-orange-600 to-orange-700';
      default:
        return 'from-slate-600 to-slate-700';
    }
  };

  if (!isOpen) return null;

  const currentMemo = memoSections[currentSection];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-up ${className}`}>
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${getSectionColor(currentMemo.type)} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getSectionIcon(currentMemo.type)}
              <div>
                <h2 className="text-xl font-bold">{currentMemo.title}</h2>
                <p className="text-sm text-white text-opacity-90">{currentMemo.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-white text-opacity-90">
                {currentSection + 1} of {memoSections.length}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors"
                aria-label="Close memo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-200 h-1">
          <div 
            className={`h-1 bg-gradient-to-r ${getSectionColor(currentMemo.type)} transition-all duration-500`}
            style={{ width: `${((currentSection + 1) / memoSections.length) * 100}%` }}
          ></div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-line text-slate-700 leading-relaxed">
              {currentMemo.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-sm text-slate-600">
                TRANSLINK SOLUTIONS PLC
              </div>
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              <div className="text-sm text-slate-600">
                Installation Guidelines
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Previous Button */}
              <button
                onClick={prevSection}
                disabled={currentSection === 0}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Next/Complete Button */}
              {hasReadAll ? (
                <button
                  onClick={handleComplete}
                  className="btn-success flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Continue to Dashboard</span>
                </button>
              ) : currentSection === memoSections.length - 1 ? (
                <button
                  onClick={() => setHasReadAll(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Read</span>
                </button>
              ) : (
                <button
                  onClick={nextSection}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MemoFlashcard.displayName = 'MemoFlashcard';

export default MemoFlashcard;