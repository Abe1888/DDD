'use client';

import React, { memo, useMemo, useRef, useCallback } from 'react';
import { useVirtualScrolling } from '@/lib/utils/performanceOptimizer';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

/**
 * High-performance virtualized list component for rendering large datasets
 * Only renders visible items to maintain smooth scrolling performance
 */
function VirtualizedList<T>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem, 
  className = '',
  overscan = 5
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan * 2
    );
    
    const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }));
    
    return {
      visibleItems,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(VirtualizedList) as typeof VirtualizedList;