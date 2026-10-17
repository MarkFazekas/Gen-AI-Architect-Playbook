import { patternRoutes } from './pattern.routes';
import { PatternList } from './pattern-list/pattern-list';

describe('patternRoutes', () => {
  it('shows the pattern list on the feature root', () => {
    expect(patternRoutes).toStrictEqual([{ path: '', component: PatternList, title: 'Patterns' }]);
  });
});
