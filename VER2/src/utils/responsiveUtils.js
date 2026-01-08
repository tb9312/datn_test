// utils/responsiveUtils.js
import { useState, useEffect } from 'react';

// Custom hook để theo dõi kích thước màn hình
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 576,
    isTablet: window.innerWidth >= 576 && window.innerWidth < 992,
    isDesktop: window.innerWidth >= 992,
    isLargeDesktop: window.innerWidth >= 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 576,
        isTablet: window.innerWidth >= 576 && window.innerWidth < 992,
        isDesktop: window.innerWidth >= 992,
        isLargeDesktop: window.innerWidth >= 1200,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

// Hàm helper để xác định số lượng items hiển thị
export const getDisplayCount = (isMobile, isTablet, defaultCount = 5) => {
  if (isMobile) return 3;
  if (isTablet) return 4;
  return defaultCount;
};

// Hàm helper để xác định modal width
export const getModalWidth = (isMobile, isTablet, isLargeDesktop) => {
  if (isMobile) return '95%';
  if (isTablet) return '85%';
  if (isLargeDesktop) return 800;
  return 700;
};

// Hàm helper để xác định grid columns
export const getGridColumns = (isMobile, isTablet, isDesktop, isLargeDesktop) => {
  if (isMobile) return 1;
  if (isTablet) return 2;
  if (isDesktop) return 3;
  if (isLargeDesktop) return 4;
  return 3;
};

// Hàm helper để format số liệu dựa trên màn hình
export const formatNumber = (num, isMobile) => {
  if (isMobile && num > 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toLocaleString();
};

// Hàm helper để xác định kích thước ảnh avatar
export const getAvatarSize = (isMobile, isTablet) => {
  if (isMobile) return 'small';
  if (isTablet) return 'default';
  return 'large';
};