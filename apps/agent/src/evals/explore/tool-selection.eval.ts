import { createTrajectoryMatchEvaluator } from 'agentevals';
import { beforeAll, describe, expect, it } from 'vitest';

import { expectedToolCalls, runAgent } from '@/evals/helpers/trajectory';

describe.skipIf(!process.env.OPENAI_API_KEY)('explore agent tool selection', () => {
  let exploreAgent: Awaited<typeof import('@/agents/explore-agent')>['exploreAgent'];

  beforeAll(async () => {
    ({ exploreAgent } = await import('@/agents/explore-agent'));
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
    const trajectory = await runAgent(exploreAgent, humanText);
    const evaluation = await evaluator({
      outputs: { messages: trajectory },
      referenceOutputs: expectedToolCalls(expectedTools),
    });

    expect(evaluation.score, evaluation.comment).toBe(true);
  });
});
