import ical, {ICalCalendarMethod} from 'ical-generator';

const calendar = ical({name: 'Academic Calendar'});

// A method is required for outlook to display event as an invitation
calendar.method(ICalCalendarMethod.REQUEST);

const startTime = new Date();
const endTime = new Date();
endTime.setHours(startTime.getHours()+1);

const eventObj = {
  start: undefined,
  end: undefined,
  summary: undefined,
  description: undefined,
  location: undefined,
  url: undefined,
}

calendar.createEvent({
    start: eventObj.start,
    end: eventObj.end,
    summary: eventObj.summary,
    description: eventObj.description,
    location: eventObj.location,
    url: eventObj.url,
});
