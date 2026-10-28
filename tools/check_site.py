"""Check local assets, fragment links, duplicate IDs and ARIA references."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.references = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                self.errors.append(f"Duplicate id: {attrs['id']}")
            self.ids.add(attrs['id'])
        for attr in ['src', 'href']:
            if attrs.get(attr):
                self.references.append(('url', attrs[attr]))
        for attr in ['aria-controls', 'aria-labelledby', 'aria-describedby']:
            for value in attrs.get(attr, '').split():
                self.references.append(('id', value))
        if tag == 'img' and 'alt' not in attrs:
            self.errors.append('Image is missing alt text')


def check():
    parser = SiteParser()
    parser.feed((ROOT / 'index.html').read_text())
    for kind, value in parser.references:
        if kind == 'id':
            if value not in parser.ids:
                parser.errors.append(f'Missing ARIA target: {value}')
            continue
        url = urlsplit(value)
        if url.scheme or url.netloc:
            continue
        if url.path and not (ROOT / unquote(url.path)).is_file():
            parser.errors.append(f'Missing local file: {url.path}')
        if not url.path and url.fragment and url.fragment not in parser.ids:
            parser.errors.append(f'Missing fragment: {url.fragment}')
    for svg in (ROOT / 'assets').glob('*.svg'):
        ET.parse(svg)
    if parser.errors:
        raise SystemExit('\n'.join(parser.errors))
    print('Local asset, fragment, ARIA reference and SVG checks passed.')


if __name__ == '__main__':
    check()
