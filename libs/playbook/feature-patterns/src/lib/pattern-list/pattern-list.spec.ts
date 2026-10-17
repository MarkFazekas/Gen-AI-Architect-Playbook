import { TestBed } from '@angular/core/testing';
import { type Pattern, PatternApi } from '@playbook/data-access';
import { of } from 'rxjs';

import { PatternList } from './pattern-list';

const PATTERNS: Pattern[] = [
  { id: 'rag', title: 'Retrieval-augmented generation', summary: 'Ground answers.', status: 'published' },
  { id: 'eval', title: 'Evaluation harness', summary: 'Measure quality.', status: 'draft' },
];

describe('PatternList', () => {
  it('renders one card per pattern', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PatternApi, useValue: { list: () => of(PATTERNS) } }] });
    const fixture = TestBed.createComponent(PatternList);
    await fixture.whenStable();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('pb-pattern-card');
    expect(cards).toHaveLength(2);
  });

  it('shows the empty state without patterns', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PatternApi, useValue: { list: () => of([]) } }] });
    const fixture = TestBed.createComponent(PatternList);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.empty')?.textContent).toContain('No patterns yet.');
  });
});
