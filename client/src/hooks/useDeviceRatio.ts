import { useState, useEffect } from 'react';

interface DeviceRatio {
  width: number;
  height: number;
  ratio: number;
  batteryLevel: number;
  maxIconsPerRow: number;
  iconSize: 'small' | 'medium' | 'large';
  shouldUseHorizontalScroll: boolean;
}

export function useDeviceRatio() {
  const [deviceRatio, setDeviceRatio] = useState<DeviceRatio>({
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: 100,
    batteryLevel: 100,
    maxIconsPerRow: 4,
    iconSize: 'medium',
    shouldUseHorizontalScroll: false
  });

  const calculateRatio = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    
    // Calculate battery level from device info if available
    let batteryLevel = 100;
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryLevel = Math.round(battery.level * 100);
      }).catch(() => {
        // Fallback battery calculation based on screen ratio
        batteryLevel = Math.max(70, Math.min(100, Math.round(aspectRatio * 120)));
      });
    } else {
      // Fallback battery calculation based on screen dimensions
      batteryLevel = Math.max(70, Math.min(100, Math.round(aspectRatio * 120)));
    }

    // FIXED: Calculate icons based on actual container space needed for all 8 icons
    let maxIconsPerRow = 4; // default
    let iconSize: 'small' | 'medium' | 'large' = 'medium';
    let shouldUseHorizontalScroll = true; // Always enable scroll to ensure all icons are accessible

    // Calculate container width accounting for padding
    const containerPadding = 32; // 16px each side
    const availableWidth = width - containerPadding;
    
    // Icon dimensions: 48px width + 8px gap between icons
    const iconWidth = 48;
    const iconGap = 8;
    const totalIconSpace = iconWidth + iconGap;
    
    // Calculate how many icons actually fit in available space
    const fittableIcons = Math.floor(availableWidth / totalIconSpace);
    
    // Ensure we can fit all 8 teacher icons or 7 student icons with scroll
    if (width >= 480) {
      maxIconsPerRow = Math.min(8, Math.max(5, fittableIcons));
      iconSize = 'large';
    } else if (width >= 400) {
      maxIconsPerRow = Math.min(6, Math.max(4, fittableIcons));
      iconSize = 'medium';
    } else if (width >= 320) {
      maxIconsPerRow = Math.min(5, Math.max(3, fittableIcons));
      iconSize = 'small';
    } else {
      maxIconsPerRow = Math.max(3, fittableIcons);
      iconSize = 'small';
    }

    return {
      width,
      height,
      ratio: batteryLevel,
      batteryLevel,
      maxIconsPerRow,
      iconSize,
      shouldUseHorizontalScroll
    };
  };

  useEffect(() => {
    const updateRatio = () => {
      setDeviceRatio(calculateRatio());
    };

    updateRatio(); // Initial calculation
    
    window.addEventListener('resize', updateRatio);
    window.addEventListener('orientationchange', updateRatio);

    // Update ratio every 30 seconds to simulate battery changes
    const interval = setInterval(updateRatio, 30000);

    return () => {
      window.removeEventListener('resize', updateRatio);
      window.removeEventListener('orientationchange', updateRatio);
      clearInterval(interval);
    };
  }, []);

  return deviceRatio;
}
