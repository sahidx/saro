import { useDynamicActivities } from '@/hooks/useDynamicTime';

interface Activity {
  type: string;
  message: string;
  time: string;
  icon: string;
  createdAt?: string;
  timestamp?: string;
}

interface DynamicActivitiesListProps {
  activities: Activity[];
  isDarkMode?: boolean;
}

export function DynamicActivitiesList({ activities, isDarkMode }: DynamicActivitiesListProps) {
  const dynamicActivities = useDynamicActivities(activities, 10000); // Update every 10 seconds
  
  return (
    <>
      {dynamicActivities.map((activity, index) => (
        <div key={index} className="flex items-center space-x-3 animate-in slide-in-from-left duration-200" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full shadow-lg animate-pulse"></div>
          <span className={`${isDarkMode ? 'text-foreground' : 'text-foreground'} text-sm font-medium flex-1`}>
            <span className="mr-2">{activity.icon}</span>
            {activity.message}
          </span>
          <span className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} text-xs font-bold px-2 py-1 rounded-md ${
            isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
          } min-w-[60px] text-center shadow-sm`}>
            {activity.time}
          </span>
        </div>
      ))}
    </>
  );
}
