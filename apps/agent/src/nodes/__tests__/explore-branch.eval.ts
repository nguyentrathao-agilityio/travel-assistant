import { createTrajectoryMatchEvaluator } from 'agentevals';
import { beforeAll, describe, expect, it } from 'vitest';

import { expectedToolCalls, runBranch } from './eval-helpers';

describe.skipIf(!process.env.OPENAI_API_KEY)('explore branch tool selection', () => {
  let exploreBranch: Awaited<typeof import('../branches')>['exploreBranch'];

  beforeAll(async () => {
    ({ exploreBranch } = await import('../branches'));
  });

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

  it.each(scenarios)('$name -> calls $expectedTools', async ({ humanText, expectedTools }) => {
    const trajectory = await runBranch(exploreBranch, humanText);
    const evaluation = await evaluator({
      outputs: { messages: trajectory },
      referenceOutputs: expectedToolCalls(expectedTools),
    });

    expect(evaluation.score, evaluation.comment).toBe(true);
  });
});
