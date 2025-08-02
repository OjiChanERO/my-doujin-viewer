const { API } = require('nhentai-api');
const api = new API();

// This is the Vercel Serverless Function handler.
module.exports = async (req, res) => {
    // Set CORS headers to allow your index.html to talk to this function.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Extract the query parameters from the URL.
    const { q, term, id, page } = req.query;

    try {
        let data;
        switch (q) {
            case 'search':
                data = await api.search(term || '', parseInt(page) || 1);
                break;
            
            // *** THIS IS THE FIX ***
            // The 'popular' query now correctly searches for an empty string.
            case 'popular':
                data = await api.search('', parseInt(page) || 1);
                break;

            case 'info':
                if (!id) throw new Error('An ID must be provided to get info.');
                const book = await api.getBook(id);
                // The nhentai-api library doesn't include full page URLs, so we construct them.
                const pages = book.pages.map((p, i) => {
                    const ext = p.t === 'j' ? 'jpg' : 'png';
                    return `https://i.nhentai.net/galleries/${book.mediaId}/${i + 1}.${ext}`;
                });
                data = { ...book, page_images: pages };
                break;

            default:
                // Default to popular if no query or an unknown query is provided
                data = await api.search('', 1);
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching data.', details: error.message });
    }
};
