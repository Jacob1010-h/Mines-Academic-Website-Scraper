import scrape from 'website-scraper'; // Only as ESM, no CommonJS
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio'; // Correct way to import cheerio

const includesAny = (text, strings) => {
    for (const string of strings) {
        if (text.includes(string)) {
            return true;
        }
    }
};

const checkNonCalendarText = (text) => {
    return includesAny(text, [
        'full calendar details and dates',
        'key dates summary',
        'Academic Calendar',
    ]);
};

const printProcessingSemester = (semester) => {
  console.log('---------------------------');
  console.log('Adding .... Semester: ' + semester);
  console.log('---------------------------');
}

const parseCalendar = (semesterCalendar, html) => {
    const $ = cheerio.load(html);

    console.log('Title: ' + $('title').text());

    $('div[class*="dipi_advanced_tabs_item"]').each((i, elem) => {
        // check if blank
        if ($(elem).text().trim() === '') {
            return;
        }

        // check if the elem.text() contains the words "Fall" or "Spring" or "Summer"
        if (includesAny($(elem).text(), ['Fall', 'Spring', 'Summer'])) {
            if (checkNonCalendarText($(elem).text())) {
                return;
            }

            const semester = $(elem).text().trim().split('\n')[0];
            printProcessingSemester(semester);

            // remove semester name from the text
            $(elem).text($(elem).text().replace(semester, ''));
            
            
            // each date has a "–" character, so split by that
           
const data = $(elem)
    .text()
    .split(/[\n–]/) // First, split based on newline or dash
    .map((date) => date.trim()) // Trim the whitespace around the text
    .filter((date) => date !== '') // Filter out empty strings
    .map((text) => {
        // Handle capitalized sentences or phrases followed by regular text
        return text
            .replace(/([a-z])([A-Z])/g, '$1|$2') // Split between lowercase and uppercase
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1|$2') // Split continuous uppercase followed by lowercase
            .split('|') // Now split at the pipe character
            .map(s => s.trim()) // Trim the parts after split
            .filter(s => s !== ''); // Remove any empty strings
    })
    .flat(); // Flatten any nested arrays

//console.log(data);

            const months = [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
            ];

            const calendar = {};

            let currentMonth = null;
            let currentDate = null;

            let elementToSkip = null;

            for (const element of data) {
                const month = months.find((m) =>
                    element.toUpperCase().includes(m.toUpperCase())
                );
                const date = element.split(' ')[1];
                if (month) {
                    currentMonth = month;
                    currentDate = date;
                } else if (currentMonth) {
                    if (!calendar[currentMonth]) {
                        calendar[currentMonth] = [];
                    }
                    if (calendar[currentMonth].length !== 0) {
                        var lastIndex = calendar[currentMonth].length - 1;
                        if (calendar[currentMonth][lastIndex].date === currentDate) {
                            var prev = calendar[currentMonth][lastIndex];
                            prev = {
                              date: prev.date,
                              event: prev.event,
                              desc: element,
                            }
                            
                            elementToSkip = element;
                            
                            calendar[currentMonth][lastIndex] = prev;
                        };
                    };
                    if (elementToSkip === element) {
                        continue;
                    }
                    calendar[currentMonth].push({
                        date: currentDate,
                        event: element,
                    });
                }
            }
            semesterCalendar[semester] = calendar;
        }
    });
};

const getCalendar = (options) => {
    // Delete result dir if it exists
    const semesterCalendar = {};
    if (fs.existsSync(options.directory)) {
        console.log('---------------------------');
        console.log('Directory already exists');
        console.log('---------------------------\n\n\n');

        const html = fs.readFileSync(
            path.join(options.directory, 'index.html'),
            'utf8'
        );

        parseCalendar(semesterCalendar, html);

        Object.keys(semesterCalendar).forEach((semester) => {
          console.log('-----' + semester + '-----');
          console.log(semesterCalendar[semester]); });
        return; // Break early
    }

    // Scrape the website
    scrape(options)
        .then((result) => {
            console.log('Website successfully downloaded');
            console.log('---------------------------');
            console.log(result);
            console.log('---------------------------');

            // parseCalendar(html);
        })
        .catch((err) => {
            console.error('Could not get result from website', err);
        });
};

export default getCalendar;
