import axios from "axios";
import fs from "fs";
import path from "path";
import { parseCalendar } from "./prepCalendar.mjs";

const getCalendar = async (options) => {
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
  } else {
    // Create the directory if it does not exist
    fs.mkdirSync(options.directory, { recursive: true });
  }

  await axios.get(options.urls[0]).then((response) => {
    console.log("Successfully downloaded website");
    console.log("---------------------------");
    console.log(response.data);
    console.log("---------------------------");
    fs.writeFileSync(
      path.join(options.directory, "index.html"),
      response.data,
    );
  }).catch((err) => {
    console.log("Error downloading website", err);
  })
};

export default getCalendar;
