import syllabusData from '../data/syllabus/vtu_syllabus.json';

// Subject structure:
// {
//   name: string,
//   code: string,
//   credits: number,
//   description: string,
//   modules: string[],
//   keywords: string[],
//   scheme: string
// }

// SyllabusStats structure:
// {
//   totalSubjects: number,
//   totalCredits: number,
//   moduleCount: number,
//   schemeYear: string
// }

export function getAvailableSubjects(scheme, semester, branch) {
  try {
    const subjects = syllabusData[scheme]?.[branch]?.[semester];
    
    if (!subjects) {
      console.log(`No subjects found for ${scheme} scheme, ${branch} branch, semester ${semester}`);
      return [];
    }
    
    return Object.entries(subjects).map(([subjectName, subjectData]) => ({
      name: subjectName,
      code: subjectData.code,
      credits: subjectData.credits,
      description: subjectData.description || '',
      modules: subjectData.modules || [],
      keywords: subjectData.keywords || [],
      scheme: subjectData.scheme || scheme
    }));
  } catch (error) {
    console.error('Error getting available subjects:', error);
    return [];
  }
}

export function getAllAvailableBranches(scheme) {
  try {
    const branches = Object.keys(syllabusData[scheme] || {});
    return branches.sort();
  } catch (error) {
    console.error('Error getting branches:', error);
    return [];
  }
}

export function getAllAvailableSemesters(scheme, branch) {
  try {
    const semesters = Object.keys(syllabusData[scheme]?.[branch] || {});
    return semesters.sort((a, b) => parseInt(a) - parseInt(b));
  } catch (error) {
    console.error('Error getting semesters:', error);
    return [];
  }
}

export function getSyllabusStatistics(scheme, semester, branch) {
  const subjects = getAvailableSubjects(scheme, semester, branch);
  
  return {
    totalSubjects: subjects.length,
    totalCredits: subjects.reduce((sum, subject) => sum + subject.credits, 0),
    moduleCount: subjects.reduce((sum, subject) => sum + subject.modules.length, 0),
    schemeYear: scheme
  };
}

export function searchSubjectsByKeyword(keyword, scheme) {
  const allSubjects = [];
  const branches = getAllAvailableBranches(scheme);
  
  branches.forEach(branch => {
    const semesters = getAllAvailableSemesters(scheme, branch);
    semesters.forEach(semester => {
      const subjects = getAvailableSubjects(scheme, semester, branch);
      allSubjects.push(...subjects);
    });
  });
  
  const keywordLower = keyword.toLowerCase();
  return allSubjects.filter(subject => 
    subject.name.toLowerCase().includes(keywordLower) ||
    subject.keywords.some(kw => kw.toLowerCase().includes(keywordLower)) ||
    subject.description.toLowerCase().includes(keywordLower)
  );
}

// Enhanced branch mapping for comprehensive coverage
export const COMPREHENSIVE_BRANCH_INFO = {
  "2022": {
    "CSE": { fullName: "Computer Science & Engineering", stream: "CSE Stream" },
    "ISE": { fullName: "Information Science & Engineering", stream: "CSE Stream" },
    "AIDS": { fullName: "Artificial Intelligence & Data Science", stream: "CSE Stream" },
    "AIML": { fullName: "Artificial Intelligence & Machine Learning", stream: "CSE Stream" },
    "ECE": { fullName: "Electronics & Communication Engineering", stream: "EEE Stream" },
    "ETE": { fullName: "Electronics & Telecommunication Engineering", stream: "EEE Stream" },
    "EEE": { fullName: "Electrical & Electronics Engineering", stream: "EEE Stream" },
    "ME": { fullName: "Mechanical Engineering", stream: "Mechanical Stream" },
    "AE": { fullName: "Aeronautical Engineering", stream: "Mechanical Stream" },
    "AU": { fullName: "Automobile Engineering", stream: "Mechanical Stream" },
    "Civil": { fullName: "Civil Engineering", stream: "Civil Stream" },
    "EV": { fullName: "Environmental Engineering", stream: "Civil Stream" },
    "BT": { fullName: "Biotechnology", stream: "CSE Stream" },
    "CH": { fullName: "Chemical Engineering", stream: "Mechanical Stream" }
  },
  "2021": {
    "CSE": { fullName: "Computer Science & Engineering", group: "Both Groups" },
    "ISE": { fullName: "Information Science & Engineering", group: "Both Groups" },
    "ECE": { fullName: "Electronics & Communication Engineering", group: "Both Groups" },
    "EEE": { fullName: "Electrical & Electronics Engineering", group: "Both Groups" },
    "ME": { fullName: "Mechanical Engineering", group: "Both Groups" },
    "Civil": { fullName: "Civil Engineering", group: "Both Groups" },
    "CH": { fullName: "Chemical Engineering", group: "Both Groups" },
    "BT": { fullName: "Biotechnology", group: "Both Groups" }
  }
};

export function getBranchFullName(branch, scheme) {
  // @ts-ignore
  return COMPREHENSIVE_BRANCH_INFO[scheme]?.[branch]?.fullName || branch;
}
