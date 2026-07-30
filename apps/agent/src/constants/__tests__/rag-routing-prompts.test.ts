import { describe, expect, it } from 'vitest';

import { CLASSIFY_SYSTEM_PROMPT, EXPLORE_TOOLS_SECTION, PLAN_TOOLS_SECTION } from '../../constants';
import { knowledgeSearchTool } from '../../tools/knowledge';
import { tipsTool } from '../../tools/tips';

describe('RAG routing instructions', () => {
  it('routes standalone entry, document, safety, and knowledge-base questions to explore', () => {
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('visa/entry/immigration');
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('required travel documents');
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('safety/culture/transport guidance');
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('"knowledge base"');
  });

  it('requires retrieval and refuses to invent details missing from the corpus', () => {
    expect(EXPLORE_TOOLS_SECTION).toContain('MUST call knowledgeSearchTool');
    expect(EXPLORE_TOOLS_SECTION).toContain('knowledge base is insufficient');
    expect(PLAN_TOOLS_SECTION).toContain('MUST call');
    expect(PLAN_TOOLS_SECTION).toContain('knowledge base is insufficient');
  });

  it('requires exact clickable citations for grounded answers', () => {
    expect(EXPLORE_TOOLS_SECTION).toContain('clickable');
    expect(EXPLORE_TOOLS_SECTION).toContain('full URL');
    expect(PLAN_TOOLS_SECTION).toContain('clickable');
  });

  it('separates local tips from trusted knowledge retrieval', () => {
    expect(knowledgeSearchTool.description).toContain('Mandatory');
    expect(knowledgeSearchTool.description).toContain('required travel documents');
    expect(tipsTool.description).toContain('Do NOT use for visa/entry/immigration');
    expect(tipsTool.description).toContain('knowledgeSearchTool');
  });

  it('treats retrieved document content as untrusted data, not instructions', () => {
    expect(EXPLORE_TOOLS_SECTION).toContain('untrusted reference data');
    expect(PLAN_TOOLS_SECTION).toContain('untrusted reference data');
    expect(knowledgeSearchTool.description).toContain('untrusted reference data');
  });

  it('forbids batching knowledgeSearchTool with a returnDirect tool in the same turn', () => {
    expect(EXPLORE_TOOLS_SECTION).toContain('Never call knowledgeSearchTool in the same turn');
    expect(PLAN_TOOLS_SECTION).toContain('Never call knowledgeSearchTool in the same turn');
  });
});
