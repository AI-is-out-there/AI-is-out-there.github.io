"""Check citation selection against ambiguous and unsafe metadata."""
import unittest
from refresh_publications import SELECTION, render, select_works


def fixture():
    return {'group': [{'work-summary': [{
        'title': {'title': {'value': ' '.join(words) + ' <study>'}},
        'publication-date': {'year': {'value': '2024'}},
        'journal-title': {'value': 'A & B'},
        'external-ids': {'external-id': [{
            'external-id-type': 'doi', 'external-id-value': f'10.1234/study-{i}',
            'external-id-relationship': 'self'}]},
    }]} for i, (words, _) in enumerate(SELECTION)]}


class PublicationTests(unittest.TestCase):
    def test_render_escapes_metadata_and_links_to_doi(self):
        output = render(select_works(fixture()))
        self.assertIn('https://doi.org/10.1234/study-0', output)
        self.assertIn('&lt;study&gt;', output)
        self.assertIn('A &amp; B', output)

    def test_missing_or_ambiguous_identifiers_fail(self):
        data = fixture()
        data['group'][0]['work-summary'][0]['external-ids']['external-id'] = []
        with self.assertRaises(ValueError):
            select_works(data)
        data = fixture()
        extra = fixture()['group'][0]
        extra['work-summary'][0]['external-ids']['external-id'][0]['external-id-value'] = '10.1234/other'
        data['group'].append(extra)
        with self.assertRaises(ValueError):
            select_works(data)

    def test_related_work_doi_is_not_used_as_this_papers_doi(self):
        data = fixture()
        data['group'][0]['work-summary'][0]['external-ids']['external-id'][0]['external-id-relationship'] = 'part-of'
        with self.assertRaises(ValueError):
            select_works(data)

    def test_invalid_doi_is_rejected(self):
        data = fixture()
        data['group'][0]['work-summary'][0]['external-ids']['external-id'][0]['external-id-value'] = 'javascript:alert(1)'
        with self.assertRaises(ValueError):
            select_works(data)


if __name__ == '__main__':
    unittest.main()
