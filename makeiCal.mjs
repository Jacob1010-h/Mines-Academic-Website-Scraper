import * as icalToolkit from "ical-toolkit";
import getCalendar from "./getCalendar.mjs";
import fs from "fs";

// Scraping options
const options = {
  urls: ["https://www.mines.edu/registrar/academic-calendar/"],
  directory: "./result",
};

var academicCalendar = getCalendar(options);
// Object.keys(academicCalendar).forEach((semester) => {
//   console.log("-----" + semester + "-----");
//   console.log(academicCalendar[semester]);
// });

var builder = icalToolkit.createIcsFileBuilder();

builder.calname = "Academic Calendar";
builder.tzid = "America/Denver";
builder.method = "REQUEST";

var baseEvent = {
  //Event start time, Required: type Date()
  start: new Date(),
  //Event end time, Required: type Date()
  end: new Date(),
  //transp. Will add TRANSP:OPAQUE to block calendar.
  transp: "OPAQUE",
  //Event summary, Required: type String
  summary: "Test Event",

  //All Optionals Below
  //Alarms, array in minutes
  alarms: [15, 10, 5],
  //Optional if all day event
  allDay: true,
  //Optional description of event.
  description: "Testing it!",
  //What to do on addition
  method: "PUBLISH",
  //Status of event
  status: "CONFIRMED",
  //Url for event on core application, Optional.
  url: "https://www.mines.edu/registrar/academic-calendar/",
};

var addEvent = (startDate, endDate, event, modifiedEvent) => {
  modifiedEvent.start = startDate;
  modifiedEvent.end = endDate;
  modifiedEvent.summary = event.name;
  modifiedEvent.description = event.description;
  builder.events.push(modifiedEvent);
  console.log("Event added: " + modifiedEvent.summary + " | " + "Discription: " + modifiedEvent.description + " |  Start: " + modifiedEvent.start.toLocaleString() + " | End: " + modifiedEvent.end.toLocaleString());
}

Object.keys(academicCalendar).forEach((semester) => {
  console.log("-----" + semester + "-----");
  Object.keys(academicCalendar[semester]).forEach((date) => {
    var event = academicCalendar[semester][date];
    console.log("-----" + event.date + "-----");

    console.log(event);

    let modifiedEvent = JSON.parse(JSON.stringify(baseEvent));
    //Declaration of dates 
    let startDate;
    let endDate;
    const year = semester.split(" ")[1];
    // There is a special case where there is a comma in the date
    if (event.date.includes(", ")) {
      let first = event.date.split(", ")[0]
      let second = event.date.split(", ")[1]
      let month1 = first.split(" ")[0]
      let month2 = second.split(" ")[0]
      let firstStart = new Date(month1 + " " + first.split(" ")[1].split("-")[0] + ", " + year);
      let firstEnd = new Date(month1 + " " + first.split(" ")[1].split("-")[1] + ", " + year);
      let secondStart = new Date(month2 + " " + second.split(" ")[1].split("-")[0] + ", " + year);
      let secondEnd = new Date(month2 + " " + second.split(" ")[1].split("-")[1] + ", " + year);
      if (firstStart.getTime() === firstEnd.getTime()) {
        firstEnd.setHours(23, 59, 59, 999);
      } else {
        firstEnd.setDate(firstEnd.getDate() + 1);
      }
      if (secondStart.getTime() === secondEnd.getTime()) {
        secondEnd.setHours(23, 59, 59, 999);
      } else {
        secondEnd.setDate(secondEnd.getDate() + 1);
      }
      addEvent(firstStart, firstEnd, event, modifiedEvent);
      modifiedEvent = JSON.parse(JSON.stringify(baseEvent));
      addEvent(secondStart, secondEnd, event, modifiedEvent);
      modifiedEvent = JSON.parse(JSON.stringify(baseEvent));
      // console.log("FirstStart: " + firstStart.toLocaleString() + " | FirstEnd: " + firstEnd.toLocaleString() + " | SecondStart: " + secondStart.toLocaleString() + " | SecondEnd: " + secondEnd.toLocaleString());
      return;
    }
    // if the string has " - " we know that there are two dates
    if (event.date.includes(" - ")) {
      startDate = event.date.split(" - ")[0];
      endDate = event.date.split(" - ")[1];
      startDate = new Date(startDate + ", " + year);
      endDate = new Date(endDate + ", " + year);
      // console.log("Start Date: " + startDate.toLocaleString() + " | End Date: " + endDate.toLocaleString());
      if (startDate.getTime() === endDate.getTime()) {
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setDate(endDate.getDate() + 1);
      }
      addEvent(startDate, endDate, event, modifiedEvent);
      return;
    }
    if (event.date.includes(" & ")) {
      if (event.date.includes("-")) {
        let first = event.date.split(" & ")[0].split(" ")[1].split("-")
        let second = event.date.split(" & ")[1].split("-")
        let month = event.date.split(" & ")[0].split(" ")[0]
        let firstStart = new Date(month + " " + first[0] + ", " + year);
        let firstEnd = new Date(month + " " + first[1] + ", " + year);
        let secondStart = new Date(month + " " + second[0] + ", " + year);
        let secondEnd = new Date(month + " " + second[1] + ", " + year);
        if (firstStart.getTime() === firstEnd.getTime()) {
          firstEnd.setHours(23, 59, 59, 999);
        } else {
          firstEnd.setDate(firstEnd.getDate() + 1);
        }
        if (secondStart.getTime() === secondEnd.getTime()) {
          secondEnd.setHours(23, 59, 59, 999);
        } else {
          secondEnd.setDate(secondEnd.getDate() + 1);
        }
        // console.log("Month: " + month + " | Start Range: " + first[0] + " - " + first[1] + " | End Range: " + second[0] + " - " + second[1]);
        addEvent(firstStart, firstEnd, event, modifiedEvent);
        modifiedEvent = JSON.parse(JSON.stringify(baseEvent));
        addEvent(secondStart, secondEnd, event, modifiedEvent);
        modifiedEvent = JSON.parse(JSON.stringify(baseEvent));
        return;
      }
      // get the first half of the date ( the one with the month )
      // add the month to the second half of the date
      let first = event.date.split(" & ")[0]
      let second = event.date.split(" & ")[1]
      startDate = new Date(first + ", " + year);
      endDate = new Date(first.split(" ")[0] + " " + second + ", " + year);
      if (startDate.getTime() === endDate.getTime()) {
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setDate(endDate.getDate() + 1);
      }
      // console.log("Start Date: " + startDate.toLocaleString() + " | End Date: " + endDate.toLocaleString());
      addEvent(startDate, endDate, event, modifiedEvent);
      return;
    }
    if (event.date.includes("-")) {
      // does the date have nwo months or two numbers?
      if (event.date.split("-")[1].includes(" ")) {
        let month1 = event.date.split("-")[0].split(" ")[0];
        let month2 = event.date.split("-")[1].split(" ")[0];
        let firstStart = new Date(month1 + " " + event.date.split("-")[0].split(" ")[1] + ", " + year);
        let firstEnd = new Date(month1 + " " + event.date.split("-")[0].split(" ")[1] + ", " + year);
        let secondStart = new Date(month2 + " " + event.date.split("-")[1].split(" ")[1] + ", " + year);
        let secondEnd = new Date(month2 + " " + event.date.split("-")[1].split(" ")[1] + ", " + year);
        if (firstStart.getTime() === firstEnd.getTime()) {
          firstEnd.setHours(23, 59, 59, 999);
        } else {
          firstEnd.setDate(firstEnd.getDate() + 1);
        }
        if (secondStart.getTime() === secondEnd.getTime()) {
          secondEnd.setHours(23, 59, 59, 999);
        } else {
          secondEnd.setDate(secondEnd.getDate() + 1);
        }
        // console.log("FirstStart: " + firstStart.toLocaleString() + " | FirstEnd: " + firstEnd.toLocaleString() + " | SecondStart: " + secondStart.toLocaleString() + " | SecondEnd: " + secondEnd.toLocaleString());
        addEvent(firstStart, firstEnd, event, modifiedEvent);
        modifiedEvent = JSON.parse(JSON.stringify(baseEvent));
        addEvent(secondStart, secondEnd, event, modifiedEvent);
        modifiedEvent = JSON.parse(JSON.stringify(baseEvent));
        return;
      }
      let month = event.date.split(" ")[0];
      let start = event.date.split(" ")[1].split("-")[0];
      let end = event.date.split(" ")[1].split("-")[1];
      startDate = new Date(month + " " + start + ", " + year);
      endDate = new Date(month + " " + end + ", " + year);
      if (startDate.getTime() === endDate.getTime()) {
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setDate(endDate.getDate() + 1);
      }
      addEvent(startDate, endDate, event, modifiedEvent);
      return;
    }
    startDate = new Date(event.date + ", " + year);
    endDate = new Date(event.date + ", " + year);
    if (startDate.getTime() === endDate.getTime()) {
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate.setDate(endDate.getDate() + 1);
    }
    // console.log("Start Date: " + startDate.toLocaleString() + " | End Date: " + endDate.toLocaleString());
    addEvent(startDate, endDate, event, modifiedEvent);
    return;
  });
});

//Try to build
var icsFileContent = builder.toString();

// console.log(icsFileContent);

//Check if there was an error (Only required if yu configured to return error, else error will be thrown.)
if (icsFileContent instanceof Error) {
  console.log("Returned Error, you can also configure to throw errors!");
  //handle error
}

//Here isteh ics file content.
fs.writeFileSync("academicCalendar.ical", icsFileContent);
// console.log(icsFileContent);
