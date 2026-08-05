import { ingestKnowledgeSource, KNOWLEDGE_SOURCES } from '../knowledge';
import { knowledgeStore } from '../infrastructure/persistence';

/** Seeds all knowledge sources, or one selected by `KNOWLEDGE_SOURCE_ID`. */
const seedKnowledge = async (): Promise<void> => {
  const failures: string[] = [];
  const requestedSourceId = process.env.KNOWLEDGE_SOURCE_ID;
  const sources = requestedSourceId
    ? KNOWLEDGE_SOURCES.filter((source) => source.id === requestedSourceId)
    : KNOWLEDGE_SOURCES;

  try {
    if (!sources.length) {
      throw new Error(`Unknown knowledge source: ${requestedSourceId}`);
    }

    for (const source of sources) {
      try {
        const result = await ingestKnowledgeSource(source);
        console.log(
          `[knowledge] ${result.sourceId}: ${result.chunks} chunks, ${result.deletedStaleChunks} stale deleted`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${source.id}: ${message}`);
        console.error(`[knowledge] ${source.id}: ${message}`);
      }
    }

    if (failures.length) {
      throw new Error(`Knowledge ingestion failed for ${failures.length} source(s)`);
    }
  } finally {
    await knowledgeStore.stop();
  }
};

await seedKnowledge();
