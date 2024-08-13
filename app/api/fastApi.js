export async function callFastAPI(query, onChunk = null) {
    // Use environment variables to configure the endpoint URLs
    const streamingEndpoint =  'https://web-production-bdb7.up.railway.app/stream_rag';
    const nonStreamingEndpoint = 'https://web-production-bdb7.up.railway.app/rag';

    try {
        // If no onChunk callback is provided, use the non-streaming endpoint
        if (!onChunk) {
            const response = await fetch(nonStreamingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch from FastAPI: ${response.statusText}`);
            }

            const data = await response.json();
            return data.response;
        }

        // Use the streaming endpoint
        const response = await fetch(streamingEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from FastAPI: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                fullResponse += chunk;

                // Call the onChunk callback with the new chunk
                if (onChunk) {
                    onChunk(chunk);
                }
            }
        } catch (error) {
            console.error('Error while reading stream:', error);
            throw error;
        } finally {
            reader.releaseLock();
        }

        return fullResponse;
    } catch (error) {
        console.error('Error in FastAPI call:', error);
        throw error;
    }
}
