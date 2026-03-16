# Migrate /create-market page to use unified /api/admin/create-market endpoint

**Issue #65** | **State:** OPEN | **Created:** 2026-01-19T09:08:19Z

**Assignees:** linked0

**Updated:** 2026-01-19T09:08:30Z | **Closed:** N/A

---

## Summary                                                                               
                                                                                           
Migrate the frontend `/create-market` page from the current two-step flow to use the     
unified `/api/admin/create-market` endpoint.                                             
                                                                                         
## Current Flow                                                                          
                                                                                         
Frontend → MetaMask (user signs tx) → Contract.createBinaryMarket()                      
Frontend → POST /api/markets/grouped (DB only)                                           
                                                                                         
**Problems:**                                                                            
- Two separate calls → risk of desync (contract succeeds, API fails)                     
- User must have gas tokens                                                              
- Complex frontend logic                                                                 
                                                                                         
## Proposed Flow                                                                         
                                                                                         
Frontend → POST /api/admin/create-market → Server handles contract + DB                  
                                                                                         
**Benefits:**                                                                            
- ✅ Atomic operation (no desync between chain and DB)                                   
- ✅ Server pays gas (simpler UX)                                                        
- ✅ Same code path as E2E tests (fully tested)                                          
- ✅ Single source of truth for market creation                                          
                                                                                         
## Tasks                                                                                 
                                                                                         
- [ ] Update `/create-market` page to call `POST /api/admin/create-market`               
- [ ] Remove direct contract interaction from frontend                                   
- [ ] Update form to match new API request format                                        
- [ ] Test market creation flow end-to-end                                               
- [ ] (Optional) Deprecate or remove `POST /api/markets/grouped` if no longer needed     
                                                                                         
## API Reference                                                                         
                                                                                         
**Endpoint:** `POST /api/admin/create-market`                                            
                                                                                         
**Request:**                                                                             
```json                                                                                  
{                                                                                        
  "title": "Will BTC reach $100k?",                                                      
  "description": "Binary market for BTC price prediction",                               
  "category": "Crypto",                                                                  
  "endTimeMinutes": 60,                                                                  
  "resolutionTimeMinutes": 120                                                           
}                                                                                        
                                                                                         
Response:                                                                                
{                                                                                        
  "success": true,                                                                       
  "market": {                                                                            
    "id": "...",                                                                         
    "conditionId": "0x...",                                                              
    "transactionHash": "0x..."                                                           
  },                                                                                     
  "outcomes": {                                                                          
    "yes": { "id": "...", "tokenId": "..." },                                            
    "no": { "id": "...", "tokenId": "..." }                                              
  }                                                                                      
}                                                                                        
                                                                                         
Related                                                                                  
                                                                                         
- Design doc: docs/task/design/e2e-test-address-flow.md

