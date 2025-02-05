import scrape from "website-scraper"; // Only as ESM, no CommonJS
import fs from "fs";
import path from "path";
import { parseCalendar } from "./prepCalendar.mjs";

const getCalendar = (options) => {
  // Delete result dir if it exists
  const semesterCalendar = {};
  if (fs.existsSync(options.directory)) {
    console.log("---------------------------");
    console.log("Directory already exists");
    console.log("---------------------------\n\n\n");

    const html = fs.readFileSync(
      path.join(options.directory, "index.html"),
      "utf8",
    );

    parseCalendar(semesterCalendar, html);

    return semesterCalendar;
  }

  // Scrape the website
  scrape(options)
    .then((result) => {
      console.log("Website successfully downloaded");
      console.log("---------------------------");
      console.log(result);
      console.log("---------------------------");

      // parseCalendar(html);
    })
    .catch((err) => {
      console.error("Could not get result from website", err);
    });
};

export default getCalendar;
