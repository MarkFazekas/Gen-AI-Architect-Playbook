// Commit format (from the reference project): "<type>: <Subject> - GAAP-<number>"
// e.g. "feat: Add pattern list - GAAP-12"; use GAAP-0 when there is no ticket.
const TICKET_SUFFIX = / - GAAP-\d+( \(#\d+\))?$/;

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'header-ticket-suffix': ({ header }) => [
          TICKET_SUFFIX.test(header ?? ''),
          'header must end with " - GAAP-<number>" (use GAAP-0 when there is no ticket)',
        ],
      },
    },
  ],
  rules: {
    'header-ticket-suffix': [2, 'always'],
    // "feat: Add pattern list" style (sentence case) is the project convention
    'subject-case': [0],
  },
};
