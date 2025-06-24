/**
 * Retrieval Phase Agent
 *
 * Searches multiple vector database namespaces for relevant building codes,
 * user documents, and company exceptions.
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from '../config';
import type { RetrieveAgent, RetrievedDocument, PipelineState } from '../types';

/**
 * Mock vector store interface
 * TODO: Replace with actual vector DB client (Chroma, Pinecone, etc.)
 */
interface VectorStore {
  search(
    query: string,
    namespace: string,
    limit: number,
  ): Promise<RetrievedDocument[]>;
}

/**
 * Mock implementation of vector store
 */
class MockVectorStore implements VectorStore {
  async search(
    query: string,
    namespace: string,
    limit: number,
  ): Promise<RetrievedDocument[]> {
    // Mock data for testing
    const mockResults: Record<string, RetrievedDocument[]> = {
      'building-codes-general': [
        {
          id: 'doc-001',
          content:
            'Houston Chapter 42: Minimum lot size in urban areas is 1,400 square feet for single-family residential properties.',
          metadata: {
            municipality: 'Houston',
            state: 'TX',
            chapter: '42',
            section: '1.2',
            subsection: 'a',
            title: 'Minimum Lot Size Requirements',
            effectiveDate: '2024-01-01',
            documentType: 'building-code',
            pdfUrl: 's3://building-codes-pdfs/houston/ch42.pdf',
            pageRange: { start: 15, end: 16 },
          },
          score: 0.95,
          source: 'general',
        },
        {
          id: 'doc-002',
          content:
            'Houston Chapter 42: Maximum building height in residential zones is 35 feet measured from grade.',
          metadata: {
            municipality: 'Houston',
            state: 'TX',
            chapter: '42',
            section: '2.5',
            title: 'Height Restrictions',
            effectiveDate: '2024-01-01',
            documentType: 'building-code',
            pdfUrl: 's3://building-codes-pdfs/houston/ch42.pdf',
            pageRange: { start: 28, end: 29 },
          },
          score: 0.89,
          source: 'general',
        },
      ],
      'user-documents': [
        {
          id: 'user-doc-001',
          content:
            'Company Policy: For all Houston projects, we apply for variances to reduce minimum lot size to 1,200 sq ft in specific zones.',
          metadata: {
            municipality: 'Houston',
            state: 'TX',
            chapter: 'Internal',
            section: 'Variance-Policy',
            title: 'Houston Variance Guidelines',
            effectiveDate: '2023-06-01',
            documentType: 'ordinance',
            pdfUrl: 's3://user-uploaded-pdfs/company-policies.pdf',
            pageRange: { start: 5, end: 5 },
          },
          score: 0.87,
          source: 'user',
        },
      ],
      'company-exceptions': [],
    };

    return mockResults[namespace] || [];
  }
}

export class RetrievalAgent implements RetrieveAgent {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: VectorStore;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.models.embeddings,
    });

    // TODO: Initialize real vector store client
    this.vectorStore = new MockVectorStore();
  }

  async execute({
    clarifiedQuery,
  }: {
    clarifiedQuery: PipelineState['clarifiedQuery'];
  }): Promise<RetrievedDocument[]> {
    console.log('📚 Retrieval Phase: Searching documents');

    try {
      const allDocuments: RetrievedDocument[] = [];

      // Build search query
      const searchQuery = this.buildSearchQuery(clarifiedQuery);
      console.log(`🔍 Search query: "${searchQuery}"`);

      // Search general building codes
      console.log('📖 Searching general building codes...');
      const generalDocs = await this.vectorStore.search(
        searchQuery,
        config.vectorDB.namespaces.buildingCodes,
        10,
      );
      allDocuments.push(...generalDocs);

      // Search user documents if enabled
      if (config.features.searchUserDocuments) {
        console.log('📄 Searching user documents...');
        const userDocs = await this.vectorStore.search(
          searchQuery,
          config.vectorDB.namespaces.userDocuments,
          5,
        );
        allDocuments.push(...userDocs);

        // Search company exceptions
        console.log('🏢 Searching company exceptions...');
        const companyDocs = await this.vectorStore.search(
          searchQuery,
          config.vectorDB.namespaces.companyExceptions,
          5,
        );
        allDocuments.push(...companyDocs);
      }

      // Sort by relevance score
      allDocuments.sort((a, b) => b.score - a.score);

      // Apply max limit
      const limitedDocs = allDocuments.slice(0, config.response.maxSources * 2);

      console.log(`✅ Retrieved ${limitedDocs.length} documents`);
      return limitedDocs;
    } catch (error) {
      console.error('❌ Retrieval error:', error);
      throw error;
    }
  }

  private buildSearchQuery(
    clarifiedQuery: PipelineState['clarifiedQuery'],
  ): string {
    const parts = [clarifiedQuery.question];

    if (clarifiedQuery.municipality) {
      parts.push(clarifiedQuery.municipality);
    }

    if (clarifiedQuery.propertyType) {
      parts.push(clarifiedQuery.propertyType);
    }

    if (clarifiedQuery.specificCodes?.length) {
      parts.push(...clarifiedQuery.specificCodes);
    }

    return parts.join(' ');
  }
}

/**
 * Factory function for creating retrieval agent
 */
export function createRetrievalAgent(): RetrieveAgent {
  return new RetrievalAgent();
}
