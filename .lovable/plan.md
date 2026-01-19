

## Add "Add New Startups" Button to Settings Page

### Overview
Add a second button alongside "Re-analyze Startups" in the settings page that allows users to upload new startup data without clearing their existing data. When clicked, it will prompt the user with a file upload dialog.

### Current Behavior
When users have saved startups, they see:
- "You have X saved startups" header with "Clear Data" button
- A single "Re-analyze Startups" button

### New Behavior
When users have saved startups, they will see:
- "You have X saved startups" header with "Clear Data" button  
- **Two action buttons side by side:**
  1. "Re-analyze Startups" - existing functionality
  2. "Add New Startups" - opens file upload dialog

### Implementation Details

#### 1. Add state for file upload dialog
- Add `showFileUploader` state to control visibility of file uploader
- Add `newCsvFile` state for the new file being uploaded

#### 2. Create file upload dialog/section
- When "Add New Startups" is clicked, show the FileUploader component
- Add a handler to process the new CSV and merge with existing startups

#### 3. Update the UI layout
- Change the single button to a flex row with two buttons
- "Re-analyze Startups" button (primary style)
- "Add New Startups" button (outline style with Plus/Upload icon)

#### 4. Handle new startup upload
- Parse the uploaded CSV
- Merge with existing `savedStartups` (avoiding duplicates by name/website)
- Save the combined list to the database
- Optionally auto-run analysis on the updated list

### UI Design (matching screenshot style)
```
┌─────────────────────────────────────────────────────────────┐
│  You have 20 saved startups        [🗑 Clear Data]          │
│  Results available in Dashboard                             │
├─────────────────────────────────────────────────────────────┤
│  [Processing Status if active]                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │         [✨ Re-analyze Startups]                        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │         [+ Add New Startups]                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

When "Add New Startups" is clicked, the FileUploader component appears below or in a dialog, allowing drag-and-drop or file selection.

### File Changes

#### src/pages/Index.tsx
- Add `showAddStartups` state to toggle the file uploader visibility
- Add `handleAddNewStartups` function to process new CSV and merge with existing startups
- Update the button section to show two buttons
- Conditionally render FileUploader when `showAddStartups` is true
- Add cancel/close button to hide the uploader

### Critical Files for Implementation
- `src/pages/Index.tsx` - Main page: add state, handlers, and UI for the new button
- `src/components/FileUploader.tsx` - Existing component to reuse for file selection
- `src/lib/api.ts` - Reference for `parseCSV` and `saveUserStartups` functions
- `src/components/ProcessingStatus.tsx` - Existing component for showing upload/processing status

