const cron = require('node-cron');

cron.schedule('* * * * *', () => {
    console.log('Running scraper at:', new Date().toLocaleTimeString())
}
)