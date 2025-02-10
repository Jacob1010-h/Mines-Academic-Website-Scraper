import getCalendar from './getCalendar.mjs';
// Scraping options
const options = {
  urls: ['https://www.mines.edu/registrar/academic-calendar/'],
  directory: './result',
};

getCalendar(options);
