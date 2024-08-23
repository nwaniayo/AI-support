// app/api/callApi.js

export async function callApi(query, onChunk = null) {
  const apiEndpoint = '/api/rag';

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from API: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;

      if (onChunk) {
        onChunk(chunk);
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Error in API call:', error);
    throw error;
  }
}