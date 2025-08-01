# Storage Feature Documentation

## Overview

The Oracle AI Migration Tool now includes a comprehensive storage feature that allows users to select files directly from Supabase storage buckets for conversion. This feature provides real-time status updates and seamless integration with the existing conversion workflow.

## Features

### 1. Storage Tab
- New "Storage" tab in the upload section
- Browse and select files from multiple Supabase storage buckets
- Support for `ecommercedb` and `employeedb` buckets
- File filtering by supported extensions (.sql, .txt, .prc, .trg, .tab, .proc, .sp)

### 2. File Selection
- Multi-select functionality with checkboxes
- Select all/none options
- File size and type information display
- Real-time file listing with refresh capability

### 3. Database Integration
- Automatic saving of selected files to `storage_files` table
- Real-time status updates (Pending → Converting → Converted/Failed)
- Performance metrics and conversion results storage
- Error message tracking

### 4. Status Management
- Real-time status updates during conversion
- Visual indicators for different statuses:
  - **Pending**: Clock icon, gray badge
  - **Converting**: Spinning loader, blue badge
  - **Converted**: Checkmark icon, green badge
  - **Failed**: X icon, red badge

### 5. Storage Files Panel
- Dedicated panel to view all storage files
- Filter by status (All, Pending, Converting, Converted, Failed)
- File deletion capability
- Download converted content
- Error message display

## Database Schema

### storage_files Table
```sql
CREATE TABLE storage_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    bucket_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    conversion_status TEXT DEFAULT 'pending',
    original_content TEXT,
    converted_content TEXT,
    error_message TEXT,
    migration_id UUID,
    performance_metrics JSONB,
    issues JSONB,
    data_type_mapping JSONB,
    syntax_differences JSONB
);
```

## Usage

### 1. Accessing Storage Files
1. Navigate to the "Storage" tab in the main dashboard
2. Select a storage bucket from the dropdown (ecommercedb or employeedb)
3. Browse available files in the bucket
4. Select files using checkboxes
5. Click "Select Files" to add them to the conversion queue

### 2. Monitoring Conversion Status
1. Go to the "Storage" tab to view all storage files
2. Use the status tabs to filter files:
   - **All**: View all files
   - **Pending**: Files waiting for conversion
   - **Converting**: Files currently being processed
   - **Converted**: Successfully converted files
   - **Failed**: Files that failed conversion

### 3. Managing Files
- **Delete**: Remove files from the storage files list
- **Download**: Download converted content (available for successful conversions)
- **Refresh**: Update the file list to see latest status changes

## Technical Implementation

### Components
- `SupabaseStorageSelector`: Main component for browsing and selecting storage files
- `StorageFilesPanel`: Panel for viewing and managing storage files
- `useStorageFiles`: Hook for managing storage file operations

### Key Functions
- `fetchStorageFiles()`: Retrieve files from storage buckets
- `saveCodeFileToStorage()`: Save selected files to database
- `updateStorageFileStatus()`: Update conversion status in real-time
- `deleteStorageFile()`: Remove files from storage files list

### Integration Points
- **CodeUploader**: Integrated storage tab for file selection
- **ConversionLogic**: Updated to handle storage files and update status
- **MigrationManager**: Enhanced to save storage files to database
- **Dashboard**: New storage tab with real-time status updates

## Configuration

### Supported Buckets
Currently configured buckets:
- `ecommercedb`
- `employeedb`

### File Extensions
Supported file types for conversion:
- `.sql` - SQL files
- `.txt` - Text files
- `.prc` - Procedure files
- `.trg` - Trigger files
- `.tab` - Table files
- `.proc` - Procedure files
- `.sp` - Stored procedure files

## Security

### Row Level Security (RLS)
The `storage_files` table includes RLS policies:
- Users can only view their own storage files
- Users can only insert/update/delete their own files
- Automatic user_id assignment based on authenticated user

### Access Control
- File access restricted to authenticated users
- Bucket access controlled by Supabase storage policies
- File operations logged and tracked

## Error Handling

### Common Issues
1. **Bucket Access**: Ensure proper storage bucket permissions
2. **File Size**: Large files may take longer to process
3. **Network Issues**: Connection problems during file download
4. **Conversion Failures**: AI model errors or unsupported syntax

### Error Recovery
- Automatic retry mechanisms for failed downloads
- Graceful error handling with user notifications
- Error message storage for debugging
- File status preservation during failures

## Future Enhancements

### Planned Features
1. **Additional Buckets**: Support for more storage buckets
2. **File Organization**: Folder structure support
3. **Bulk Operations**: Mass file operations
4. **Advanced Filtering**: Search and filter capabilities
5. **Export Options**: Batch export of converted files
6. **Version Control**: File version tracking
7. **Collaboration**: Shared storage access

### Performance Optimizations
1. **Caching**: File content caching for faster access
2. **Batch Processing**: Improved batch conversion handling
3. **Lazy Loading**: Progressive file loading for large buckets
4. **Background Sync**: Automatic status synchronization

## Troubleshooting

### Common Problems
1. **Files not appearing**: Check bucket permissions and file extensions
2. **Status not updating**: Refresh the storage files panel
3. **Conversion failures**: Check file content and AI model availability
4. **Database errors**: Verify RLS policies and user authentication

### Debug Information
- Check browser console for error messages
- Verify Supabase connection and authentication
- Review storage bucket permissions
- Check database logs for RLS policy violations 