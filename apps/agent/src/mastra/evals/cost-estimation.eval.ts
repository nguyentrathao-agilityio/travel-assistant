import { evalite } from 'evalite';

import { estimateDailyCosts } from '../utils/cost-tier';
import { CostInRange } from './scorers/cost-range.scorer';

evalite('Daily Cost Estimation', {
  data: async () => [
    { input: 'Tokyo, Japan' },
    { input: 'Hanoi, Vietnam' },
    { input: 'Paris, France' },
    { input: 'Bangkok, Thailand' },
  ],
  task: async (input) => estimateDailyCosts(input),
  scorers: [CostInRange],
});
