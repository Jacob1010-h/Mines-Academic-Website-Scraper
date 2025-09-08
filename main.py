# for input and output operations
import io
import re

import pdfplumber
import requests
# for tree traversal scraping in webpage
from bs4 import BeautifulSoup
from bs4.element import Tag
from icalendar import *
import pprint

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

def print_pdf_info(pdf_list : list):
    # get all the names for each link
    pdf_names = []
    for i in range(len(pdf_list) - 1, -1, -1):
        if year not in pdf_list[i]:
            pdf_list.pop(i)
            continue
        split = pdf_list[i].split('/')

        # get the end of the link
        pdf_names += split[-1:]

    print("Here are the pdfs with the desired year...")
    if not pdf_list:
        raise Exception("No PDFs found for %s" % year)

    for i, pdf in enumerate(pdf_list):
        print("PDF %d/%d" % (i + 1, len(pdf_list)))
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
    
    print_pdf_info(pdf_list=pdfs)

    desired_pdf = input("What pdf are you looking for?")
    print("\n\n\n")
    print("Retrieving pdf information...")

    tables = get_tables(desired_pdf_year=desired_pdf)
    
    events = create_event_dict(tables=tables)

    pprint.pprint(events)

    #TODO: Create the events based on the dict that was just created

    # event = Event()
    # event.add('name', name)
    # event.add('dtstart', datetime(year, month, day, 0,0,0, 0, tzinfo=pytz.utc))
    # event.add('dtend', datetime(year, month, day,0,0,0,0,tzinfo=pytz.utc))
