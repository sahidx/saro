import { useEffect } from 'react';
import { useLocation } from 'wouter';

// This component redirects to the new StudentHome page
// The old tab-based dashboard has been replaced with separate pages
export default function StudentDashboard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/student');
  }, [setLocation]);

  return null;
}
