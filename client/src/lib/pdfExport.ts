/**
 * Enhanced PDF Export Service for Monthly Results
 * Generates comprehensive downloadable PDF reports with GPA, rankings, and detailed analysis
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getGradeInfo, calculateFinalScore, getRankSuffix, getPerformanceRemarks, type GradeInfo } from './gradeSystem';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface MonthlyResultData {
  studentId: string;
  studentName: string;
  batchId: string;
  classLevel: string;
  examAverage: number;
  attendancePercentage: number;
  bonusMarks: number;
  finalScore: number;
  rank: number;
  totalStudents: number;
  presentDays: number;
  workingDays: number;
  totalExams: number;
  // Enhanced fields
  gpa?: number;
  letterGrade?: string;
  remarks?: string;
}

export class PDFExportService {
  /**
   * Generate Enhanced PDF for monthly results with GPA and detailed ranking
   */
  static generateMonthlyResultsPDF(
    results: MonthlyResultData[],
    batchName: string,
    month: number,
    year: number
  ): void {
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // School Header
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('🎓 COACHING CENTER', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text('Monthly Academic Performance Report', doc.internal.pageSize.width / 2, 30, { align: 'center' });
    
    // Batch and date info
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    doc.text(`Batch: ${batchName}`, 20, 45);
    doc.text(`Academic Period: ${monthName} ${year}`, 20, 55);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, 65);
    
    // Enhanced Summary Statistics
    if (results.length > 0) {
      const avgScore = Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length);
      const avgGPA = Math.round((results.reduce((sum, r) => sum + getGradeInfo(r.finalScore).gpa, 0) / results.length) * 100) / 100;
      const avgAttendance = Math.round(results.reduce((sum, r) => sum + r.attendancePercentage, 0) / results.length);
      const topPerformerScore = Math.max(...results.map(r => r.finalScore));
      
      // Summary Box
      doc.setFillColor(240, 248, 255);
      doc.rect(15, 75, 180, 25, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`📊 Class Summary: ${results.length} Students | Average Score: ${avgScore}% | Average GPA: ${avgGPA} | Top Score: ${topPerformerScore}% | Attendance: ${avgAttendance}%`, 20, 85);
    } else {
      // Empty results message
      doc.setFillColor(255, 248, 240);
      doc.rect(15, 75, 180, 40, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(180, 100, 0);
      doc.text('📋 No Results Available Yet', doc.internal.pageSize.width / 2, 90, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Results will appear automatically when exam marks are entered.', doc.internal.pageSize.width / 2, 100, { align: 'center' });
      doc.text('This PDF template is ready for future result data.', doc.internal.pageSize.width / 2, 110, { align: 'center' });
    }
    
    // Enhanced Results table with GPA
    const tableData = results.length > 0 ? results.map(result => {
      const gradeInfo = getGradeInfo(result.finalScore);
      return [
        getRankSuffix(result.rank),
        result.studentName,
        result.classLevel,
        `${result.examAverage}%`,
        `${result.attendancePercentage}%`,
        `+${result.bonusMarks}`,
        `${result.finalScore}%`,
        gradeInfo.letterGrade,
        gradeInfo.gpa.toString(),
        `${result.presentDays}/${result.workingDays}`
      ];
    }) : [['No data', 'No students yet', '-', '-', '-', '-', '-', '-', '-', '-']];
    
    doc.autoTable({
      startY: results.length > 0 ? 110 : 125,
      head: [['Rank', 'Student Name', 'Class', 'Exam Avg', 'Attendance', 'Bonus', 'Final Score', 'Grade', 'GPA', 'Days Present']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 }, // Rank  
        1: { cellWidth: 35 }, // Name
        2: { halign: 'center', cellWidth: 15 }, // Class
        3: { halign: 'center', cellWidth: 20 }, // Exam
        4: { halign: 'center', cellWidth: 20 }, // Attendance
        5: { halign: 'center', cellWidth: 15 }, // Bonus
        6: { halign: 'center', cellWidth: 20 }, // Final
        7: { halign: 'center', cellWidth: 15 }, // Grade
        8: { halign: 'center', cellWidth: 15 }, // GPA
        9: { halign: 'center', cellWidth: 20 }  // Days
      }
    });
    
    // Enhanced Formula explanation
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Formula Box
    doc.setFillColor(255, 248, 225);
    doc.rect(15, finalY - 5, 180, 30, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text('📋 Calculation Formula:', 20, finalY + 5);
    doc.setFontSize(9);
    doc.text('• Final Score = (70% × Exam Average) + (20% × Attendance) + (10% × Bonus)', 25, finalY + 12);
    doc.text('• Bonus Points = Max(0, 30 - Working Days)', 25, finalY + 19);
    doc.text('• GPA Scale: A+ (5.0), A (4.0), A- (3.5), B (3.0), C (2.0), D (1.0), F (0.0)', 25, finalY + 26);
    
    // Footer with enhanced information
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('🏫 Generated by CoachManager Pro - Academic Excellence Management System', 20, doc.internal.pageSize.height - 20);
    doc.text(`📄 Page 1 | 📅 ${new Date().toLocaleDateString()} | 👥 ${results.length} Students`, 20, doc.internal.pageSize.height - 12);
    
    // Download the PDF
    const fileName = `Monthly_Results_${batchName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
    doc.save(fileName);
  }
  
  /**
   * Generate Enhanced Individual Student Report Card with GPA
   */
  static generateStudentReportCard(
    student: MonthlyResultData,
    batchName: string,
    month: number,
    year: number
  ): void {
    const doc = new jsPDF();
    const gradeInfo = getGradeInfo(student.finalScore);
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    
    // Header with school branding
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('🎓 COACHING CENTER', doc.internal.pageSize.width / 2, 25, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);  
    doc.text('Student Report Card', doc.internal.pageSize.width / 2, 40, { align: 'center' });
    
    // Student Information Box
    doc.setFillColor(240, 248, 255);
    doc.rect(15, 50, 180, 30, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`👤 Student: ${student.studentName}`, 20, 62);
    doc.text(`🏫 Class: ${student.classLevel}`, 20, 72);
    doc.text(`📚 Batch: ${batchName}`, 110, 62);
    doc.text(`📅 Period: ${monthName} ${year}`, 110, 72);
    
    // Performance Summary Title
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('📊 Academic Performance Analysis', 20, 100);
    
    // Rank and Grade Highlight Box
    doc.setFillColor(255, 248, 225);
    doc.rect(15, 110, 180, 25, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(184, 134, 11);
    doc.text(`🏆 Rank: ${getRankSuffix(student.rank)} out of ${student.totalStudents}`, 20, 125);
    doc.text(`🎯 Grade: ${gradeInfo.letterGrade} (GPA: ${gradeInfo.gpa})`, 110, 125);
    
    // Performance Metrics Table
    const performanceData = [
      ['Final Score', `${student.finalScore}%`, gradeInfo.letterGrade, gradeInfo.description],
      ['Exam Average', `${student.examAverage}%`, `From ${student.totalExams} exams`, '70% weightage'],
      ['Attendance', `${student.attendancePercentage}%`, `${student.presentDays}/${student.workingDays} days`, '20% weightage'],
      ['Bonus Points', `+${student.bonusMarks}`, 'Activity participation', '10% weightage']
    ];
    
    doc.autoTable({
      startY: 150,
      head: [['Metric', 'Score', 'Details', 'Notes']],
      body: performanceData,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 45 },
        3: { cellWidth: 35 }
      }
    });
    
    // Performance Comments
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('💬 Performance Remarks:', 20, finalY);
    
    // Generate personalized remarks
    const remarks = getPerformanceRemarks(student.finalScore);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(remarks, 20, finalY + 12, { maxWidth: 170 });
    
    // Additional analysis
    let additionalRemarks = '';
    if (student.attendancePercentage < 75) {
      additionalRemarks += '⚠️ Attendance below 75% - Please improve class attendance. ';
    }
    if (student.rank <= student.totalStudents * 0.1) {
      additionalRemarks += '🌟 Excellent! You are in the top 10% of the class. ';
    }
    if (student.examAverage >= 90) {
      additionalRemarks += '📚 Outstanding exam performance! ';
    }
    
    if (additionalRemarks) {
      doc.text(additionalRemarks, 20, finalY + 25, { maxWidth: 170 });
    }
    
    // Calculation Formula Box
    const formulaY = finalY + 45;
    doc.setFillColor(248, 249, 250);
    doc.rect(15, formulaY - 5, 180, 25, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('📋 Calculation: Final Score = (70% × Exam) + (20% × Attendance) + (10% × Bonus)', 20, formulaY + 5);
    doc.text(`📊 Your Calculation: (70% × ${student.examAverage}%) + (20% × ${student.attendancePercentage}%) + (10% × ${student.bonusMarks}) = ${student.finalScore}%`, 20, formulaY + 12);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('🏫 Generated by CoachManager Pro', 20, doc.internal.pageSize.height - 20);
    doc.text(`📅 Report Date: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 20);
    
    // Download
    const fileName = `Report_Card_${student.studentName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
    doc.save(fileName);
  }
}