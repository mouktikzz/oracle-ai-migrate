const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8888/.netlify/functions' 
  : '/.netlify/functions';

export interface DocsSearchResult {
  file: string;
  description: string;
  relevance: number;
  sections: Array<{
    section: string;
    content: string;
    lineNumber: number;
  }>;
}

export interface DocsSearchResponse {
  success: boolean;
  results?: DocsSearchResult[];
  content?: string;
  structure?: Record<string, string>;
  error?: string;
}

export async function searchDocs(query: string): Promise<DocsSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/docs-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'search',
        query: query
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching docs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getDocContent(filePath: string): Promise<DocsSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/docs-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getContent',
        filePath: filePath
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting doc content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getDocsStructure(): Promise<DocsSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/docs-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting docs structure:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 