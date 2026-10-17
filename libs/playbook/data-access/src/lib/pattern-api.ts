import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { type Pattern, patternListSchema } from './pattern';

const PATTERNS_URL = 'data/patterns.json';

/** Loads playbook patterns and validates them at runtime. */
@Service()
export class PatternApi {
  private readonly http = inject(HttpClient);

  /**
   * Returns the list of patterns.
   * @returns The validated patterns; the stream errors when the response does not match the schema.
   */
  list(): Observable<Pattern[]> {
    return this.http.get<unknown>(PATTERNS_URL).pipe(map((body) => patternListSchema.parse(body)));
  }
}
