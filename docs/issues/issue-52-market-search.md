# Market Search

**Issue #52** | **State:** OPEN | **Created:** 2026-01-15T00:51:42Z

**Assignees:** Abdulkarim4u

**Updated:** 2026-01-15T06:13:25Z | **Closed:** N/A

---

## Overview
Users can effortlessly discover relevant markets by entering keywords into the search bar on the landing page.

## Implementation Tasks

1. Backend (API)
- [ ] Create Search Endpoint: Add a new route GET /api/markets/search that accepts a query parameter (e.g., ?q=bitcoin).
- [ ] Database Query: Implement a Prisma query to filter markets where title, description, or category contains the search keyword (using efficient contains or Full-Text Search if possible).
- [ ] Validation: Sanitize the input to prevent injection or empty queries.

2. Frontend (Web)
- [ ] State Management: Handle the user input state and trigger the search request (consider debouncing to avoid too many API calls while typing).
- [ ] Results Display: Create a "Search Results" view or dropdown that dynamically updates with the relevant market cards.
- [ ] Empty State: Handle cases where no markets are found (e.g., "No results found for 'xyz'").
 
3. Integration
- [ ] Connect Frontend to API: Wire up the SearchBar to call the new /api/markets/search endpoint.
- [ ] Test: Verify that searching for "World Cup" correctly returns the FIFA markets.


## Risks & Constraints
Due to strict timeline constraints, the search feature may be descoped to ensure timely delivery.

