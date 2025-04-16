# Colorado School Of Mines Website Scaper
This project when installed will scrape the academic school calendar for all the useful information about the upcoming semesters.

## Instillation 
Once you have cloned the repository, `cd` into the directory where you installed it and run the following command.
```bash
npm install
```
This will install of the requirements that are listed for the code to run. 

After installing, run the following command.
```bash
node makeiCal.mjs
```

This will create a folder called results, installing the HTML for the page into a `index.html` file as to now over burden the mines website. 

Once this is done, open google calendar, create a new calendar, and select import from file. Select the new file that is in `website-scraper` called `academicCalendar.ics`. 

This will import all events for the following 3 semesters that are on the mines website into one calendar with their appropriate descriptions and etc.