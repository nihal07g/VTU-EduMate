// Official VTU subject code patterns
const VTU_CODE_PATTERNS = {
  "2022": {
    "CSE": /^BCS[1-8][0-9][0-9]$/,  // BCS501, BCS502, etc.
    "ECE": /^BEC[1-8][0-9][0-9]$/,  // BEC501, BEC502, etc.
    "ME": /^BME[1-8][0-9][0-9]$/,   // BME501, BME502, etc.
    "EEE": /^BEE[1-8][0-9][0-9]$/,  // BEE501, BEE502, etc.
    "Civil": /^BCE[1-8][0-9][0-9]$/, // BCE501, BCE502, etc.
    "ISE": /^BIS[1-8][0-9][0-9]$/   // BIS501, BIS502, etc.
  },
  "2021": {
    "CSE": /^18CS[1-8][0-9]$/,      // 18CS55, 18CS53, etc.
    "ECE": /^18EC[1-8][0-9]$/,
    "ME": /^18ME[1-8][0-9]$/,
    "EEE": /^18EE[1-8][0-9]$/,
    "Civil": /^18CV[1-8][0-9]$/,
    "ISE": /^18IS[1-8][0-9]$/
  }
};

export function validateVTUSubjectCode(code, scheme, branch) {
  const pattern = VTU_CODE_PATTERNS[scheme]?.[branch];
  if (!pattern) return false;
  return pattern.test(code);
}

export function getOfficialVTULink(subjectCode) {
  return `https://vtucircle.com/subject/${subjectCode.toLowerCase()}/`;
}
