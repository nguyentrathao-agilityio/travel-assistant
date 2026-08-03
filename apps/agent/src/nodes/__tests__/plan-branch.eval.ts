import { createTrajectoryMatchEvaluator } from 'agentevals';
import { beforeAll, describe, expect, it } from 'vitest';

import { expectedToolCalls, runBranch } from './eval-helpers';

describe.skipIf(!process.env.OPENAI_API_KEY)('plan branch tool selection', () => {
  let planBranch: Awaited<typeof import('../branches')>['planBranch'];

  beforeAll(async () => {
    ({ planBranch } = await import('../branches'));
  });

  const evaluator = createTrajectoryMatchEvaluator({
    trajectoryMatchMode: 'superset',
    toolArgsMatchMode: 'ignore',
  });

  const scenarios: Array<{
    name: string;
    humanText: string;
    expectedTools: string[];
    extraState?: Record<string, unknown>;
  }> = [
    {
      name: 'weather question',
      humanText: "What's the weather like in Tokyo next week?",
      expectedTools: ['weatherTool'],
      extraState: { clientDate: '2026-08-01', clientTimezone: 'Asia/Ho_Chi_Minh' },
    },
    {
      name: 'flight search',
      humanText: 'Find me flights from Hanoi to Tokyo on August 15',
      expectedTools: ['flightsTool'],
    },
    {
      name: 'hotel search',
      humanText: 'Find me a hotel in Da Nang for 3 nights starting September 1',
      expectedTools: ['hotelTool'],
    },
    {
      name: 'landmark tour request',
      humanText: 'Can you plan a one-day landmark tour of Hanoi with travel times between stops?',
      expectedTools: ['routeTool'],
    },
    {
      name: 'itinerary summary request',
      humanText: 'Put together a full itinerary summary for my Tokyo trip, flying from Hanoi (HAN)',
      expectedTools: ['tripSummaryTool'],
    },
    {
      name: 'visa/entry knowledge question',
      humanText: 'What documents do I need to enter South Korea as a Vietnamese citizen?',
      expectedTools: ['knowledgeSearchTool'],
    },
  ];

  it.each(scenarios)(
    '$name -> calls $expectedTools',
    async ({ humanText, expectedTools, extraState }) => {
      const trajectory = await runBranch(planBranch, humanText, extraState);
      const evaluation = await evaluator({
        outputs: { messages: trajectory },
        referenceOutputs: expectedToolCalls(expectedTools),
      });

      expect(evaluation.score, evaluation.comment).toBe(true);
    }
  );
});
