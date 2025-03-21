const proxyServices = [
    {
        name: 'direct',
        fetch: async (url) => fetch(url, {
            mode: 'no-cors',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
    },
    {
        name: 'allorigins',
        fetch: async (url) => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
    },
    {
        name: 'corsproxy',
        fetch: async (url) => fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
    }
];

const fetchWithProxy = async (url, serviceIndex = 0) => {
    if (serviceIndex >= proxyServices.length) {
        throw new Error('All proxy services failed');
    }

    const service = proxyServices[serviceIndex];
    try {
        const response = await service.fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
    } catch (error) {
        console.warn(`${service.name} failed:`, error.message);
        return fetchWithProxy(url, serviceIndex + 1);
    }
};

export const fetchImage = async (url, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    try {
        const response = await fetchWithProxy(url);
        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, RETRY_DELAY * (retryCount + 1)));
            return fetchImage(url, retryCount + 1);
        }
        throw error;
    }
};