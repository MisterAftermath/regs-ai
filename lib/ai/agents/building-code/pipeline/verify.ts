/**
 * Verification Phase Agent
 *
 * Validates citations by locating them in source PDFs using a two-stage approach:
 * 1. Fuzzy search to find potential matches
 * 2. AI semantic verification to confirm the match
 */

import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config';
import type {
  VerifyAgent,
  VerifiedCitation,
  RetrievedDocument,
  PipelineState,
} from '../types';

/**
 * Mock PDF search service interface
 * TODO: Replace with actual PDF search implementation (Elasticsearch, etc.)
 */
interface PDFSearchService {
  /**
   * Performs a fuzzy search in the PDF to find potential matches
   * Returns multiple candidates ranked by similarity
   */
  fuzzySearchInPDF(
    pdfUrl: string,
    searchText: string,
    pageRange?: { start: number; end: number },
  ): Promise<{
    found: boolean;
    candidates: Array<{
      page: number;
      text: string;
      coordinates: { x: number; y: number; width: number; height: number };
      similarity: number; // 0-1 score for fuzzy match quality
    }>;
  }>;

  /**
   * Checks if a PDF exists and is accessible
   */
  checkPDFExists(pdfUrl: string): Promise<boolean>;
}

/**
 * Mock S3 service for generating presigned URLs
 * TODO: Replace with actual AWS S3 client
 */
interface S3Service {
  getPresignedUrl(s3Url: string): Promise<string>;
}

/**
 * System prompt for semantic verification
 */
const SEMANTIC_VERIFY_PROMPT = `You are a verification assistant comparing two text passages about building codes.
Your job is to determine if they convey the same regulatory requirement, even if the wording differs slightly.

Consider these passages as MATCHING if:
- They describe the same requirement with minor formatting differences
- Numbers and measurements are the same
- One is a subset or summary of the other
- Only punctuation, spacing, or minor words differ

Consider them NOT MATCHING if:
- Numbers or measurements differ
- They describe different requirements
- Key terms or conditions are different

Respond with a JSON object:
{
  "match": true/false,
  "confidence": 0.0-1.0,
  "explanation": "brief explanation"
}`;

/**
 * Mock implementations
 */
class MockPDFSearchService implements PDFSearchService {
  async checkPDFExists(pdfUrl: string): Promise<boolean> {
    // Mock: assume all PDFs exist
    console.log(`📄 Checking PDF exists: ${pdfUrl}`);
    return true;
  }

  async fuzzySearchInPDF(
    pdfUrl: string,
    searchText: string,
    pageRange?: { start: number; end: number },
  ) {
    // Mock: return candidates with slight variations
    console.log(`🔍 Fuzzy searching PDF: ${pdfUrl}`);
    console.log(`   Looking for: "${searchText.substring(0, 50)}..."`);

    // Simulate finding similar but not exact matches
    const mockVariations = [
      searchText, // Exact match
      searchText.replace(/\.$/, ''), // Remove trailing period
      searchText.replace(/,/g, ', '), // Add space after commas
      searchText.replace(/\s+/g, ' '), // Normalize whitespace
      searchText.toLowerCase(), // Case variation
    ];

    return {
      found: true,
      candidates: mockVariations.slice(0, 3).map((text, index) => ({
        page: pageRange?.start || 1,
        text,
        coordinates: {
          x: 100 + index * 10,
          y: 200 + index * 20,
          width: 400,
          height: 50,
        },
        similarity: 1 - index * 0.1, // Decreasing similarity
      })),
    };
  }
}

class MockS3Service implements S3Service {
  async getPresignedUrl(s3Url: string): Promise<string> {
    // Convert S3 URL to presigned URL
    const path = s3Url.replace('s3://', '');
    return `https://building-codes.s3.amazonaws.com/${path}?expires=3600&signature=mock`;
  }
}

export class VerificationAgent implements VerifyAgent {
  private pdfSearch: PDFSearchService;
  private s3Service: S3Service;
  private semanticVerifier: ChatOpenAI;

  constructor() {
    // TODO: Initialize real services
    this.pdfSearch = new MockPDFSearchService();
    this.s3Service = new MockS3Service();

    // Initialize semantic verifier with a small, fast model
    this.semanticVerifier = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.models.verifier, // Use model from config
      temperature: config.openai.temperature.verifier, // Use temperature from config
      maxTokens: 200,
    });
  }

  async execute({
    documents,
    query,
  }: {
    documents: RetrievedDocument[];
    query: PipelineState['clarifiedQuery'];
  }): Promise<VerifiedCitation[]> {
    console.log('✅ Verification Phase: Validating citations');

    const verifiedCitations: VerifiedCitation[] = [];

    for (const doc of documents) {
      try {
        console.log(`\n📄 Verifying document: ${doc.id}`);

        // Build citation string
        const citation = this.buildCitation(doc.metadata);
        console.log(`   Citation: ${citation}`);

        // Skip if no PDF URL
        if (!doc.metadata.pdfUrl) {
          console.log('   ⚠️  No PDF URL, marking as unverified');
          verifiedCitations.push({
            citation,
            content: doc.content,
            isValid: false,
            confidence: doc.score * 0.5, // Lower confidence without verification
            source: {
              documentId: doc.id,
              page: doc.metadata.pageRange?.start,
            },
          });
          continue;
        }

        // Stage 1: Check PDF exists
        const pdfExists = await this.pdfSearch.checkPDFExists(
          doc.metadata.pdfUrl,
        );
        if (!pdfExists) {
          console.log('   ❌ PDF not found');
          verifiedCitations.push({
            citation,
            content: doc.content,
            isValid: false,
            confidence: 0,
            source: {
              documentId: doc.id,
            },
          });
          continue;
        }

        // Stage 2: Fuzzy search in PDF
        const searchResult = await this.pdfSearch.fuzzySearchInPDF(
          doc.metadata.pdfUrl,
          doc.content,
          doc.metadata.pageRange,
        );

        if (!searchResult.found || searchResult.candidates.length === 0) {
          console.log('   ❌ No candidates found in PDF');
          verifiedCitations.push({
            citation,
            content: doc.content,
            isValid: false,
            confidence: doc.score * 0.3,
            source: {
              documentId: doc.id,
              page: doc.metadata.pageRange?.start,
            },
          });
          continue;
        }

        // Stage 3: Semantic verification of candidates
        console.log(
          `   🤖 Found ${searchResult.candidates.length} candidates, verifying semantically...`,
        );

        let bestMatch = null;
        let highestConfidence = 0;

        for (const candidate of searchResult.candidates) {
          // Skip if fuzzy match is too poor
          if (candidate.similarity < 0.5) continue;

          // Use AI to verify semantic match
          const semanticMatch = await this.verifySemanticMatch(
            doc.content,
            candidate.text,
          );

          const combinedConfidence =
            candidate.similarity * semanticMatch.confidence;

          if (semanticMatch.match && combinedConfidence > highestConfidence) {
            highestConfidence = combinedConfidence;
            bestMatch = candidate;
          }
        }

        if (bestMatch) {
          // Get presigned URL for viewing
          const presignedUrl = await this.s3Service.getPresignedUrl(
            doc.metadata.pdfUrl,
          );

          verifiedCitations.push({
            citation,
            content: bestMatch.text, // Use the actual PDF text
            isValid: true,
            confidence: doc.score * highestConfidence,
            source: {
              documentId: doc.id,
              page: bestMatch.page,
              coordinates: bestMatch.coordinates,
              s3Url: presignedUrl,
            },
          });

          console.log(
            `   ✅ Verified on page ${bestMatch.page} with confidence ${(highestConfidence * 100).toFixed(0)}%`,
          );
        } else {
          // No semantic match found
          verifiedCitations.push({
            citation,
            content: doc.content,
            isValid: false,
            confidence: doc.score * 0.4,
            source: {
              documentId: doc.id,
              page: doc.metadata.pageRange?.start,
            },
          });

          console.log('   ❌ No semantic match found');
        }
      } catch (error) {
        console.error(`   ❌ Error verifying document ${doc.id}:`, error);

        // Add as unverified on error
        verifiedCitations.push({
          citation: this.buildCitation(doc.metadata),
          content: doc.content,
          isValid: false,
          confidence: 0,
          source: {
            documentId: doc.id,
          },
        });
      }
    }

    // Sort by confidence
    verifiedCitations.sort((a, b) => b.confidence - a.confidence);

    const verifiedCount = verifiedCitations.filter((c) => c.isValid).length;
    console.log(
      `\n✅ Verified ${verifiedCount}/${verifiedCitations.length} citations`,
    );

    return verifiedCitations;
  }

  /**
   * Uses AI to verify if two text passages convey the same information
   */
  private async verifySemanticMatch(
    originalText: string,
    candidateText: string,
  ): Promise<{ match: boolean; confidence: number; explanation: string }> {
    try {
      const response = await this.semanticVerifier.invoke([
        { role: 'system', content: SEMANTIC_VERIFY_PROMPT },
        {
          role: 'user',
          content: `Original: "${originalText}"\n\nCandidate: "${candidateText}"`,
        },
      ]);

      const result = JSON.parse(response.content as string);
      return result;
    } catch (error) {
      console.error('Semantic verification error:', error);
      // Fallback to simple comparison
      const match = this.simpleSimilarityCheck(originalText, candidateText);
      return {
        match,
        confidence: match ? 0.6 : 0.2,
        explanation: 'Fallback comparison used',
      };
    }
  }

  /**
   * Simple fallback similarity check
   */
  private simpleSimilarityCheck(text1: string, text2: string): boolean {
    // Normalize both texts
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[.,;:!?'"]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    const normalized1 = normalize(text1);
    const normalized2 = normalize(text2);

    // Check if one contains the other
    return (
      normalized1.includes(normalized2) || normalized2.includes(normalized1)
    );
  }

  private buildCitation(metadata: RetrievedDocument['metadata']): string {
    const parts = [metadata.municipality];

    if (metadata.chapter !== 'Internal') {
      parts.push(`Ch. ${metadata.chapter}`);
    }

    if (metadata.section) {
      parts.push(`Sec. ${metadata.section}`);
    }

    if (metadata.subsection) {
      parts.push(`(${metadata.subsection})`);
    }

    if (metadata.title) {
      parts.push(`- ${metadata.title}`);
    }

    return parts.join(' ');
  }
}

/**
 * Factory function for creating verification agent
 */
export function createVerificationAgent(): VerifyAgent {
  return new VerificationAgent();
}
