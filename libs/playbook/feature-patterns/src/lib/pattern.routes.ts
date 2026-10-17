import { type Route } from '@angular/router';

import { PatternList } from './pattern-list/pattern-list';

export const patternRoutes: Route[] = [{ path: '', component: PatternList, title: 'Patterns' }];
