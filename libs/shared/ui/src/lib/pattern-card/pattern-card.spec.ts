import { TestBed } from '@angular/core/testing';

import { PatternCard } from './pattern-card';

describe('PatternCard', () => {
  it('renders the title, status and summary', async () => {
    const fixture = TestBed.createComponent(PatternCard);
    fixture.componentRef.setInput('title', 'Prompt chaining');
    fixture.componentRef.setInput('status', 'draft');
    fixture.componentRef.setInput('summary', 'Split a task into steps.');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('mat-card-title')?.textContent).toBe('Prompt chaining');
    expect(element.querySelector('.status')?.textContent).toBe('draft');
    expect(element.querySelector('.summary')?.textContent).toBe('Split a task into steps.');
  });
});
