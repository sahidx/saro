/**
 * GPA and Grading System for Coach Manager
 * Calculates GPA, grades, and points based on percentages
 */

export interface GradeInfo {
  percentage: number;
  letterGrade: string;
  gpa: number;
  points: number;
  color: string;
  description: string;
}

/**
 * Bangladesh HSC/SSC Grading System
 */
export const getGradeInfo = (percentage: number): GradeInfo => {
  if (percentage >= 80) {
    return {
      percentage,
      letterGrade: 'A+',
      gpa: 5.0,
      points: 5,
      color: 'text-green-600 bg-green-100',
      description: 'Outstanding'
    };
  } else if (percentage >= 70) {
    return {
      percentage,
      letterGrade: 'A',
      gpa: 4.0,
      points: 4,
      color: 'text-blue-600 bg-blue-100',
      description: 'Excellent'
    };
  } else if (percentage >= 60) {
    return {
      percentage,
      letterGrade: 'A-',
      gpa: 3.5,
      points: 3.5,
      color: 'text-cyan-600 bg-cyan-100',
      description: 'Very Good'
    };
  } else if (percentage >= 50) {
    return {
      percentage,
      letterGrade: 'B',
      gpa: 3.0,
      points: 3,
      color: 'text-yellow-600 bg-yellow-100',
      description: 'Good'
    };
  } else if (percentage >= 40) {
    return {
      percentage,
      letterGrade: 'C',
      gpa: 2.0,
      points: 2,
      color: 'text-orange-600 bg-orange-100',
      description: 'Average'
    };
  } else if (percentage >= 33) {
    return {
      percentage,
      letterGrade: 'D',
      gpa: 1.0,
      points: 1,
      color: 'text-red-500 bg-red-100',
      description: 'Below Average'
    };
  } else {
    return {
      percentage,
      letterGrade: 'F',
      gpa: 0.0,
      points: 0,
      color: 'text-red-700 bg-red-200',
      description: 'Fail'
    };
  }
};

/**
 * Calculate weighted final score including attendance and bonus
 */
export const calculateFinalScore = (
  examAverage: number,
  attendancePercentage: number,
  bonusMarks: number = 0
): number => {
  // Weighted calculation: 70% exam + 20% attendance + 10% bonus
  const examContribution = examAverage * 0.7;
  const attendanceContribution = attendancePercentage * 0.2;
  const bonusContribution = bonusMarks * 0.1;
  
  return Math.round(examContribution + attendanceContribution + bonusContribution);
};

/**
 * Get rank suffix (1st, 2nd, 3rd, etc.)
 */
export const getRankSuffix = (rank: number): string => {
  if (rank % 100 >= 11 && rank % 100 <= 13) {
    return `${rank}th`;
  }
  
  switch (rank % 10) {
    case 1: return `${rank}st`;
    case 2: return `${rank}nd`;
    case 3: return `${rank}rd`;
    default: return `${rank}th`;
  }
};

/**
 * Calculate cumulative GPA from multiple months
 */
export const calculateCumulativeGPA = (monthlyGPAs: number[]): number => {
  if (monthlyGPAs.length === 0) return 0;
  
  const sum = monthlyGPAs.reduce((acc, gpa) => acc + gpa, 0);
  return Math.round((sum / monthlyGPAs.length) * 100) / 100;
};

/**
 * Get performance remarks based on final score
 */
export const getPerformanceRemarks = (finalScore: number): string => {
  const grade = getGradeInfo(finalScore);
  
  switch (grade.letterGrade) {
    case 'A+':
      return 'Outstanding performance! Keep up the excellent work.';
    case 'A':
      return 'Excellent work! You are doing very well.';
    case 'A-':
      return 'Very good performance! Continue your hard work.';
    case 'B':
      return 'Good work! There is room for improvement.';
    case 'C':
      return 'Average performance. Focus on weak areas.';
    case 'D':
      return 'Below average. Needs significant improvement.';
    case 'F':
      return 'Unsatisfactory. Requires immediate attention.';
    default:
      return 'Keep working hard!';
  }
};