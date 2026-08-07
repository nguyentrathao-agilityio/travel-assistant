import { createTrajectoryMatchEvaluator } from 'agentevals';
import * as ls from 'langsmith/vitest';
import { beforeAll, expect } from 'vitest';

import { expectedToolCalls, runAgent } from '@/evals/helpers/trajectory';

const evaluator = createTrajectoryMatchEvaluator({
  trajectoryMatchMode: 'superset',
  toolArgsMatchMode: 'ignore',
});

const scenarios: Array<{ name: string; humanText: string; expectedTools: string[] }> = [
  {
    name: 'named destination overview request',
    humanText: 'Tell me all about Kyoto — top spots, local tips, and what the weather is like.',
    expectedTools: ['destinationExplorerTool'],
  },
  {
    name: 'local food/tips question',
    humanText: 'What are the best local dishes to try in Hanoi?',
    expectedTools: ['localTipsTool'],
  },
  {
    name: 'attractions question',
    humanText: 'What are the top attractions to visit in Rome?',
    expectedTools: ['placesTool'],
  },
  {
    name: 'visa/entry knowledge question',
    humanText: 'Do I need a visa to enter Japan as a Vietnamese citizen?',
    expectedTools: ['knowledgeSearchTool'],
  },
];

(process.env.OPENAI_API_KEY ? ls.describe : ls.describe.skip)(
  'explore agent tool selection',
  () => {
    let exploreAgent: Awaited<typeof import('@/agents/explore-agent')>['exploreAgent'];

    beforeAll(async () => {
      ({ exploreAgent } = await import('@/agents/explore-agent'));
    });

    ls.test.each(
      scenarios.map(({ name, humanText, expectedTools }) => ({
        inputs: { name, humanText },
        referenceOutputs: { expectedTools },
      }))
    )('$inputs.name -> calls expected tools', async ({ inputs, referenceOutputs }) => {
      const trajectory = await runAgent(exploreAgent, inputs.humanText);
      const evaluation = await evaluator({
        outputs: { messages: trajectory },
        referenceOutputs: expectedToolCalls(referenceOutputs!.expectedTools),
      });

      ls.logFeedback(evaluation);
      expect(evaluation.score, evaluation.comment).toBe(true);
    });
  }
);
