/**
 * Local resume parsing using heuristics and regex
 * Extracts: skills, projects, education, experience years, keywords
 */

// Common technical skills keywords
const SKILL_KEYWORDS = [
  // Programming Languages
  'javascript', 'java', 'python', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift',
  'typescript', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash',
  // Web Technologies
  'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
  'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'jquery',
  // Databases
  'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'dynamodb',
  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform',
  // Mobile
  'android', 'ios', 'react native', 'flutter', 'xamarin',
  // Data & Analytics
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
  'data analysis', 'data science', 'tableau', 'power bi',
  // Other
  'git', 'agile', 'scrum', 'rest api', 'graphql', 'microservices', 'linux'
];

// Education keywords
const EDUCATION_KEYWORDS = [
  'bachelor', 'master', 'phd', 'degree', 'diploma', 'certification',
  'b.tech', 'm.tech', 'b.e', 'm.e', 'b.sc', 'm.sc', 'mba', 'b.com', 'm.com'
];

// Project indicators
const PROJECT_INDICATORS = [
  'project', 'developed', 'built', 'created', 'implemented', 'designed',
  'application', 'system', 'website', 'app', 'platform', 'tool'
];

/**
 * Escape special regex characters
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Extract skills from resume text
 */
const extractSkills = (text) => {
  const foundSkills = [];
  const lowerText = text.toLowerCase();

  SKILL_KEYWORDS.forEach(skill => {
    try {
      // Escape special regex characters in the skill name
      const escapedSkill = escapeRegex(skill);
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      if (regex.test(lowerText)) {
        foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    } catch (error) {
      // Skip skills that cause regex errors
      console.warn(`Skipping skill "${skill}" due to regex error:`, error.message);
    }
  });

  // Remove duplicates and return
  return [...new Set(foundSkills)];
};

/**
 * Extract education information
 */
const extractEducation = (text) => {
  const education = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check for education section
    if (line.includes('education') || line.includes('academic')) {
      // Look at next few lines
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const eduLine = lines[j];
        EDUCATION_KEYWORDS.forEach(keyword => {
          if (eduLine.toLowerCase().includes(keyword)) {
            education.push(eduLine.trim());
          }
        });
      }
      break;
    }
  }

  return [...new Set(education)];
};

/**
 * Extract projects from resume
 */
const extractProjects = (text) => {
  const projects = [];
  const lines = text.split('\n');
  let inProjectSection = false;
  let currentProject = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    
    // Detect project section
    if (line.includes('project') && (line.includes('experience') || line.includes('work'))) {
      inProjectSection = true;
      continue;
    }

    if (inProjectSection) {
      // Check if line starts a new project
      if (PROJECT_INDICATORS.some(indicator => line.includes(indicator))) {
        if (currentProject.length > 0) {
          projects.push(currentProject.join(' '));
          currentProject = [];
        }
        currentProject.push(lines[i].trim());
      } else if (currentProject.length > 0 && line.length > 10) {
        // Continue current project description
        currentProject.push(lines[i].trim());
      }

      // Stop if we hit another major section
      if (line.includes('skill') || line.includes('education') || line.includes('certification')) {
        if (currentProject.length > 0) {
          projects.push(currentProject.join(' '));
        }
        break;
      }
    }
  }

  if (currentProject.length > 0) {
    projects.push(currentProject.join(' '));
  }

  return projects.slice(0, 5); // Limit to 5 projects
};

/**
 * Extract experience years
 */
const extractExperienceYears = (text) => {
  const experiencePatterns = [
    /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
    /experience[:\s]+(\d+)\s*(?:years?|yrs?)/gi,
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:in|of)/gi
  ];

  let maxYears = 0;

  experiencePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (years > maxYears) {
        maxYears = years;
      }
    }
  });

  return maxYears;
};

/**
 * Extract keywords (general important terms)
 */
const extractKeywords = (text) => {
  const keywords = [];
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};

  // Count word frequency (excluding common words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 4 && !stopWords.has(cleanWord)) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });

  // Get top keywords
  const sorted = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  return sorted;
};

/**
 * Main parsing function
 */
const parseResume = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      skills: [],
      projects: [],
      education: [],
      experienceYears: 0,
      keywords: []
    };
  }

  return {
    skills: extractSkills(text),
    projects: extractProjects(text),
    education: extractEducation(text),
    experienceYears: extractExperienceYears(text),
    keywords: extractKeywords(text)
  };
};

module.exports = {
  parseResume,
  extractSkills,
  extractEducation,
  extractProjects,
  extractExperienceYears,
  extractKeywords
};

