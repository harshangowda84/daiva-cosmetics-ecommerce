import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface FloatingCartPillProps {
  onNavigate?: (page: string, param?: string) => void;
}

export const FloatingCartPill: React.FC<FloatingCartPillProps> = ({ onNavigate }) => {
  const { totalItemsCount, subtotal, isCartDrawerOpen, setIsCartDrawerOpen } = useCart();

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'center' | 'right'>('center');
  const [isHovered, setIsHovered] = useState(false);
  const [badgeBump, setBadgeBump] = useState(false);

  const prevCountRef = useRef(totalItemsCount);
  const isFirstRender = useRef(true);
  const timerRef = useRef<any>(null);

  // Clear timer helper
  const clearSlideTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start 3-second timer to glide to right side
  const startSlideTimer = () => {
    clearSlideTimer();
    timerRef.current = setTimeout(() => {
      setPosition('right');
    }, 3000);
  };

  // Listen for cart additions
  useEffect(() => {
    // Avoid showing on first mount if cart already had items from previous session
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevCountRef.current = totalItemsCount;
      return;
    }

    if (totalItemsCount > prevCountRef.current) {
      // Product was added to cart or quantity increased!
      setIsVisible(true);
      setPosition('center');
      setBadgeBump(true);
      setTimeout(() => setBadgeBump(false), 300);

      // Start 3-second timer to glide to right
      startSlideTimer();
    } else if (totalItemsCount === 0) {
      // Cart emptied completely
      setIsVisible(false);
      clearSlideTimer();
    }

    prevCountRef.current = totalItemsCount;
  }, [totalItemsCount]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearSlideTimer();
  }, []);

  // When hovering in center, pause timer so it doesn't fly away while the user is clicking
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (position === 'center') {
      clearSlideTimer();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (position === 'center' && isVisible) {
      startSlideTimer();
    }
  };

  const handleOpenCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCartDrawerOpen(true);
    if (onNavigate) {
      // Keep cart drawer open
    }
  };

  // Do not render if not yet triggered, or cart empty, or cart drawer is currently open
  if (!isVisible || totalItemsCount === 0 || isCartDrawerOpen) {
    return null;
  }

  const isRight = position === 'right';
  const isCollapsed = isRight && !isHovered;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleOpenCart}
      style={{
        left: isRight ? 'calc(100% - 24px)' : '50%',
        transform: isRight ? 'translateX(-100%)' : 'translateX(-50%)',
        width: isCollapsed ? '56px' : '335px',
        transition:
          'left 650ms cubic-bezier(0.25, 1, 0.5, 1), transform 650ms cubic-bezier(0.25, 1, 0.5, 1), width 400ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 300ms ease, opacity 250ms ease',
      }}
      className={`fixed bottom-6 z-40 h-14 bg-[#231F20] text-white rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.38)] border border-neutral-700/50 select-none overflow-hidden cursor-pointer flex items-center ${
        isCollapsed ? 'justify-center p-0' : 'px-3 justify-between'
      }`}
      title={isCollapsed ? `View Bag (${totalItemsCount} items)` : undefined}
    >
      {/* Collapsed Round Icon View on Right */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          isCollapsed ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
        }`}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <ShoppingBag className="w-5 h-5 text-white" />
          <span
            className={`absolute top-2.5 right-2.5 min-w-[18px] h-[18px] px-1 bg-[#E11D48] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs border border-[#231F20] transition-transform duration-200 ${
              badgeBump ? 'scale-125' : 'scale-100'
            }`}
          >
            {totalItemsCount}
          </span>
        </div>
      </div>

      {/* Expanded Pill View (in Center OR on Right Hover) */}
      <div
        className={`flex items-center justify-between w-full gap-2.5 transition-all duration-300 ${
          !isCollapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Red Circle Badge + Item Count & Subtotal */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-[38px] h-[38px] rounded-full bg-[#E11D48] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs transition-transform duration-200 ${
              badgeBump ? 'scale-125' : 'scale-100'
            }`}
          >
            {totalItemsCount}
          </div>
          <div className="min-w-0 pr-1">
            <p className="text-[13px] font-medium leading-tight text-white truncate">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in Bag
            </p>
            <p className="text-[14px] font-bold text-[#F5B031] leading-tight">
              ₹{subtotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Separator line */}
        <div className="h-6 w-px bg-neutral-700/80 shrink-0 mx-0.5" />

        {/* Right: View Bag White Pill Button */}
        <button
          type="button"
          onClick={handleOpenCart}
          className="px-4 py-2 rounded-full bg-white text-[#18181b] hover:bg-neutral-100 text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <span>View Bag</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-900" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
