// Split text into sentences with their positions
export interface SentenceWithPosition {
  text: string;
  startIndex: number;
  endIndex: number;
}

export function splitIntoSentences(text: string): SentenceWithPosition[] {
  // Use regex to split on sentence-ending punctuation
  // Handles: periods, question marks, exclamation points
  // Preserves punctuation with the sentence
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  const sentences: SentenceWithPosition[] = [];
  let match;
  
  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 0) {
      sentences.push({
        text: sentence,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }
  
  // Handle text without ending punctuation (trailing text)
  const lastPunctuation = Math.max(
    text.lastIndexOf('.'),
    text.lastIndexOf('!'),
    text.lastIndexOf('?')
  );
  
  if (lastPunctuation < text.length - 1) {
    const remaining = text.slice(lastPunctuation + 1).trim();
    if (remaining.length > 0) {
      sentences.push({
        text: remaining,
        startIndex: lastPunctuation + 1,
        endIndex: text.length,
      });
    }
  }
  
  return sentences;
}

export function extractCompleteSentences(text: string): { 
  complete: string[]; 
  remaining: string 
} {
  const complete: string[] = [];
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  let match;
  let lastIndex = 0;
  
  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 0) {
      complete.push(sentence);
    }
    lastIndex = sentenceRegex.lastIndex;
  }
  
  return {
    complete,
    remaining: text.slice(lastIndex).trim(),
  };
}
