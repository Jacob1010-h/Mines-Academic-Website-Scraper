# for input and output operations
import io
import re

import pdfplumber
import requests
# for tree traversal scraping in webpage
from bs4 import BeautifulSoup
from icalendar import *

headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0'}


def get_cal_website():
    url = "https://www.mines.edu/registrar/academic-calendar/"
    read = requests.get(url, headers=headers)
    return read.content

def get_all_pdf_links(html):
    soup = BeautifulSoup(html, 'html.parser')
    links = soup.find_all('a')
    pdf_links = []
    for link in links:
        if link.has_attr('href'):
            link = link['href']
            if link.endswith('.pdf'):
                pdf_links += [link]

    return pdf_links

def get_tables(desired_pdf_year):
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

if __name__ == '__main__':
    website_html = get_cal_website()
    pdfs = get_all_pdf_links(website_html)

    year = input("What calendar year are you looking for? (format: YYYY)")

    # get all the names for each link
    pdf_names = []
    for i in range(len(pdfs) - 1, -1, -1):
        if year not in pdfs[i]:
            pdfs.pop(i)
            continue
        split = pdfs[i].split('/')

        # get the end of the link
        pdf_names += split[-1:]

    print("Here are the pdfs with the desired year...")
    if not pdfs:
        raise Exception("No PDFs found for %s" % year)

    for i, pdf in enumerate(pdfs):
        print("PDF %d/%d" % (i + 1, len(pdfs)))
        print("Name: " + pdf_names[i])
        print("Link: " + pdf)
        print("--------------")

    desired_pdf = input("What pdf are you looking for?")
    print("\n\n\n")
    print("Retrieving pdf information...")

    tables = get_tables(desired_pdf_year=desired_pdf)

    # pprint(all_tables)

    ical = Calendar()

    names = []
    last_index = -1
    for i,col in enumerate(tables):
        for item in col:
            if re.match(r"^Fall \d{4}$", item[0].capitalize()) or re.match(r"^Fall \d{4}$", item[0].capitalize()):
                last_index = i
            if last_index is i:
                names += item
        # print(col[0])
        # print("----")

    print(names)

    # event = Event()
    # event.add('name', name)
    # event.add('dtstart', datetime(year, month, day, 0,0,0, 0, tzinfo=pytz.utc))
    # event.add('dtend', datetime(year, month, day,0,0,0,0,tzinfo=pytz.utc))
