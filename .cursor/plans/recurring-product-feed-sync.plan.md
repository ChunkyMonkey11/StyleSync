# Recurring Product Feed Sync Implementation Plan

## Goal

Implement a recurring sync mechanism that continuously fetches products and shops from Shopify sources, accumulating more products over time through pagination. Syncs should be throttled with a minimum 30-second interval between syncs.

## Current State

### Existing Implementation

- `useProductFeedSync` hook already has:
  - `lastSyncTimeRef` to track last sync timestamp
  - 30-second minimum check (`if ((now - lastSyncTimeRef.current) < 30000)`)
  - Auto-pagination logic for all Shopify hooks
  - Product and shops upsert functionality
  - Single sync triggered on data availability

### Current Limitations

- Sync only happens once when data is ready
- No recurring/periodic sync mechanism
- Can't continuously accumulate more products over time

## Requirements

1. **Track Last Sync Time**: Maintain timestamp of last successful sync
2. **30-Second Minimum Interval**: Enforce minimum 30 seconds between syncs
3. **Periodic Sync Trigger**: Check every X seconds if we can sync (when 30+ seconds have passed)
4. **Re-fetch Products & Shops**: Each sync cycle re-runs the fetch and upsert process
5. **Continuous Accumulation**: Through pagination, accumulate more products over multiple sync cycles

## Implementation Steps

### Step 1: Add Periodic Sync Check Mechanism

**Location**: `src/hooks/useProductFeedSync.ts`

**Changes Needed**:

- Add interval-based sync trigger (separate from data-change trigger)
- Use `setInterval` or `setTimeout` to periodically check if sync is allowed
- Clean up interval on unmount

**Key Considerations**:

- Interval should check every few seconds (e.g., every 5-10 seconds) if 30+ seconds have passed
- Don't start interval until first sync completes
- Pause interval while sync is in progress
- Resume interval after sync completes

### Step 2: Refactor Sync Logic for Reusability

**Location**: `src/hooks/useProductFeedSync.ts`

**Changes Needed**:

- Extract `syncFeed` function to be callable from multiple triggers:

  1. Initial data availability (existing)
  2. Periodic interval check (new)

- Ensure sync function respects 30-second minimum
- Reset sync state appropriately between sync cycles

**Key Considerations**:

- Same sync logic should work for both triggers
- Need to check if hooks are ready before syncing (loading/pagination states)
- Don't reset pagination state between syncs - let hooks continue accumulating

### Step 3: Reset Pagination State Between Sync Cycles (Optional Enhancement)

**Current Behavior**:

- Hooks auto-paginate until max items or no more pages
- After first sync, hooks may have already loaded all available data

**Decision Needed**:

- **Option A**: Let hooks continue paginating naturally (current behavior)
  - Pro: Simpler, hooks handle pagination automatically
  - Con: May exhaust all data on first sync, subsequent syncs won't add new products
- **Option B**: Reset hooks/cursors between syncs to re-fetch from beginning
  - Pro: Can re-fetch all data each time (useful if Shopify data changes)
  - Con: More complex, may need to reset hook states or re-mount hooks

**Recommendation**: Start with Option A (natural pagination), then evaluate if Option B is needed based on use case.

### Step 4: Handle Hook State for Recurring Syncs

**Location**: `src/hooks/useProductFeedSync.ts`

**Key Questions**:

- Should we wait for hooks to finish paginating before each sync?
- Or should we sync with whatever data is currently loaded?

**Approach**:

- For recurring syncs: Sync with current data if 30+ seconds have passed
- Don't wait for full pagination to complete on recurring syncs
- First sync: Wait for initial pagination to complete (existing behavior)
- Recurring syncs: Use current hook state, let pagination continue in background

### Step 5: Update Sync Completion Tracking

**Location**: `src/hooks/useProductFeedSync.ts`

**Changes Needed**:

- Update `lastSyncTimeRef.current` immediately after successful sync
- Ensure sync completion includes updating timestamp
- Add logging to track sync frequency and timing

**Implementation Details**:

```typescript
// After successful sync:
lastSyncTimeRef.current = Date.now()
console.log('✅ Sync completed at:', new Date(lastSyncTimeRef.current).toISOString())
```

### Step 6: Add Sync Status Visibility (Optional)

**Location**: `src/hooks/useProductFeedSync.ts`

**Enhancement**:

- Return additional metadata:
  - `lastSyncTime: number | null` - timestamp of last sync
  - `nextSyncAvailableIn: number` - milliseconds until next sync is allowed
  - `syncCount: number` - total number of syncs performed in session

**Use Case**: Can be displayed in UI to show sync status to user

## Technical Implementation Details

### Interval Strategy

```typescript
// Pseudo-code for interval-based sync
useEffect(() => {
  let intervalId: NodeJS.Timeout | null = null

  const checkAndSync = () => {
    const now = Date.now()
    const timeSinceLastSync = now - lastSyncTimeRef.current
    
    // Only sync if:
    // 1. 30+ seconds have passed
    // 2. Not currently syncing
    // 3. Hooks have some data or finished loading
    if (timeSinceLastSync >= 30000 && !isSyncing) {
      syncFeed()
    }
  }

  // Start interval after first sync completes
  if (hasSyncedRef.current) {
    intervalId = setInterval(checkAndSync, 5000) // Check every 5 seconds
  }

  return () => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
}, [isSyncing, hasSyncedRef.current])
```

### Sync Function Extraction

```typescript
// Extract syncFeed to be reusable
const performSync = useCallback(async () => {
  // Current sync logic from useEffect
  // ...
}, [/* dependencies */])

// Use in both places:
// 1. Initial sync (data availability)
// 2. Periodic sync (interval)
```

## Testing Strategy

1. **30-Second Minimum**: Verify sync doesn't happen more frequently than every 30 seconds
2. **Recurring Syncs**: Verify sync happens automatically after 30 seconds
3. **Product Accumulation**: Verify products accumulate over multiple sync cycles
4. **Shop Accumulation**: Verify shops accumulate over multiple sync cycles
5. **Hook State**: Verify hooks continue paginating between syncs
6. **Error Handling**: Verify errors don't break the recurring sync mechanism
7. **Unmount Cleanup**: Verify intervals are cleaned up properly

## Potential Challenges

1. **Hook Re-mounting**: Shopify hooks may reset when component re-renders

   - **Solution**: Ensure hook instances persist between syncs

2. **Pagination Exhaustion**: After first sync, all data may be loaded

   - **Solution**: Evaluate if we need to reset pagination or if this is acceptable

3. **Performance**: Frequent syncing may impact app performance

   - **Solution**: Throttle properly, only sync when needed

4. **Rate Limiting**: Backend may have rate limits

   - **Solution**: 30-second minimum should be sufficient, monitor backend logs

5. **Battery Impact**: Continuous syncing may drain battery

   - **Solution**: Consider pausing sync when app is backgrounded (future enhancement)

## Future Enhancements

1. **Background Sync Pause**: Pause sync when app is in background
2. **Adaptive Interval**: Adjust sync frequency based on data availability
3. **Sync Queue**: Queue sync requests if multiple triggers occur
4. **User-Triggered Sync**: Allow manual sync button to override 30-second minimum
5. **Sync History**: Track sync history for debugging and analytics
6. **Smart Pagination Reset**: Only reset pagination if new data is detected

## Success Criteria

- ✅ Sync happens automatically every 30+ seconds (when conditions are met)
- ✅ Last sync time is accurately tracked
- ✅ Products continue to accumulate over multiple sync cycles
- ✅ Shops continue to accumulate over multiple sync cycles
- ✅ No syncs happen more frequently than 30 seconds apart
- ✅ Sync mechanism is resilient to errors
- ✅ Code is clean, maintainable, and well-documented

## Related Files

- `src/hooks/useProductFeedSync.ts` - Main implementation
- `supabase/functions/sync-product-feed/index.ts` - Backend sync handler
- `src/hooks/useAppInitialization.ts` - Where hook is called
- `src/pages/feeds/FeedPage.tsx` - Where hook is used for status

## Notes

- The existing 30-second check is already in place, we just need to add the periodic trigger mechanism
- The sync logic itself is solid, just needs to be made reusable
- Pagination strategy (Option A vs B) should be decided based on use case requirements
- Consider user experience - should users see sync status? Should they be able to manually trigger?
