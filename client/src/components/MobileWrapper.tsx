import React from 'react';

interface MobileWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileWrapper: React.FC<MobileWrapperProps> = ({ children, className = "" }) => {
  return (
    <div className={`
      mobile-dashboard-wrapper 
      emergency-mobile-content
      w-full 
      max-w-full 
      min-h-screen 
      box-border 
      overflow-x-hidden
      ${className}
    `}>
      <style>{`
        /* Emergency Mobile Override */
        .mobile-emergency-override * {
          box-sizing: border-box !important;
        }
        
        .mobile-emergency-override {
          width: 100% !important;
          max-width: 100vw !important;
          padding: 8px !important;
          margin: 0 !important;
          overflow-x: hidden !important;
        }
        
        @media (min-width: 640px) {
          .mobile-emergency-override {
            padding: 16px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .mobile-emergency-override {
            padding: 24px !important;
          }
        }
        
        .mobile-emergency-override .mobile-card-fix {
          width: 100% !important;
          margin: 8px 0 !important;
          padding: 16px !important;
          box-sizing: border-box !important;
        }
        
        .mobile-emergency-override .mobile-grid-fix {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 16px !important;
          width: 100% !important;
        }
        
        @media (min-width: 640px) {
          .mobile-emergency-override .mobile-grid-fix {
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .mobile-emergency-override .mobile-grid-fix {
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 24px !important;
          }
        }
        
        .mobile-emergency-override .mobile-heading-fix {
          font-size: 18px !important;
          font-weight: 700 !important;
          line-height: 1.3 !important;
          margin-bottom: 12px !important;
        }
        
        @media (min-width: 640px) {
          .mobile-emergency-override .mobile-heading-fix {
            font-size: 22px !important;
            margin-bottom: 16px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .mobile-emergency-override .mobile-heading-fix {
            font-size: 28px !important;
            margin-bottom: 20px !important;
          }
        }
        
        .mobile-emergency-override .mobile-button-fix {
          width: 100% !important;
          min-height: 48px !important;
          padding: 12px 16px !important;
          font-size: 16px !important;
          touch-action: manipulation !important;
        }
        
        @media (min-width: 640px) {
          .mobile-emergency-override .mobile-button-fix {
            width: auto !important;
            min-width: 120px !important;
          }
        }
        
        .mobile-emergency-override .mobile-tabs-fix {
          display: flex !important;
          width: 100% !important;
          overflow-x: auto !important;
          gap: 4px !important;
          padding: 8px 0 !important;
          scrollbar-width: none !important;
        }
        
        .mobile-emergency-override .mobile-tabs-fix::-webkit-scrollbar {
          display: none !important;
        }
        
        .mobile-emergency-override .mobile-tab-fix {
          min-width: 80px !important;
          height: 44px !important;
          padding: 8px 12px !important;
          font-size: 13px !important;
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-direction: column !important;
          gap: 2px !important;
        }
        
        @media (min-width: 640px) {
          .mobile-emergency-override .mobile-tab-fix {
            min-width: 100px !important;
            height: 48px !important;
            padding: 10px 16px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
      <div className="mobile-emergency-override">
        {children}
      </div>
    </div>
  );
};

export default MobileWrapper;
