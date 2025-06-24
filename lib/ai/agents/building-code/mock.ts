/**
 * Mock implementation of the Building Code Agent
 * Used for testing and development without external dependencies
 */

import type { BuildingCodeAgent } from './types';
import { ERROR_MESSAGES } from './prompts';

/**
 * Creates a mock Building Code Agent for testing
 * @returns A mock BuildingCodeAgent instance
 */
export function createMockBuildingCodeAgent(): BuildingCodeAgent {
  return {
    /**
     * Mock invoke method that returns a descriptive response
     */
    async invoke({ messages }) {
      console.log('🏗️ Mock Building Code Agent invoke called');

      // Get the last user message
      const userMessages = messages.filter((m) => m.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      const question = lastUserMessage?.content?.trim() || '';

      if (!question) {
        return {
          content: ERROR_MESSAGES.NO_QUESTION,
        };
      }

      // Return a mock response explaining what the real agent would do
      return {
        content: `**Building Code Agent (Mock Mode)**

I received your question: "${question}"

In production, I would:

1. **Analyze Your Query** 
   - Identify the municipality and specific code topics
   - Determine which tools to use

2. **Search Building Codes**
   - Query the vector database for relevant regulations
   - Filter results by municipality

3. **Check Zoning** (if an address is mentioned)
   - Call the zoning API to get current zoning designation
   - Retrieve applicable restrictions

4. **Verify Citations**
   - Cross-reference any mentioned code sections
   - Ensure accuracy and currency

5. **Provide Comprehensive Answer**
   - Include specific code citations
   - Offer practical guidance
   - Note any caveats or exceptions

---
*Note: This is a mock response. To enable the full Building Code Agent:*
- *Install LangChain dependencies*
- *Configure OpenAI API key*
- *Populate the vector database with actual building codes*
- *Replace mock tools with real API integrations*`,
      };
    },

    /**
     * Mock streaming implementation
     */
    async *stream({ messages }) {
      console.log('🏗️ Mock Building Code Agent stream called');

      const userMessages = messages.filter((m) => m.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      const question = lastUserMessage?.content?.trim() || '';

      if (!question) {
        yield ERROR_MESSAGES.NO_QUESTION;
        return;
      }

      // Simulate streaming by yielding parts of the response
      const parts = [
        '**Building Code Agent (Mock Mode)**\n\n',
        `I received your question: "${question}"\n\n`,
        'Analyzing your building code question... ',
        'Searching relevant regulations... ',
        'Checking applicable codes... ',
        '\n\nIn production, I would provide:\n',
        '• Specific building code citations\n',
        '• Zoning information for addresses\n',
        '• Verified regulatory requirements\n',
        '• Practical compliance guidance\n\n',
        '*This is a mock response. Configure the agent with real data for actual results.*',
      ];

      // Yield each part with a small delay to simulate streaming
      for (const part of parts) {
        yield part;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    },
  };
}
