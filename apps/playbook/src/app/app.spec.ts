import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  it('renders the product name in the toolbar', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const toolbar = (fixture.nativeElement as HTMLElement).querySelector('mat-toolbar');
    expect(toolbar?.textContent).toContain('Gen AI Architect Playbook');
  });
});
