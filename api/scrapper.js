const cheerio = require('cheerio');
const axios = require('axios');
const puppeteer = require('puppeteer');

async function scrapeMangaItems() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://mangarolls.net/');

    let m_list = [];

    try {
        while (true) {
            // Scrape manga items on the current page
            const mangaItems = await scrapeCurrentPage(page);
            m_list = m_list.concat(mangaItems);

            // Click the Load More button
            const loadMoreButton = await page.$('nav.navigation-ajax a.load-ajax');
            if (!loadMoreButton) {
                console.log('No more pages to load.');
                break; // No more pages to load
            }
            await loadMoreButton.click();

            // Wait for the page to load new manga items
            await page.waitForSelector('.page-listing-item');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }

    await browser.close();

    return m_list;
}

async function scrapeCurrentPage(page) {
    return await page.$$eval('.page-listing-item', items => {
        return items.map(item => {
            const image = item.querySelector('.page-item-detail img').getAttribute('data-src').replace(/-\d+x\d+/, '');
            const url = item.querySelector('.page-item-detail a').href;
            const title = item.querySelector('.page-item-detail .post-title a').textContent.trim();
            const rating = item.querySelector('.post-total-rating .score').textContent.trim();
            const chapters = Array.from(item.querySelectorAll('.list-chapter .chapter-item')).map(chapter => {
                return {
                    c_title: chapter.querySelector('.btn-link').textContent.trim(),
                    c_url: chapter.querySelector('.btn-link').href,
                    c_date: chapter.querySelector('.post-on').textContent.trim()
                };
            });

            return {
                'title': title,
                'rating': rating,
                'image': image,
                'url': url,
                'chapters': chapters
            };
        });
    });
}

// Call the function to start scraping
scrapeMangaItems().then((mangaItems) => {
    console.log('Scraped manga items:', mangaItems);
}).catch((error) => {
    console.error('Scraping failed:', error);
});


async function info(slug) {
    try {
        const res = await axios.get(`https://mangarolls.net/manga/${slug}`);
        const $ = cheerio.load(res.data);

        const info = {
            page: $('.post-title > h1').text().trim(),
            other_name: $('div.post-content_item:contains("Alternative")').find('.summary-content').text().trim(),
            poster: $('.summary_image img').attr('src'),
            authors: $('.author-content a').text().trim(),
            artists: $('.artist-content a').text().trim(),
            genres: $('.genres-content a').map((i, e) => $(e).text().trim()).get(),
            status: $('div.post-content_item:contains("Status")').find('.summary-content').text().trim(),
            description: $('.description-summary').text().trim(),
        };

        return info;
    } catch (error) {
        console.error('An error occurred:', error);
        return { error: 'Sorry dude, an error occurred! No Info!' };
    }
}

async function chaptersList(slug) {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const url = `https://mangarolls.net/manga/${slug}/`;
        await page.goto(url);

        // Wait for the spinner to disappear
        await page.waitForSelector('.version-chap li');

        // Extract chapter information
        const ch_list = await page.evaluate(() => {
            const chapters = [];
            document.querySelectorAll('.version-chap li').forEach((element) => {
                const titleElement = element.querySelector('a');
                const title = titleElement ? titleElement.textContent.trim() : null;
                const url = titleElement ? titleElement.href : null;
                let timeElement = element.querySelector('.chapter-release-date a');
                if (!timeElement) {
                    timeElement = element.querySelector('.chapter-release-date i');
                }
                const time = timeElement ? timeElement.textContent.trim() : null;
                chapters.push({ ch_title: title, time, url });
            });
            return chapters;
        });

        await browser.close();

        return ch_list;
    } catch (error) {
        console.error('Error getting chapters:', error);
        return 'Error Getting Chapters!';
    }
}













async function latestUpdate() {
    let m_list = [];

    try {
        const res = await axios.get(`https://mangarolls.net/`);
        const body = res.data;
        const $ = cheerio.load(body);

        let p_title = $('.c-blog__heading h1').text().trim();

        $('.page-listing-item').each((index, element) => {
            const $row = $(element);
            $row.find('.col-6').each((i, col) => {
                const $item = $(col);
                let image = $item.find('.page-item-detail img').attr('data-src');
                // Remove the dimensions from the image URL
                image = image.replace(/-\d+x\d+/, '');

                const url = $item.find('.page-item-detail a').attr('href');
                const title = $item.find('.page-item-detail .post-title a').text().trim();
                const rating = $item.find('.post-total-rating .score').text().trim();
                const chapters = $item.find('.list-chapter .chapter-item').map((j, e) => {
                    const $chapter = $(e);
                    return {
                        c_title: $chapter.find('.btn-link').text().trim(),
                        c_url: $chapter.find('.btn-link').attr('href'),
                        c_date: $chapter.find('.post-on').text().trim()
                    };
                }).get();

                m_list.push({
                    'title': title,
                    'rating': rating,
                    'image': image,
                    'url': url,
                    'chapters': chapters
                });
            });
        });

        let current = $('.current').text();
        let last_page = $('.last').attr('href');
        !last_page ? last_page = current : last_page;

        return {
            'p_title': p_title,
            'list': m_list,
            'current_page': parseInt(current),
            'last_page': parseInt(last_page.replace(/[^0-9]/g, ''))
        };
    } catch (error) {
        return { 'error': 'Sorry dude, an error occurred! No Latest!' };
    }
}


async function newPopular() {
    let m_list = [];

    try {
        const res = await axios.get(`https://mangarolls.net/`);
        const body = res.data;
        const $ = cheerio.load(body);

        let p_title = $('.c-blog__heading h1').text().trim();

        $('.slider__item').each((index, element) => {
            const $elements = $(element);
            let image = $elements.find('.slider__thumb img').attr('data-src');
    // Remove the dimensions from the image URL
            image = image.replace(/-\d+x\d+/, '');
            const url = $elements.find('.post-title a').attr('href');
            const title = $elements.find('.post-title a').text().trim();
            const date = $elements.find('.post-on span').text().trim();
            const chapters = $elements.find('.chapter-item a').map((i, e) => {
                return {
                    c_title: $(e).text().trim(),
                    c_url: $(e).attr('href')
                };
            }).get();

            m_list.push({
                title: title,
                image: image,
                url: url,
                date: date,
                chapters: chapters
            });
        });



        return {
            p_title: p_title,
            list: m_list,
        };
    } catch (error) {
        return { error: 'Sorry dude, an error occurred! No Latest!' };
    }
}




async function chapter(manga, chapter) {
    try {
        // Make HTTP request
        const res = await axios.get(`https://mangarolls.net/manga/${manga}/${chapter}`);
        const body = res.data;

        // Load HTML content using Cheerio
        const $ = cheerio.load(body);

        // Initialize array to store chapter images
      let ch_list = [];

// Extract chapter images
$('.reading-content .page-break img').each((index, element) => {
    const $element = $(element);
    const src = $element.attr('data-src'); // Access data-src attribute instead of src
    if (src) {
        const image = src.trim();
        ch_list.push({ 'ch': image });
    }
});

        // Extract manga title and URL
        const manga_title = $('#chapter-heading').text().trim();
        const manga_url = $('.breadcrumb > li:nth-child(2) > a:nth-child(1)').attr('href');

        // Extract current chapter and navigation links
        const current_ch = $('.active').text().trim();
        const prev = $('.prev_page').attr('href');
        const next = $('.next_page').attr('href');

        // Return chapter information
        return {
            'manga': manga_title,
            'manga_url': manga_url,
            'current_ch': current_ch,
            'chapters': ch_list,
            'nav': [{
                'prev': prev,
                'next': next
            }]
        };
    } catch (error) {
        // Handle errors
        console.error('Error fetching chapter:', error);
        return { 'error': 'Sorry, an error occurred while fetching chapter images.' };
    }
}

async function searchManga(query) {
    let m_list = [];

    try {
        const url = `https://mangarolls.net/?s=${query}&post_type=wp-manga&op=&author=&artist=&release=&adult=`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let p_title = $('.c-blog__heading h1').text().trim();

        $('.c-tabs-item__content').each((index, element) => {
            const $row = $(element);

            const manga = {};

            manga.title = $row.find('.post-title h3 a').text().trim();
            manga.url = $row.find('.post-title h3 a').attr('href');
            manga.rating = $row.find('.score').text().trim();
            manga.image = $row.find('.tab-thumb img').attr('data-src').replace(/-\d+x\d+/, '');

            manga.chapters = $row.find('.latest-chap .chapter').map((idx, el) => {
                const $chapter = $(el);
                const chapterTitle = $chapter.find('a').text().trim();
                const chapterUrl = $chapter.find('a').attr('href');
                return { c_title: chapterTitle, c_url: chapterUrl, c_date: '' };
            }).get();

            m_list.push(manga);
        });

        let current = $('.current').text();
        let last_page = $('.last').attr('href');
        !last_page ? last_page = current : last_page;

        return {
            'p_title': p_title,
            'list': m_list,
            'current_page': parseInt(current),
            'last_page': parseInt(last_page.replace(/[^0-9]/g, ''))
        };
    } catch (error) {
        return { 'error': 'Sorry dude, an error occurred! No Latest!' };
    }
}




module.exports = {
newPopular,
scrapeMangaItems,
latestUpdate,
searchManga,
    info,
    chaptersList,
    chapter,

}