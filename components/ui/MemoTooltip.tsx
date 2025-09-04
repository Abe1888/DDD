'use client';

import React, { useState, memo } from 'react';
import { FileText, X, Info, ExternalLink } from 'lucide-react';

interface MemoTooltipProps {
  className?: string;
}

const MemoTooltip: React.FC<MemoTooltipProps> = memo(({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const memoContent = `የተከላ ዝግጅት መመሪያ ለደንበኞች 
ለጂፒኤስ ትራኪንግ ተከላ ስራው በተቀላጠፈ እና ውጤታማ በሆነ መንገድ እንዲከናወን ከዚህ በታች የተዘረዘሩትን ቅድመ ዝግጅቶች ደንበኞች እንዲያሟሉልን በአክብሮት እንጠይቃለን።

አስፈላጊ ቁሳቁሶች እና ሁኔታዎች:
• የነዳጅ ማፍሰሻ ሳፋ: ነዳጅን ከታንከር ለማፍሰስ ለማዘዋወር የሚያገለግል ንፁህ ሳፋ።
• በቂ ባዶ በርሚሎች: ከተሽከርካሪው ታንከር የሚወጣውን ነዳጅ በሙሉ መያዝ የሚችሉ በቂ እና ንፁህ ባዶ በርሚሎች።
• የመጫኛ ቦታ (ጋራዥ): ተሽከርካሪዎቹ በምቾት የሚቆሙበት። የነዳጅ ታንከሩን ለማውረድ እንዲያመች "ገደል" ወይም ከፍ ያለ ቦታ ያለው ቢሆን ይመረጣል።
• መካኒኮች: እንደ አስፈላጊነቱ የተሽከርካሪውን የነዳጅ ታንከር ለማውረድ እና ለመግጠም የሚረዱ ባለሙያዎች።
• ለካሊብሬሽን የሚሆን ነዳጅ: የተከላው ሂደት ሲጠናቀቅ የነዳጅ (fuel level sensor) ለማስተካከል (calibrate) የሚያገለግል በበርሚል የተዘጋጀ ነዳጅ።
• የኤሌክትሪክ ኃይል: በተከላው ቦታ የኤሌክትሪክ ኃይል መኖሩን እና በቀላሉ ጥቅም ላይ ሊውል የሚችል ማራዘሚያ ገመድ መኖሩን ማረጋገጥ።

የስራ ሂደት እና ድጋፍ:
• የተሽከርካሪዎች መገኘት: ተከላው የሚካሄድባቸው ተሽከርካሪዎች አስቀድመው በተከላው ቦታ መገኘት አለባቸው።
• የስራ አስተባባሪ: ከተከላ ቡድኑ ጋር በመሆን ስራውን የሚያስተባብር እና አስፈላጊውን ድጋፍ የሚሰጥ ከደንበኛው በኩል የተመደበ አንድ ሰው።
• ለሰራተኞች የሚደረግ ድጋፍ: ለተከላ ቡድኑ የጠዋት፣ የምሳ እና ማታ የትራንስፖርት አገልግሎት (ሰርቪስ) ማመቻቸት።
• የተሽከርካሪዎች ብዛት: ስራውን በተያዘለት እቅድ መሰረት ለማጠናቀቅ በቀን ቢያንስ 3 ተሽከርካሪዎችን ለተከላ ዝግጁ ማድረግ።

እነዚህን ቅድመ ዝግጅቶች ማሟላት የተከላውን ሂደት ፈጣን፣ ደህንነቱ የተጠበቀ እና ስኬታማ እንዲሆን ያደርጋል። ስለ ትብብርዎ እናመሰግናለን!

Services Provider Name: 'TRANSLINK SOLUTIONS PLC'`;

  return (
    <div className={`relative ${className}`}>
      {/* Tooltip Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        aria-label="View installation guidelines"
        title="Installation Guidelines"
      >
        <FileText className="w-5 h-5" />
      </button>

      {/* Tooltip Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip Panel */}
          <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-slide-up">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <div>
                    <h3 className="text-sm font-semibold">Installation Guidelines</h3>
                    <p className="text-xs text-blue-100">TRANSLINK SOLUTIONS PLC</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {memoContent}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  Installation preparation guidelines
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>Close</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

MemoTooltip.displayName = 'MemoTooltip';

export default MemoTooltip;