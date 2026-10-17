import { type Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: async (): Promise<Route[]> => {
      const { patternRoutes } = await import('@playbook/feature-patterns');
      return patternRoutes;
    },
  },
  { path: '**', redirectTo: '' },
];
