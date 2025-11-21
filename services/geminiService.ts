import { GoogleGenAI, Modality } from '@google/genai';
import { Language, NewsArticle, NewsCategory } from '../types';
import { base64ToUint8Array, decodeAudioData } from './audioUtils';

// Initialize GenAI Client
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fetches news using Gemini Search Grounding.
 */
export const fetchNewsArticles = async (
  categories: NewsCategory[],
  targetLanguage: Language,
  date?: string,
  specificTopic?: string
): Promise<NewsArticle[]> => {
  const ai = getAiClient();
  const topics = specificTopic || categories.join(', ');
  const dateQuery = date ? `published on ${date}` : 'published today';
  
  // Constructing a prompt to act as a crawler and summarizer
  const prompt = `
    You are an intelligent news aggregator crawler. 
    Find the latest news articles ${dateQuery} about these topics: ${topics}.
    
    For the top 5 most relevant articles, provide a summary translated into ${targetLanguage}.
    
    IMPORTANT: Inspect the search results metadata carefully. If an image URL (like og:image, or a news thumbnail) is available in the source, include it in the IMAGE_URL field. If no valid image URL is found, write "N/A".
    
    You MUST return the result as a STRICT Markdown list where each item follows this exact format.
    DO NOT include any preamble or conversational text before the list.
    
    ### ARTICLE
    TITLE: [Insert Title Here]
    SOURCE: [Insert Source Name]
    DATE: [Insert Date/Time]
    URL: [Insert the specific link URL to the source article. If not found, write "N/A"]
    IMAGE_URL: [Insert actual image URL from source if found, otherwise "N/A"]
    SUMMARY: [Insert a comprehensive summary in ${targetLanguage}]
    CATEGORY: [Insert the closest category from the request]
    ### END
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const grounding = response.candidates?.[0]?.groundingMetadata;
    
    return parseArticles(text, grounding, targetLanguage, categories[0]);
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

/**
 * Fetches a curated 2-minute briefing of top 5 stories.
 */
export const fetchDailyBriefing = async (
  categories: NewsCategory[],
  targetLanguage: Language
): Promise<NewsArticle[]> => {
  const ai = getAiClient();
  const topics = categories.join(', ');
  
  const prompt = `
    You are a news editor preparing a "2-Minute Daily Briefing" script.
    Find the 5 most important and impactful news stories from TODAY regarding: ${topics}.
    
    For each story, write a concise, engaging 2-sentence summary suitable for reading aloud.
    Translate the summary into ${targetLanguage}.
    
    You MUST return the result as a STRICT Markdown list.
    
    ### ARTICLE
    TITLE: [Headline]
    SOURCE: [Source]
    DATE: [Time]
    URL: [Insert the specific link URL to the source article. If not found, write "N/A"]
    IMAGE_URL: [Insert actual image URL from source if found, otherwise "N/A"]
    SUMMARY: [Concise 2-sentence summary in ${targetLanguage}]
    CATEGORY: [Category]
    ### END
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const grounding = response.candidates?.[0]?.groundingMetadata;
    
    return parseArticles(text, grounding, targetLanguage, 'General');
  } catch (error) {
    console.error("Error fetching briefing:", error);
    return [];
  }
};

const parseArticles = (text: string, grounding: any, targetLanguage: Language, defaultCategory: string | NewsCategory): NewsArticle[] => {
    const articles: NewsArticle[] = [];
    const chunks = text.split('### ARTICLE');

    chunks.forEach((chunk, index) => {
      if (!chunk.trim() || !chunk.includes('### END')) return;
      
      const titleMatch = chunk.match(/TITLE:\s*(.+)/);
      const sourceMatch = chunk.match(/SOURCE:\s*(.+)/);
      const dateMatch = chunk.match(/DATE:\s*(.+)/);
      const urlMatch = chunk.match(/URL:\s*(.+)/);
      const imageMatch = chunk.match(/IMAGE_URL:\s*(.+)/);
      const summaryMatch = chunk.match(/SUMMARY:\s*([\s\S]+?)(?=CATEGORY:)/);
      const categoryMatch = chunk.match(/CATEGORY:\s*(.+)/);
      
      let url = urlMatch ? urlMatch[1].trim() : '';
      let imageUrl = imageMatch ? imageMatch[1].trim() : 'N/A';
      
      // Fallback to grounding chunks if text URL is N/A or empty
      if ((!url || url === 'N/A') && grounding?.groundingChunks) {
         // Attempt to find a relevant link in chunks (heuristic)
         const chunkIndex = index % grounding.groundingChunks.length;
         url = grounding.groundingChunks[chunkIndex]?.web?.uri || '';
      }

      if (titleMatch && summaryMatch) {
        const title = titleMatch[1].trim();
        const category = (categoryMatch ? categoryMatch[1].trim() : defaultCategory) as NewsCategory;
        
        // Strategy: 
        // 1. Use extracted Image URL if valid and not N/A.
        // 2. If N/A, the UI component will handle the fallback to a category-specific stock photo.
        if (imageUrl === 'N/A' || imageUrl.length < 10) {
            imageUrl = ''; // Reset to empty so UI handles fallback
        }

        articles.push({
          id: `news-${Date.now()}-${index}`,
          title: title,
          source: sourceMatch ? sourceMatch[1].trim() : 'Unknown Source',
          date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString(),
          url: url === 'N/A' ? '' : url,
          imageUrl: imageUrl,
          summary: summaryMatch[1].trim(),
          originalLanguage: 'English',
          targetLanguage,
          category: category
        });
      }
    });
    return articles;
};

/**
 * Helper for the Live Agent to search news.
 */
export const searchNewsForAgent = async (query: string, date?: string): Promise<string> => {
    const articles = await fetchNewsArticles([], Language.ENGLISH, date, query);
    if (articles.length === 0) return "I couldn't find any news matching that request.";
    return articles.map(a => `Title: ${a.title}\nSummary: ${a.summary}\nDate: ${a.date}`).join('\n\n');
};

/**
 * Explains an article in simple terms (ELI5).
 */
export const explainArticle = async (article: NewsArticle, language: Language): Promise<string> => {
  const ai = getAiClient();
  
  const prompt = `
    You are a helpful news assistant. 
    Explain the following news article in simple, conversational terms for a general audience.
    The explanation must be in ${language}.
    
    Title: ${article.title}
    Summary: ${article.summary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
    });
    return response.text || "Could not generate explanation.";
  } catch (e) {
    console.error("Error generating explanation:", e);
    return "Unable to explain this article at the moment.";
  }
};

/**
 * Generates TTS audio for a given text.
 */
export const generateSpeech = async (text: string, language: Language): Promise<AudioBuffer | null> => {
  const ai = getAiClient();
  
  // Select a voice based on language (simplified mapping)
  let voiceName = 'Kore'; // Default
  if (language === Language.HINDI) voiceName = 'Puck'; 
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      base64ToUint8Array(base64Audio),
      audioContext
    );
    
    return audioBuffer;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};