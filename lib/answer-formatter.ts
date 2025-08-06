export function formatChatGPTStyle(
  rawAnswer: string,
  subject: string,
  subjectCode: string,
  scheme: string,
  semester: string,
  branch: string
): string {
  // Remove technical headers and format conversationally
  const cleanAnswer = rawAnswer
    .replace(/\*\*Subject:\*\*.*?\n/g, '')
    .replace(/\*\*Context:\*\*.*?\n/g, '')
    .replace(/\*\*VTU Context:\*\*.*?\n/g, '')
    .replace(/---[\s\S]*?API Usage:.*?\*/g, '')
    .trim();

  return `## ${extractMainTopic(cleanAnswer)}

${cleanAnswer}

---
*📚 This answer is tailored for **${subject} (${subjectCode})** - VTU ${scheme} Scheme, Semester ${semester}, ${branch} Engineering*`;
}

function extractMainTopic(answer: string): string {
  // Extract the main topic from the first heading or question
  const firstHeading = answer.match(/#+\s*(.+)/);
  if (firstHeading) {
    return firstHeading[1];
  }
  
  // Fallback to first sentence
  const firstSentence = answer.split('.')[0];
  return firstSentence.length > 50 ? 'VTU Exam Answer' : firstSentence;
}

export function formatMarksSpecific(answer: string, marks: string): string {
  const marksEmoji = marks === '2' ? '📝' : marks === '5' ? '📋' : '📄';
  return `${marksEmoji} **${marks} Marks Answer Format**\n\n${answer}`;
}
