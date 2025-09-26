// NCTB Bangladesh Subject & Chapter mappings (Science & Math)
// Replaces previous chemistry/ict usage.

export type CoreSubject = 'science' | 'math';
export type AcademicLevel = '6-8' | '9-10' | '11-12';

interface ChapterInfo {
  number: number;
  titleBn: string;
  titleEn: string;
  key: string; // slug-friendly key
}

interface SubjectChaptersByLevel {
  level: AcademicLevel;
  chapters: ChapterInfo[];
}

interface SubjectDefinition {
  code: CoreSubject;
  displayNameBn: string;
  displayNameEn: string;
  levels: SubjectChaptersByLevel[];
}

// NOTE: Chapter lists are representative & can be extended; sourced/adapted from NCTB public syllabus outlines.
export const SUBJECT_DEFINITIONS: SubjectDefinition[] = [
  {
    code: 'science',
    displayNameBn: 'বিজ্ঞান',
    displayNameEn: 'Science',
    levels: [
      {
        level: '9-10',
        chapters: [
          { number: 1, titleBn: 'বৈজ্ঞানিক পদ্ধতি ও পরিমাপ', titleEn: 'Scientific Method & Measurement', key: 'measurement' },
          { number: 2, titleBn: 'পদার্থের গাঠনিক ধারণা', titleEn: 'Structure of Matter', key: 'structure-of-matter' },
          { number: 3, titleBn: 'বল ও গতি', titleEn: 'Force & Motion', key: 'force-motion' },
          { number: 4, titleBn: 'তাপ ও তাপগতিবিদ্যা', titleEn: 'Heat & Thermodynamics', key: 'heat-thermo' },
          { number: 5, titleBn: 'আলো', titleEn: 'Light', key: 'light' },
          { number: 6, titleBn: 'বিদ্যুৎ ও চুম্বকত্ব', titleEn: 'Electricity & Magnetism', key: 'electricity-magnetism' },
          { number: 7, titleBn: 'জীবকোষ ও টিস্যু', titleEn: 'Cell & Tissue', key: 'cell-tissue' },
          { number: 8, titleBn: 'মানব দেহের বিভিন্ন ব্যবস্থা', titleEn: 'Human Body Systems', key: 'human-body' },
          { number: 9, titleBn: 'উদ্ভিদের পরিপাক ও পরিবহণ', titleEn: 'Plant Nutrition & Transport', key: 'plant-nutrition' },
          { number:10, titleBn: 'পরিবেশ ও বাস্তুতন্ত্র', titleEn: 'Environment & Ecosystem', key: 'ecosystem' },
        ]
      },
      {
        level: '11-12',
        chapters: [
          { number: 1, titleBn: 'ভৌত রাশির পরিমাপ', titleEn: 'Measurement of Physical Quantities', key: 'measurement-adv' },
          { number: 2, titleBn: 'এক ও দ্বি মাত্রিক গতি', titleEn: '1D & 2D Motion', key: 'kinematics' },
          { number: 3, titleBn: 'নিউটনের গতিসূত্র', titleEn: 'Newtonian Mechanics', key: 'newton-laws' },
          { number: 4, titleBn: 'কাজ, শক্তি ও ক্ষমতা', titleEn: 'Work Energy Power', key: 'work-energy' },
          { number: 5, titleBn: 'গ্যাসের গতিতত্ত্ব', titleEn: 'Kinetic Theory of Gases', key: 'kinetic-theory' },
          { number: 6, titleBn: 'স্থির তড়িৎ', titleEn: 'Electrostatics', key: 'electrostatics' },
          { number: 7, titleBn: 'চল তড়িৎ', titleEn: 'Current Electricity', key: 'current-electricity' },
          { number: 8, titleBn: 'চুম্বক ক্ষেত্র ও তড়িৎচুম্বকত্ব', titleEn: 'Magnetic Field & Electromagnetism', key: 'magnetism-adv' },
          { number: 9, titleBn: 'আধুনিক পদার্থবিজ্ঞান পরিচিতি', titleEn: 'Modern Physics Intro', key: 'modern-physics' },
          { number:10, titleBn: 'জীবপ্রযুক্তি ও পরিবেশ', titleEn: 'Biotech & Environment', key: 'biotech' },
        ]
      }
    ]
  },
  {
    code: 'math',
    displayNameBn: 'গণিত',
    displayNameEn: 'Mathematics',
    levels: [
      {
        level: '9-10',
        chapters: [
          { number: 1, titleBn: 'বাস্তব সংখ্যা ও সেট', titleEn: 'Real Numbers & Sets', key: 'real-numbers-sets' },
          { number: 2, titleBn: 'বীজগাণিতিক রাশি ও উৎপাদক', titleEn: 'Algebraic Expressions & Factorization', key: 'algebra-factor' },
          { number: 3, titleBn: 'সমীকরণ ও অসমতা', titleEn: 'Equations & Inequalities', key: 'equations' },
          { number: 4, titleBn: 'সূচক ও লগারিদম', titleEn: 'Indices & Logarithms', key: 'logarithms' },
          { number: 5, titleBn: 'ব্যঞ্জক সরলীকরণ', titleEn: 'Expression Simplification', key: 'simplification' },
          { number: 6, titleBn: 'জ্যামিতি (ত্রিভুজ, বৃত্ত)', titleEn: 'Geometry: Triangle & Circle', key: 'geometry' },
          { number: 7, titleBn: 'ত্রিকোণমিতি পরিচিতি', titleEn: 'Intro Trigonometry', key: 'trigonometry-intro' },
          { number: 8, titleBn: 'সমন্বয় জ্যামিতি', titleEn: 'Coordinate Geometry', key: 'coordinate-geometry' },
          { number: 9, titleBn: 'সম্ভাব্যতা ও পরিসংখ্যান', titleEn: 'Probability & Statistics', key: 'probability' },
          { number:10, titleBn: 'বীজগণিতের প্রয়োগ', titleEn: 'Applications of Algebra', key: 'algebra-applications' },
        ]
      },
      {
        level: '11-12',
        chapters: [
          { number: 1, titleBn: 'উচ্চতর সমীকরণ', titleEn: 'Higher Order Equations', key: 'higher-equations' },
            { number: 2, titleBn: 'ক্রম ও শ্রেণি', titleEn: 'Sequence & Series', key: 'sequence-series' },
            { number: 3, titleBn: 'সীমা ও অন্তরকলন', titleEn: 'Limits & Differentiation', key: 'calculus-diff' },
            { number: 4, titleBn: 'ইন্টিগ্রেশন', titleEn: 'Integration', key: 'integration' },
            { number: 5, titleBn: 'ভেক্টর', titleEn: 'Vectors', key: 'vectors' },
            { number: 6, titleBn: 'ত্রিকোণমিতিক বিস্তার', titleEn: 'Trigonometric Expansions', key: 'trig-expansion' },
            { number: 7, titleBn: 'স্থিরাংক জ্যামিতি', titleEn: 'Analytic Geometry', key: 'analytic-geometry' },
            { number: 8, titleBn: 'সম্ভাব্যতা বিতরণ', titleEn: 'Probability Distributions', key: 'prob-distribution' },
            { number: 9, titleBn: 'ম্যাট্রিক্স ও ডিটারমিন্যান্ট', titleEn: 'Matrix & Determinant', key: 'matrix' },
            { number:10, titleBn: 'রৈখিক প্রোগ্রামিং পরিচিতি', titleEn: 'Intro Linear Programming', key: 'linear-programming' }
        ]
      }
    ]
  }
];

export const SUBJECT_CODES: CoreSubject[] = ['science', 'math'];

export function getChapters(subject: CoreSubject, level: AcademicLevel) {
  return SUBJECT_DEFINITIONS.find(s => s.code === subject)?.levels.find(l => l.level === level)?.chapters || [];
}

// Backward compatibility map (old -> new). If existing DB rows still have chemistry / ict.
export const LEGACY_SUBJECT_MAP: Record<string, CoreSubject> = {
  chemistry: 'science',
  ict: 'science' // ICT content folded into science for now; can separate later if needed
};
