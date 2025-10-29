# 🧪 Admin Dashboard Testing Guide

## 📋 Overview

Guide komprehensif untuk testing fitur Search, Filter, dan Pagination di Admin Dashboard. Ikuti checklist ini untuk memastikan semua fitur berjalan dengan baik.

---

## ⚡ Quick Test (5 menit)

### 1. Access Dashboard
```
1. Login as admin
2. Navigate to /admin
3. Verify dashboard loads with destinations
```

### 2. Basic Search
```
1. Type "Borobudur" in search bar
2. Results should filter instantly
3. Try "bali" (lowercase) - should work (case-insensitive)
4. Try partial search "candi" - should match "Candi Prambanan", etc.
```

### 3. Filter Test
```
1. Select Province: "DI Yogyakarta"
2. Should show only Yogyakarta destinations
3. Add Type filter: "Candi & Warisan Sejarah"
4. Should narrow down results further
5. Click "Reset" - back to full list
```

### 4. Pagination Test
```
1. Change items per page to 5
2. Verify pagination controls appear (if total > 5)
3. Click "Next" button
4. Verify page number increments
5. Click page number directly
6. Verify correct data loads
```

**Expected Time**: 5 minutes  
**Pass Criteria**: All features respond instantly, no errors in console

---

## 🔍 Comprehensive Test Suite

### Search Functionality

#### Test 1: Single Field Search
**Steps:**
1. Search by **Destination Name**: "Prambanan"
   - ✅ Should show Candi Prambanan
   - ✅ Case-insensitive working
2. Clear search, try **City**: "Yogyakarta"
   - ✅ Should show all Yogyakarta destinations
3. Clear search, try **Province**: "Jawa Tengah"
   - ✅ Should show all Central Java destinations
4. Clear search, try **Type**: "Candi"
   - ✅ Should show all temple types

**Expected**: Real-time filtering, no lag

#### Test 2: Partial Match
**Steps:**
1. Search: "Tor" → Should match "Tana Toraja"
2. Search: "Bali" → Should match all Bali destinations
3. Search: "Museum" → Should match all museums

**Expected**: Substring matching works

#### Test 3: No Results
**Steps:**
1. Search: "asdfghjkl" (gibberish)
2. Should show: "Tidak ada destinasi ditemukan"
3. Filters and pagination should hide
4. Reset button should appear

**Expected**: Graceful empty state

#### Test 4: Special Characters
**Steps:**
1. Search: "Taman & Alam" (with &)
2. Search: "Bali - Ubud" (with -)
3. Should handle special characters

**Expected**: No JavaScript errors

---

### Filter System

#### Test 1: Province Filter
**Steps:**
1. Select Province: "Bali"
2. Verify only Bali destinations shown
3. Results counter updates: "Menampilkan X dari Y destinasi"
4. Pagination resets to page 1

**Expected**: Filter applies instantly

#### Test 2: Type Filter
**Steps:**
1. Select Type: "Museum"
2. Verify only museum types shown
3. Change to "Taman & Alam"
4. Results update instantly

**Expected**: Dynamic filtering works

#### Test 3: Combined Filters
**Steps:**
1. Set Province: "DI Yogyakarta"
2. Set Type: "Candi & Warisan Sejarah"
3. Should show only temples in Yogyakarta
4. Results counter: "Menampilkan 2 dari 14 destinasi" (example)

**Expected**: Filters combine correctly (AND logic)

#### Test 4: Filter + Search
**Steps:**
1. Set Province: "Bali"
2. Type search: "Taman"
3. Should filter Bali + match "Taman"
4. Results narrow down progressively

**Expected**: All filters cumulative

#### Test 5: Sort Functionality
**Steps:**
1. Sort by: "Name" → Alphabetical A-Z
2. Toggle order → Z-A
3. Sort by: "Price" → Lowest first
4. Toggle order → Highest first
5. Sort by: "Created Date" → Newest first
6. Toggle order → Oldest first

**Expected**: All sorts work, toggle changes order

#### Test 6: Reset Filters
**Steps:**
1. Apply Province, Type, Search, Sort
2. Click "Reset Filters"
3. All filters clear to default
4. Search input empty
5. Dropdowns back to "Semua"
6. Sort back to "created_at" desc

**Expected**: One-click full reset

---

### Pagination System

#### Test 1: Items Per Page
**Steps:**
1. Select 5 items → Shows 5 rows
2. Select 10 items → Shows 10 rows
3. Select 25 items → Shows 25 rows (if available)
4. Select 50 items → Shows up to 50
5. Select 100 items → Shows all (if < 100)

**Expected**: Table displays correct number of rows

#### Test 2: Page Navigation
**Steps:**
1. Set items per page: 5
2. Click "Next" (ChevronRight)
   - ✅ Page increments
   - ✅ Data changes
   - ✅ Page info updates "Halaman 2 dari X"
3. Click "Previous" (ChevronLeft)
   - ✅ Back to page 1
4. Click "Last" (ChevronsRight)
   - ✅ Jumps to last page
5. Click "First" (ChevronsLeft)
   - ✅ Jumps to page 1

**Expected**: Smooth navigation, correct data loads

#### Test 3: Direct Page Click
**Steps:**
1. Click page number "3" directly
2. Should jump to page 3
3. Current page highlighted (default variant)
4. Other pages outline variant

**Expected**: Direct navigation works

#### Test 4: Boundary Conditions
**Steps:**
1. On page 1:
   - ✅ "First" button disabled
   - ✅ "Previous" button disabled
2. On last page:
   - ✅ "Next" button disabled
   - ✅ "Last" button disabled
3. Single page (total items ≤ items per page):
   - ✅ Pagination controls hidden

**Expected**: Proper disabled states

#### Test 5: Ellipsis Display
**Setup**: Need 10+ pages (set items per page to 5, need 50+ destinations)
**Steps:**
1. On page 1: Shows [1] 2 3 ... 10
2. On page 5: Shows 1 ... 4 [5] 6 ... 10
3. On page 10: Shows 1 ... 8 9 [10]

**Expected**: Smart ellipsis, always shows first/last/current/adjacent

#### Test 6: Pagination + Filter Interaction
**Steps:**
1. Go to page 3
2. Apply Province filter
3. Pagination resets to page 1 ✅
4. Total pages recalculated based on filtered results ✅
5. Remove filter
6. Back to full dataset pagination ✅

**Expected**: Pagination reactive to filters

---

## 🎯 Performance Tests

### Test 1: Search Response Time
**Steps:**
1. Start typing in search
2. Measure time to filter results
**Expected**: < 100ms (instant feel)

### Test 2: Filter Application Time
**Steps:**
1. Select filter dropdown
2. Measure time to apply filter
**Expected**: < 50ms (instant)

### Test 3: Pagination Load Time
**Steps:**
1. Click page number
2. Measure time to load new data
**Expected**: < 10ms (client-side, instant)

### Test 4: Large Dataset Handling
**Setup**: Add 100+ destinations (test data)
**Steps:**
1. Apply search
2. Apply filters
3. Navigate pagination
**Expected**: No lag, smooth operations

---

## 📱 Responsive Design Tests

### Mobile (< 768px)
**Steps:**
1. Open DevTools, resize to 375px width
2. Verify search/filter bar stacks vertically
3. Filters should be full-width dropdowns
4. Pagination buttons shrink appropriately
5. Table should be scrollable horizontally

**Expected**: Usable on mobile devices

### Tablet (768px - 1024px)
**Steps:**
1. Resize to 768px width
2. Verify 2-column filter layout
3. Pagination comfortable spacing
4. Table readable

**Expected**: Comfortable tablet experience

### Desktop (> 1024px)
**Steps:**
1. Full desktop resolution
2. Filters in single row
3. Pagination centered
4. Table full-width

**Expected**: Optimal desktop layout

---

## 🐛 Edge Cases & Error Handling

### Test 1: No Destinations
**Setup**: Empty database (or delete all)
**Steps:**
1. Navigate to /admin
2. Should show: "Tidak ada destinasi"
3. Search/filter should be hidden or disabled
4. "Tambah Destinasi" button prominent

**Expected**: Graceful empty state

### Test 2: Single Destination
**Setup**: Only 1 destination in database
**Steps:**
1. Pagination should hide
2. Filters still work
3. Search functional

**Expected**: Works with minimal data

### Test 3: All Filters No Match
**Steps:**
1. Province: "Bali"
2. Type: "Candi & Warisan Sejarah" (if no Bali temples)
3. Should show: "Tidak ada destinasi yang sesuai filter"
4. Reset button available

**Expected**: Clear no-results message

### Test 4: Search + Filter No Match
**Steps:**
1. Search: "Museum"
2. Province: "Bali" (if no Bali museums)
3. Should show empty state
4. Can reset each filter individually

**Expected**: User can recover easily

### Test 5: Rapid Filter Changes
**Steps:**
1. Quickly toggle between provinces (click 5x fast)
2. Rapidly change sort order (10x fast)
3. Type and delete search quickly

**Expected**: No crashes, state stays consistent

### Test 6: Browser Back/Forward
**Steps:**
1. Apply filters
2. Click browser back
3. Click browser forward

**Expected**: Filters don't persist (unless URL state implemented)

---

## ✅ Final Validation Checklist

### Functionality
- [ ] Search works real-time
- [ ] Province filter populates dynamically
- [ ] Type filter populates dynamically
- [ ] Sort by name works (asc/desc)
- [ ] Sort by price works (asc/desc)
- [ ] Sort by date works (asc/desc)
- [ ] Reset filters clears all
- [ ] Results counter accurate
- [ ] Items per page changes display
- [ ] Pagination buttons navigate correctly
- [ ] Page numbers clickable
- [ ] Ellipsis shows for large page counts
- [ ] Disabled states at boundaries
- [ ] Filters combine correctly (AND logic)
- [ ] Search + filter combination works

### UI/UX
- [ ] No layout shift during filtering
- [ ] Loading states (if any) smooth
- [ ] Buttons have hover states
- [ ] Current page highlighted
- [ ] Empty states user-friendly
- [ ] Icons render correctly
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] No horizontal scroll (except table on mobile)

### Performance
- [ ] Search response < 100ms
- [ ] Filter response < 50ms
- [ ] Pagination instant
- [ ] No console errors
- [ ] No React warnings
- [ ] Memory usage stable (no leaks)

### Accessibility
- [ ] Keyboard navigation works (Tab)
- [ ] Enter key submits search
- [ ] Dropdown accessible
- [ ] Button labels clear
- [ ] Screen reader friendly (aria-labels)

### Security
- [ ] Admin-only access enforced
- [ ] No SQL injection in search
- [ ] RLS policies active
- [ ] Client-side validation works
- [ ] Server-side validation works

---

## 🚨 Common Issues & Solutions

### Issue: Search not filtering
**Solution:**
- Check `searchTerm` state updating
- Verify `applyFiltersAndSort()` called in useEffect
- Check `toLowerCase()` applied to both sides

### Issue: Pagination stuck
**Solution:**
- Verify `currentPage` state
- Check `totalPages` calculation: `Math.ceil(filteredDestinations.length / itemsPerPage)`
- Ensure `applyPagination()` called after filters

### Issue: Filters don't combine
**Solution:**
- Verify filter logic uses AND (`&&`), not OR
- Check filtered array passed through all filters
- Ensure filters don't reset each other

### Issue: Performance lag
**Solution:**
- Check useEffect dependencies correct
- Avoid unnecessary re-renders
- Verify large loops optimized
- Consider debouncing search (future enhancement)

### Issue: UI breaks on mobile
**Solution:**
- Check Tailwind responsive classes (`sm:`, `md:`, `lg:`)
- Verify `flex-col` on mobile, `flex-row` on desktop
- Test with Chrome DevTools device emulation

---

## 📊 Test Results Template

```
Testing Date: YYYY-MM-DD
Tester: [Name]
Browser: [Chrome/Firefox/Safari]
Device: [Desktop/Mobile/Tablet]

| Feature | Status | Notes |
|---------|--------|-------|
| Search | ✅ / ❌ | |
| Province Filter | ✅ / ❌ | |
| Type Filter | ✅ / ❌ | |
| Sort Functionality | ✅ / ❌ | |
| Pagination | ✅ / ❌ | |
| Reset Filters | ✅ / ❌ | |
| Responsive Mobile | ✅ / ❌ | |
| Performance | ✅ / ❌ | |
| Edge Cases | ✅ / ❌ | |

Overall: ✅ Pass / ❌ Fail
Issues Found: [List any bugs]
Recommendations: [Suggestions]
```

---

## 🎯 Next Steps After Testing

1. **Document Issues**: Log any bugs in GitHub Issues
2. **Performance Metrics**: Record actual response times
3. **User Feedback**: Test with real admins, gather feedback
4. **Optimization**: Implement debounced search if needed
5. **Enhancement**: Add requested features from user feedback
6. **Monitoring**: Set up analytics for admin usage patterns

---

## 📚 Related Documentation

- **Feature Overview**: [ADMIN_SEARCH_FILTER_PAGINATION.md](./ADMIN_SEARCH_FILTER_PAGINATION.md)
- **Setup Guide**: [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md)
- **Quick Start**: [ADMIN_SETUP_QUICK.md](./ADMIN_SETUP_QUICK.md)

---

**Happy Testing! 🧪✨**
