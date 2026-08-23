import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', '.scratch/**', 'test-results/**'] },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      // Mock fixtures are an implementation detail of the service layer. Letting
      // a component import one would quietly undo the boundary in §24/§25.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/mocks/*', '**/mocks/*'],
              message:
                'Mock data must only be imported by services. UI must go through the service layer.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/services/**', 'src/mocks/**', 'src/app/api/**', 'src/**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
];

export default config;
