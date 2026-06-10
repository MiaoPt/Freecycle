const { chromium } = require('playwright');
const fs = require('fs');
const { sendEmail } = require('./email-setup.js');

//Scrape every 6 hours
const cron = require('node-cron');

cron.schedule('0 */6 * * *', async () => {
    console.log('Run scraper at: ', new Date().toLocaleTimeString());
    try {
        await scrapeFreecycle();
    } catch (error) {
        console.error('Error in scheduled job:' , error);
    }
});


// Log function
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry =  `[${timestamp} ${level} ${message}]`;
    console.log(logEntry);
    
    try{
        fs.appendFileSync('scrape.log', `\n${logEntry}`)
    } catch (error) {
        console.error(`${error.message}`, 'Fail to write to log file') 
        }     
    }

//Scrape function
(async function scrapeFreecycle () {
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    try{
        let seenPosts = {};
        
        try {
            const data = fs.readFileSync('seen-posts.json', 'utf8');
            seenPosts = JSON.parse(data);
            
            
        } catch (error) {
            log(`${error.message}`, 'ERROR');
            seenPosts = {};
        }

        const searchTerms = process.env.SEARCH_ITEMS.split(',') || ['cutlery'];
        let emailHtml = '<h2>New Freecycle Posts</h2><ol>';
        const emailSubject = `New Freecycle Items Found`;
        let newPostsTotal = 0;

        for (const searchTerm of searchTerms) {
            try{
                const page = await browser.newPage();
                await page.goto('https://freecycle.org/', {timeout: 60000});
                const disagreeButton = page.locator('button').filter({ hasText: 'DISAGREE'});
                if (await disagreeButton.count() > 0) {
                    await disagreeButton.click();
                };

                try {
                    await page.getByRole('searchbox', { name: 'Search for items...' }).type(searchTerm); 
                } catch(error) {
                    log(`${error.message}`, 'ERROR')
                }

                await page.locator('form').filter({ hasText: 'Searching... All My Towns' }).getByRole('button').click();
                await page.getByText('Offer', {exact: true}).click();

                let currentPosts = [];
                const posts = await page.locator('.post-list-item').all();

                for (const post of posts) {
                    const title = await post.locator('h4').first().textContent();
                    const id = await post.getAttribute('data-id');
                    const description = await post.getByRole('paragraph').textContent();
                    currentPosts.push ({
                        id,
                        title,
                        description
                    });
                };
                
                if (!seenPosts[searchTerm]) {
                    seenPosts[searchTerm] = [];
                }
                const seenIDs = seenPosts[searchTerm].map(post => post.id);
                const newPosts = currentPosts.filter(post => !seenIDs.includes(post.id));
                

                
                if (newPosts.length > 0) { 
                    newPostsTotal += newPosts.length;
                        for (const post of newPosts) {
                            emailHtml += `
                                <li>
                                <strong><a href="https://freecycle.org/posts/${post.id}">${post.title}</a></strong>
                                <br>
                                ${post.description}
                                <br>
                                ${post.id}
                                <br>
                                </li>
                            `  
                        }
                
                seenPosts[searchTerm] = currentPosts;    
                
                    
                } else {
                    log(`New ${searchTerm} not found!`, 'SUCCESS')
                }
            
            } catch (error) {
                log(`${error.message}`, 'ERROR');
                await sendEmail('Scraper Error:', error.message);
            }
            
        }
        try {
            fs.writeFileSync('seen-posts.json', JSON.stringify(seenPosts), null, 2);
        } catch (error) {
            log(`${error.message}`, 'Failed to save seen-posts.json')
        }
        
        emailHtml += '</ol>';
        if (newPostsTotal > 0 ) {
            await sendEmail(emailSubject, emailHtml);
            await browser.close();
        } 

    } catch (error) {
        log(`${error.message}`, 'ERROR');
    } finally {
        if (browser) await browser.close();
    }

})();


