import * as cheerio from "cheerio"; // Correct way to import cheerio

const includesAny = (text, strings) => {
  for (const string of strings) {
    if (text.includes(string)) {
      return true;
    }
  }
};

const checkNonCalendarText = (text) => {
  return includesAny(text, [
    "full calendar details and dates",
    "key dates summary",
    "Academic Calendar",
  ]);
};

const printProcessingSemester = (semester) => {
  console.log("---------------------------");
  console.log("Adding .... Semester: " + semester);
  console.log("---------------------------");
};

export const parseCalendar = (semesterCalendar, html) => {
  const $ = cheerio.load(html);

  console.log("Title: " + $("title").text());

  $('div[class*="dipi_advanced_tabs_item"]').each((i, elem) => {
    // check if blank
    if ($(elem).text().trim() === "") {
      return;
    }

    // check if the elem.text() contains the words "Fall" or "Spring" or "Summer"
    if (includesAny($(elem).text(), ["Fall", "Spring", "Summer"])) {
      if (checkNonCalendarText($(elem).text())) {
        return;
      }

      const semester = $(elem).text().trim().split("\n")[0];
      printProcessingSemester(semester);

      // remove semester name from the text
      $(elem).text($(elem).text().replace(semester, ""));

      // each date has a "–" character, so split by that
      const data = $(elem)
        .text()
        .split(/[\n–]/) // First, split based on newline or dash
        .map((date) => date.trim()) // Trim the whitespace around the text
        .filter((date) => date !== "") // Filter out empty strings
        .map((text) => {
          // Handle capitalized sentences or phrases followed by regular text
          return text
            .replace(/([a-z])([A-Z])/g, "$1|$2") // Split between lowercase and uppercase
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1|$2") // Split continuous uppercase followed by lowercase
            .split("|") // Now split at the pipe character
            .map((s) => s.trim()) // Trim the parts after split
            .filter((s) => s !== ""); // Remove any empty strings
        })
        .flat(); // Flatten any nested arrays

      //console.log(data);

      let events = []
      // console.log(data);
      let eventObj = {
        name: "",
        description: "",
        date: "",
      }
      for (let element of data) {
        const months = "(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)";
        const dayRange = "\\d{1,2}(-\\s?" + months + "?\\s?\\d{1,2})?"; // Supports ranges like "MARCH 31-APRIL 4"
        const singleDate = months + "\\s" + dayRange; // Supports "MAY 2", "OCTOBER 31-NOVEMBER 2"
        const dateWithAnd = singleDate + "(\\s?[&]\\s?" + dayRange + ")?"; // Handles "&" cases like "DECEMBER 12-13 & 15-17"
        const fullPattern = "^" + dateWithAnd + "(,\\s?" + dateWithAnd + ")*$"; // Supports multiple dates separated by commas
        const regex = new RegExp(fullPattern);

        // Some dates are not fully uppercase, so we need to check for that
        element = element.toUpperCase();
        // We get the date first in every case, then look for the following name then 
        // description in that order, if there is a name, but we scanned a date, we can add the event knowing we are at the next event in the list. 
        if (regex.test(element)) {
          // if the event does have a name, then add it  
          if (eventObj.name !== "") {
            events.push(eventObj);
            eventObj = {
              name: "",
              description: "",
              date: "",
            }
          }
          // if there is a seccond date, then add it with a "-"
          if (eventObj.date !== "") {
            eventObj.date = eventObj.date + " - " + element
          } else {
            // every time a date is scanned, add it to the eventObj
            eventObj = {
              name: "",
              description: "",
              date: element,
            }
          }

        } else {
          // if the event has a name already, then add a description, otherwise add the name
          if (eventObj.name !== "") {
            eventObj.description = element;
          } else {
            eventObj.name = element;
          }
          // if we are at the end of the list, still push the final event
          if (data.indexOf(element) === data.length - 1) {
            events.push(eventObj);
          }
        }
      }
      // console.log(events);
      semesterCalendar[semester] = events;
    }
  });
};
