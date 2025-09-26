import { useState, useEffect } from 'react';

// Helper function to get formatted time ago with dynamic precision (client-side)
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 10) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInMinutes === 1) return '1 min ago';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours === 1) return '1h ago';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
}

// Hook to provide dynamic time updates
export function useDynamicTime(initialDate: Date | string, updateInterval: number = 30000) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  useEffect(() => {
    const date = typeof initialDate === 'string' ? new Date(initialDate) : initialDate;
    
    // Update time immediately
    const updateTime = () => {
      setTimeAgo(getTimeAgo(date));
    };
    
    updateTime(); // Initial update
    
    // Set up interval for dynamic updates
    const interval = setInterval(updateTime, updateInterval);
    
    return () => clearInterval(interval);
  }, [initialDate, updateInterval]);
  
  return timeAgo;
}

// Hook for multiple activities with dynamic timestamps
export function useDynamicActivities(activities: any[], updateInterval: number = 30000) {
  const [dynamicActivities, setDynamicActivities] = useState(activities);
  
  useEffect(() => {
    const updateActivities = () => {
      setDynamicActivities(prev => 
        prev.map(activity => ({
          ...activity,
          time: getTimeAgo(new Date(activity.createdAt || activity.timestamp || Date.now()))
        }))
      );
    };
    
    updateActivities(); // Initial update
    
    // Set up interval for dynamic updates
    const interval = setInterval(updateActivities, updateInterval);
    
    return () => clearInterval(interval);
  }, [activities, updateInterval]);
  
  return dynamicActivities;
}
