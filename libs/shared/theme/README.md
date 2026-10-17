# shared-theme

The single source of the visual identity (Angular Material 3): color palettes, typography, shape, density,
light/dark mode and high contrast. Components use tokens only (`--mat-sys-*`, `--pb-*`).

- `src/_theme-colors.scss`: generated palettes, do not edit by hand (see the command in `src/theme.scss`).
- `src/_fonts.scss`: self-hosted IBM Plex faces (latin, woff2; files copied by the app build).
- `src/_tokens.scss`: spacing and layout tokens.
- `src/theme.scss`: the theme configuration, included by the app build.
