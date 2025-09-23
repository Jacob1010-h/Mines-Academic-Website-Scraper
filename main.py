# for input and output operations
import io
import re

import pdfplumber
import requests
# for tree traversal scraping in webpage
from bs4 import BeautifulSoup
from bs4.element import Tag
import icalendar
import datetime as dt
import pprint
import dateutil.tz

headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0'}

def get_cal_website() -> bytes:
    url = "https://www.mines.edu/registrar/academic-calendar/"
    read = requests.get(url, headers=headers)
    return read.content

def get_all_pdf_links(html : bytes) -> list:
    soup = BeautifulSoup(html, 'html.parser')
    links = soup.find_all('a')
    pdf_links = []
    for link in links:
        assert isinstance(link, Tag)
        if link.has_attr('href'):
            href = link['href']
            if isinstance(href, str) and href.endswith('.pdf'):
                pdf_links += [href]

    return pdf_links

def get_tables(desired_pdf_year : str ) -> list :
    print (pdfs[int(desired_pdf_year) - 1])
    response = requests.get(pdfs[int(desired_pdf_year) - 1], headers=headers)
    pdf_to_bytes = io.BytesIO(response.content)
    with pdfplumber.open(pdf_to_bytes) as pdf_links:
        all_tables = []

        for _, page in enumerate(pdf_links.pages):

            _tables = page.extract_tables()
            # print (tables)
            if _tables:
                for table in _tables:
                    array_table = [list(row) for row in table]
                    transposed_table = list(map(list,
                                                zip(*array_table)))
                    all_tables.append(transposed_table)
            else:
                print("No Table found on page %d" % (_+1))
            print("------End of Page %d------" % (_+1))
    return all_tables

def print_pdf_info(year, pdf_list : list):
    # get all the names for each link
    pdf_names = []
    
    pdfs_correct_year = pdf_list.copy()
    for pdf in pdf_list:
        if year not in pdf:
            pdfs_correct_year.remove(pdf)
            continue

        split = pdf.split('/')
        pdf_names += split[-1:]

    print("Here are the pdfs with the desired year...")
    if not pdfs_correct_year:
        raise Exception("No PDFs found for %s" % year)

    for i, pdf in enumerate(pdfs_correct_year):
        print("PDF %d/%d" % (i + 1, len(pdfs_correct_year)))
        print("Name: " + pdf_names[i])
        print("Link: " + pdf)
        print("--------------")

def create_event_dict(tables : list) -> dict:
    skip_pattern = re.compile(r'\b(?:6|8)\b\s*-?\s*Week Session', re.IGNORECASE)
    semester_pattern = re.compile(r'^(Fall|Spring|Summer)\s+\d{4}$', re.IGNORECASE)
    long_session_pattern = re.compile(r'\b(?:14|16)\b\s*-?\s*Week Session', re.IGNORECASE)

    assert isinstance(long_session_pattern, re.Pattern)
    assert isinstance(skip_pattern, re.Pattern)
    assert isinstance(semester_pattern, re.Pattern)
    
    events = {}
    last_season = None

    assert isinstance(last_season, str | None)

    # step through pairs of columns
    for col_idx in range(0, len(tables) - 1, 2):
        names_col = tables[col_idx][0]   # unpack inner list
        dates_col = tables[col_idx + 1][0]

        assert isinstance(names_col, list)
        assert isinstance(dates_col, list)
        
        if not names_col or not dates_col:
            continue

        header = names_col[0].strip()
        assert isinstance(header, str) 

        if not semester_pattern.match(header):
            continue

        last_season = header.capitalize()
        if last_season not in events:
            events[last_season] = {}

        session_header = dates_col[0].strip()
        if skip_pattern.search(session_header):
            continue
        if not long_session_pattern.search(session_header):
            session_header = None  # only keep 14/16-week sessions

        # Now walk through names and dates in sync
        for name, date in zip(names_col[1:], dates_col[1:]):
            name = name.strip() if name else ""
            date = date.strip() if date else ""
            if not name and not date:
                continue

            key = f"event {len(events[last_season]) + 1}"
            events[last_season][key] = {
                "name": name,
                "date": date,
                "session": session_header,
            }

    return events


if __name__ == '__main__':
    website_html = get_cal_website()
    pdfs = get_all_pdf_links(website_html)

    year = input("What calendar year are you looking for? (format: YYYY)")
    
    print_pdf_info(year, pdf_list=pdfs)

    desired_pdf = input("What pdf are you looking for?")
    print("\n\n\n")
    print("Retrieving pdf information...")

    tables = get_tables(desired_pdf_year=desired_pdf)
    
    events = create_event_dict(tables=tables)

    pprint.pprint(events)

    #TODO: Create a Event with the name, desc, and date (placeholder date for now)
        
    calendar = icalendar.Calendar()
    calendar.add("X-WR-CALNAME", "Mines Academic Caleendar")

    for season in events.values():
        assert isinstance(season, dict)
        event_dict = season.values()
        event_dict = list(event_dict)
        assert isinstance(event_dict, list)
        
        for event in event_dict:
            assert isinstance(event, dict)
            name = event["name"]
            desc = event["session"]
            date_parse = event["date"]

            assert isinstance(name, str)
            assert isinstance(desc, str)
            assert isinstance(date_parse, str)
            
            # Month and day(s), Year (weekday(s))
            date_parse = date_parse.split(",")
            month_day_parse = date_parse[0]
            year_weekday_parse = date_parse[1]

            #Get the month in the first half of the string
            month_day_parse = month_day_parse.split(" ")
            month_start = month_day_parse[0]
            month_end = month_day_parse[0]

            # Handle multiple days like August 16-17
            if "-" in month_day_parse[1]:
                day_start = month_day_parse[1].split("-")[0]
                day_end = month_day_parse[1].split("-")[1]
            else:
                day_start = month_day_parse[1]

            year_start = 2025
            month_start = 9
            day_start = 12

            year_end = 2025
            month_end = 9
            day_end = 12
            
            tz = dateutil.tz.gettz('America/Denver')
            
            e = icalendar.Event()
            e.add('name', name)
            e.add('dtstart', dt.datetime(year= year_start, month= month_start, day= day_start,tzinfo=tz))
            e.add('dtend', dt.datetime(year = year_end, month = month_end, day = day_end,tzinfo=tz))
            e.add('description', desc)

            calendar.add_component(e)

    # print(calendar.to_ical())




