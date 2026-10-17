import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PatternApi } from './pattern-api';

const VALID_PATTERN = {
  id: 'rag',
  title: 'Retrieval-augmented generation',
  summary: 'Ground answers.',
  status: 'published',
};

describe('PatternApi', () => {
  let api: PatternApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(PatternApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('returns the validated patterns', async () => {
    const patterns = firstValueFrom(api.list(), { defaultValue: [] });
    http.expectOne('data/patterns.json').flush([VALID_PATTERN]);
    await expect(patterns).resolves.toStrictEqual([VALID_PATTERN]);
  });

  it('rejects a response that does not match the schema', async () => {
    const patterns = firstValueFrom(api.list(), { defaultValue: [] });
    http.expectOne('data/patterns.json').flush([{ ...VALID_PATTERN, status: 'unknown' }]);
    await expect(patterns).rejects.toThrow();
  });
});
