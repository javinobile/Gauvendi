# Room Product Extras API Documentation

## Overview
This API provides streamlined operations for managing multiple extras within a single room product. The API is designed to be simple, efficient, and frontend-friendly with comprehensive error handling and performance optimization.

## API Design Philosophy
- **One Product, Multiple Extras**: All operations target one room product and handle multiple extras within that product
- **Batch Operations**: Reduce network overhead by processing multiple extras in single requests
- **Granular Results**: Each extra operation provides individual success/failure feedback
- **Frontend-Friendly**: Consistent response structure for easy integration

## Available Endpoints

### 1. Create Multiple Room Product Extras
**Endpoint:** `POST /room-products/extras`

**Description:** Create multiple extras for a single room product in one operation.

**Request Body:**
```json
{
  "roomProductId": "uuid-string",
  "hotelId": "uuid-string", 
  "extras": [
    {
      "extrasId": "extra-uuid-1",
      "type": "INCLUDED"
    },
    {
      "extrasId": "extra-uuid-2",
      "type": "EXTRA"
    },
    {
      "extrasId": "extra-uuid-3",
      "type": "MANDATORY"
    }
  ]
}
```

**Success Response:**
```json
{
  "roomProductId": "uuid-string",
  "totalRequested": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "extraId": "extra-uuid-1",
      "success": true,
      "message": "Extra created successfully",
      "data": {
        "id": "new-uuid-1",
        "roomProductId": "uuid-string",
        "hotelId": "uuid-string",
        "extrasId": "extra-uuid-1",
        "type": "INCLUDED",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    },
    {
      "extraId": "extra-uuid-2",
      "success": true,
      "message": "Extra created successfully",
      "data": {
        "id": "new-uuid-2",
        "roomProductId": "uuid-string",
        "hotelId": "uuid-string",
        "extrasId": "extra-uuid-2",
        "type": "EXTRA",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    },
    {
      "extraId": "extra-uuid-3",
      "success": false,
      "message": "Extra already exists for this room product",
      "error": "DUPLICATE_EXTRA"
    }
  ]
}
```

### 2. Delete Multiple Room Product Extras
**Endpoint:** `DELETE /room-products/extras`

**Description:** Delete multiple extras from a single room product in one operation.

**Request Body:**
```json
{
  "roomProductId": "uuid-string",
  "extraIds": ["extra-uuid-1", "extra-uuid-2", "extra-uuid-3"]
}
```

**Success Response:**
```json
{
  "roomProductId": "uuid-string",
  "totalRequested": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "extraId": "extra-uuid-1",
      "success": true,
      "message": "Extra deleted successfully",
      "data": {
        "deletedExtraId": "extra-uuid-1"
      }
    },
    {
      "extraId": "extra-uuid-2", 
      "success": true,
      "message": "Extra deleted successfully",
      "data": {
        "deletedExtraId": "extra-uuid-2"
      }
    },
    {
      "extraId": "extra-uuid-3",
      "success": false,
      "message": "Extra not found in this room product",
      "error": "EXTRA_NOT_FOUND"
    }
  ]
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `ROOM_PRODUCT_NOT_FOUND` | Room product doesn't exist or doesn't belong to the hotel |
| `DUPLICATE_EXTRA` | Extra already exists for this room product |
| `EXTRA_NOT_FOUND` | Extra doesn't exist in this room product |

## Extra Types

| Type | Description |
|------|-------------|
| `INCLUDED` | Extra is included in the base room product price |
| `EXTRA` | Optional extra that can be added for additional cost |
| `MANDATORY` | Required extra that must be added to the room product |

## Frontend Integration Guide

### 1. **Creating Multiple Extras**
```javascript
async function createExtras(roomProductId, hotelId, extrasToCreate) {
  try {
    const response = await fetch('/room-products/extras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomProductId,
        hotelId,
        extras: extrasToCreate
      })
    });
    
    const result = await response.json();
    
    // Handle results for each extra individually
    result.results.forEach(item => {
      if (item.success) {
        console.log(`Extra ${item.extraId} created successfully`);
        // Update UI with new extra data
        addExtraToUI(item.data);
      } else {
        console.error(`Failed to create extra ${item.extraId}: ${item.message}`);
        // Show specific error message
        showErrorMessage(item.extraId, item.error);
      }
    });
    
    // Show overall summary
    showSummary(`Created ${result.successful}/${result.totalRequested} extras`);
    
    return result;
  } catch (error) {
    console.error('Network error:', error);
    showErrorMessage('all', 'NETWORK_ERROR');
  }
}

// Example usage
const extrasToCreate = [
  { extrasId: 'wifi-service', type: 'INCLUDED' },
  { extrasId: 'breakfast', type: 'EXTRA' },
  { extrasId: 'city-tax', type: 'MANDATORY' }
];

createExtras('room-product-123', 'hotel-456', extrasToCreate);
```

### 2. **Deleting Multiple Extras**
```javascript
async function deleteExtras(roomProductId, extraIdsToDelete) {
  try {
    const response = await fetch('/room-products/extras', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomProductId,
        extraIds: extraIdsToDelete
      })
    });
    
    const result = await response.json();
    
    // Handle results for each extra individually
    result.results.forEach(item => {
      if (item.success) {
        console.log(`Extra ${item.extraId} deleted successfully`);
        // Remove from UI
        removeExtraFromUI(item.extraId);
      } else {
        console.error(`Failed to delete extra ${item.extraId}: ${item.message}`);
        // Show error but keep in UI
        showErrorMessage(item.extraId, item.error);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### 3. **Progress Tracking with UI Updates**
```javascript
function showOperationProgress(result) {
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  
  // Calculate progress percentage
  const progressPercent = (result.successful / result.totalRequested) * 100;
  progressBar.style.width = `${progressPercent}%`;
  
  // Update status text
  statusText.textContent = `${result.successful}/${result.totalRequested} completed`;
  
  // Show individual results
  const resultsContainer = document.getElementById('results');
  result.results.forEach(item => {
    const resultElement = document.createElement('div');
    resultElement.className = item.success ? 'success' : 'error';
    resultElement.textContent = `${item.extraId}: ${item.message}`;
    resultsContainer.appendChild(resultElement);
  });
}
```

### 4. **Optimistic Updates**
```javascript
async function optimisticDeleteExtras(roomProductId, extraIds) {
  // Optimistically remove from UI
  extraIds.forEach(extraId => {
    const element = document.getElementById(`extra-${extraId}`);
    if (element) {
      element.style.opacity = '0.5'; // Show as pending deletion
      element.classList.add('deleting');
    }
  });
  
  try {
    const result = await deleteExtras(roomProductId, extraIds);
    
    // Handle actual results
    result.results.forEach(item => {
      const element = document.getElementById(`extra-${item.extraId}`);
      if (item.success) {
        // Remove completely
        element?.remove();
      } else {
        // Restore if failed
        if (element) {
          element.style.opacity = '1';
          element.classList.remove('deleting');
          element.classList.add('delete-failed');
        }
      }
    });
    
  } catch (error) {
    // Restore all on network error
    extraIds.forEach(extraId => {
      const element = document.getElementById(`extra-${extraId}`);
      if (element) {
        element.style.opacity = '1';
        element.classList.remove('deleting');
      }
    });
  }
}
```

## Performance Features

### 1. **Batch Processing**
- Single API call handles multiple extras
- Reduces network overhead and improves user experience
- Database operations are optimized for batch processing

### 2. **Efficient Validation**
- Room product validation happens once per operation
- Duplicate detection uses efficient Map-based lookups
- Individual operation failures don't affect others

### 3. **Granular Error Handling**
- Each extra operation provides individual success/failure status
- Specific error codes for different failure scenarios
- Detailed logging for debugging and monitoring

## Validation Rules

### Create Operations
- `roomProductId`: Required UUID, must exist and belong to hotel
- `hotelId`: Required UUID
- `extras`: Required array with at least one item
- `extrasId`: Required UUID for each extra
- `type`: Required, must be INCLUDED, EXTRA, or MANDATORY
- Duplicate check: combination of roomProductId + extrasId + type must be unique

### Delete Operations  
- `roomProductId`: Required UUID
- `extraIds`: Required array of UUIDs, must exist in the specified room product
- All extras must belong to the specified room product

## Best Practices

### 1. **Error Handling**
- Always check individual results in the response
- Handle partial failures gracefully
- Provide clear user feedback for each operation

### 2. **UI Updates**
- Use optimistic updates for better user experience
- Provide visual feedback during operations
- Show progress for batch operations

### 3. **Performance**
- Batch multiple operations together when possible
- Use the detailed results for granular UI updates
- Implement proper loading states

### 4. **Data Consistency**
- Always validate room product ownership before operations
- Handle concurrent modifications gracefully
- Use the response data to update local state

## Rate Limiting
- Maximum 50 extras per operation
- Standard API rate limits apply
- Consider implementing client-side batching for large operations