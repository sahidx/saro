// Grading and GPA Calculation Utilities
// For production use in exam result calculations

/**
 * Calculate GPA based on percentage score
 */
export function calculateGPA(percentage: number): number {
  if (percentage >= 90) return 5.0;
  if (percentage >= 85) return 4.5;
  if (percentage >= 80) return 4.0;
  if (percentage >= 75) return 3.5;
  if (percentage >= 70) return 3.0;
  if (percentage >= 65) return 2.5;
  if (percentage >= 60) return 2.0;
  if (percentage >= 55) return 1.5;
  if (percentage >= 50) return 1.0;
  return 0.0;
}

/**
 * Get letter grade from GPA
 */
export function getGradeFromGPA(gpa: number): string {
  if (gpa >= 5.0) return 'A+';
  if (gpa >= 4.5) return 'A';
  if (gpa >= 4.0) return 'A-';
  if (gpa >= 3.5) return 'B+';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.5) return 'B-';
  if (gpa >= 2.0) return 'C+';
  if (gpa >= 1.5) return 'C';
  if (gpa >= 1.0) return 'D';
  return 'F';
}

/**
 * Get grade description in Bengali
 */
export function getGradeDescriptionBengali(grade: string): string {
  const descriptions: Record<string, string> = {
    'A+': 'অসাধারণ',
    'A': 'চমৎকার', 
    'A-': 'খুব ভাল',
    'B+': 'ভাল',
    'B': 'মোটামুটি ভাল',
    'B-': 'গড়ের উপরে',
    'C+': 'গড়',
    'C': 'চলনসই',
    'D': 'দুর্বল',
    'F': 'অকৃতকার্য'
  };
  return descriptions[grade] || 'অজানা';
}

/**
 * Calculate class position based on GPA
 */
export function calculateClassPosition(studentGPA: number, allGPAs: number[]): number {
  const sortedGPAs = [...allGPAs].sort((a, b) => b - a);
  return sortedGPAs.indexOf(studentGPA) + 1;
}