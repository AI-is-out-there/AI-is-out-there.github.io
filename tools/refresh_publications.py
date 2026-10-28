"""Refresh the three selected citations from ORCID, without runtime API calls.

Requires only Python 3. Fails without modifying the site if any selected work
has no unique matching, self-referential DOI. Never guesses DOI identifiers.
"""
import argparse
import html
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ORCID = '0000-0003-0359-0897'
SELECTION = [
    (['interpretability', 'biomarkers'], 'Interpretable models and epileptic biomarkers.'),
    (['two', 'stage', 'outlier'], 'Outlier detection combined with deep learning for seizure analysis.'),
    (['extreme', 'value', 'theory'], 'Extreme-value methods for explainable seizure detection.'),
]
START = '      <!-- publications:start -->'
END = '      <!-- publications:end -->'


def normalize(value):
    return re.sub(r'[^a-z0-9]+', ' ', value.lower()).split()


def select_works(record):
    selected = []
    for words, focus in SELECTION:
        matches = []
        for group in record.get('group', []):
            for work in group.get('work-summary', []):
                title = work.get('title', {}).get('title', {}).get('value', '')
                if not all(word in normalize(title) for word in words):
                    continue
                ids = work.get('external-ids', {}).get('external-id', [])
                for identifier in ids:
                    relationship = identifier.get('external-id-relationship', 'self')
                    if identifier.get('external-id-type', '').lower() == 'doi' and relationship == 'self':
                        doi = identifier.get('external-id-value', '').strip()
                        doi = re.sub(r'^https?://(?:dx\.)?doi\.org/', '', doi, flags=re.I)
                        if not re.fullmatch(r'10\.\d{4,9}/[^\s<>"\x27]+', doi, flags=re.I):
                            raise ValueError(f'Invalid DOI for {title}')
                        date = work.get('publication-date') or {}
                        year = (date.get('year') or {}).get('value', '')
                        if not re.fullmatch(r'\d{4}', year):
                            raise ValueError(f'Missing publication year for {title}')
                        matches.append({'title': title, 'year': year,
                            'journal': (work.get('journal-title') or {}).get('value', ''),
                            'doi': doi, 'focus': focus})
        unique = {item['doi'].lower(): item for item in matches}
        if len(unique) != 1:
            raise ValueError(f"Expected one verified work for {' '.join(words)}, found {len(unique)}")
        selected.append(next(iter(unique.values())))
    return selected


def render(works):
    lines = [START, '      <div class="publication-list reveal">']
    for work in works:
        esc = lambda key: html.escape(work[key], quote=True)
        lines.append(f'        <a href="https://doi.org/{esc("doi")}" target="_blank" rel="noopener">'
                     f'<time datetime="{esc("year")}">{esc("year")}</time>'
                     f'<div><h3>{esc("title")}</h3><p class="publication-focus">{esc("focus")}</p></div>'
                     f'<p>{esc("journal")}</p><span aria-hidden="true">↗</span></a>')
    return '\n'.join(lines + ['      </div>', END])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Use a previously downloaded ORCID works JSON file')
    args = parser.parse_args()
    if args.input:
        record = json.loads(args.input.read_text())
    else:
        request = Request(f'https://pub.orcid.org/v3.0/{ORCID}/works',
                          headers={'Accept': 'application/json', 'User-Agent': 'DenisAndrikovPortfolio/1.0'})
        with urlopen(request, timeout=30) as response:
            record = json.load(response)
    works = select_works(record)
    page = ROOT / 'index.html'
    current = page.read_text()
    if current.count(START) != 1 or current.count(END) != 1:
        raise ValueError('Publication block markers are missing or duplicated')
    start, end = current.index(START), current.index(END) + len(END)
    page.write_text(current[:start] + render(works) + current[end:])
    print('Updated three selected publications from ORCID with verified DOI identifiers.')


if __name__ == '__main__':
    main()
