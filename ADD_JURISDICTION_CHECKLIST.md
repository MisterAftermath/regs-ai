# Adding a New Jurisdiction - Checklist

This checklist guides you through adding a new jurisdiction to the Regs AI system.

## Prerequisites

- [ ] Have the jurisdiction's building codes and regulations ready in a format suitable for ChromaDB
- [ ] Have ChromaDB running and accessible
- [ ] Know the jurisdiction's name, state, and any special identifiers

## Step 1: Create ChromaDB Collection

- [ ] Create a new collection in ChromaDB named `regsai-[jurisdiction-id]` (e.g., `regsai-dallas`)
- [ ] Populate the collection with the jurisdiction's documents using embeddings
- [ ] Test that the collection is accessible and searchable

## Step 2: Add Jurisdiction to Configuration

- [ ] Open `lib/ai/jurisdictions.ts`
- [ ] Add a new jurisdiction object to the `jurisdictions` array:
  ```typescript
  {
    id: 'your-jurisdiction-id',  // e.g., 'dallas' (lowercase, no spaces)
    name: 'Your Jurisdiction Name',  // e.g., 'Dallas, TX'
    collection: 'regsai-your-jurisdiction-id',  // e.g., 'regsai-dallas'
    description: 'Description of jurisdiction',  // e.g., 'City of Dallas building codes and regulations'
    state: 'XX',  // e.g., 'TX' for Texas
    isDefault: false,  // Only one jurisdiction should have isDefault: true
  },
  ```

## Step 3: Verify Implementation

- [ ] Start the development server: `npm run dev`
- [ ] Navigate to the chat interface
- [ ] Select a jurisdiction-enabled model (e.g., "Building Code Chroma (Test)")
- [ ] Verify the jurisdiction selector appears in the header
- [ ] Select your new jurisdiction from the dropdown
- [ ] Test a query specific to your jurisdiction

## Step 4: Test the Integration

- [ ] Ask a question about building codes in your jurisdiction
- [ ] Verify the response comes from the correct ChromaDB collection
- [ ] Check that citations reference documents from your jurisdiction
- [ ] Test switching between jurisdictions mid-conversation

## Step 5: Production Deployment

- [ ] Ensure the production ChromaDB instance has the new collection
- [ ] Deploy the updated code with the new jurisdiction
- [ ] Test in production environment

## Example: Adding Dallas, TX

1. **Create ChromaDB Collection:**

   ```bash
   # Assuming you have a script to create and populate collections
   python create_collection.py --name regsai-dallas --docs /path/to/dallas/docs
   ```

2. **Update jurisdictions.ts:**

   ```typescript
   {
     id: 'dallas',
     name: 'Dallas, TX',
     collection: 'regsai-dallas',
     description: 'City of Dallas building codes and regulations',
     state: 'TX',
     isDefault: false,
   },
   ```

3. **Test Query:**
   - Select "Building Code Chroma (Test)" model
   - Select "Dallas, TX" from jurisdiction dropdown
   - Ask: "What are the setback requirements for residential properties in Dallas?"

## Troubleshooting

### Jurisdiction doesn't appear in dropdown

- Check that the jurisdiction is properly added to `jurisdictions.ts`
- Verify there are no syntax errors in the configuration
- Restart the development server

### Queries return no results

- Verify the ChromaDB collection name matches exactly
- Check that documents were properly embedded in the collection
- Test the collection directly using ChromaDB's API

### Wrong jurisdiction data returned

- Ensure each jurisdiction has a unique collection name
- Verify the `getJurisdictionCollection` function is being called
- Check the API logs to see which collection is being queried

## Notes

- Jurisdiction IDs should be lowercase with hyphens (no spaces)
- Collection names must follow the pattern `regsai-[jurisdiction-id]`
- Each jurisdiction must have a unique ID and collection name
- Consider grouping jurisdictions by state for better organization in the UI
