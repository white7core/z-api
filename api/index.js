const scapper = require('./scrapper')
const { chaptersList } = require('./scrapper');
const express = require('express')
const { env } = require('process')
const cors = require('cors')

const app = express()
app.use(cors())

app.get('/api/', (req, res) => {
    res.send(`
        Latest Chapters at: /api/popular/ (example: /api/popular/) <br>
        All Manhwa List at: /api/manga/: (example: /api/manga/) <br>
        Manhwa Info at: /api/info/:slug (example: /api/info/the-game-that-i-came-from) <br>
        Manhwa Chapters list at: /api/list/:slug (example: /api/list/the-game-that-i-came-from) <br>

        Manhwa Images List at: /api/chapter/:slug (example: /api/chapter/the-game-that-i-came-from/chapter-273/)
        `)
})



app.get('/api/list/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        const result = await chaptersList(slug);

        res.setHeader('Cache-Control', 's-maxage=43200');
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/search/:query', async (req, res) => {
    const query = req.params.query;
    try {
        const mangaList = await scapper.searchManga(query);
        res.json(mangaList);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


app.get('/api/popular', async (req, res) => {
    const result = await scapper.newPopular();

    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});
app.get('/api/updates', async (req, res) => {
    const result = await scapper.latestUpdate();

    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});

app.get('/api/manga', async (req, res) => {
    const result = await scapper.latestUpdate();

    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4));
});

app.get('/api/info/:slug', async (req, res) => {

    const result = await scapper.info(req.params.slug)
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

app.get('/api/chapter/:manga/:chapter', async (req, res) => {

    const result = await scapper.chapter(req.params.manga,req.params.chapter)

    res.setHeader('Cache-Control', 's-maxage=43200');
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})

port = env.PORT || 3000
app.listen(port, () => {
    console.log(`Listening to port ${port}`)
})
