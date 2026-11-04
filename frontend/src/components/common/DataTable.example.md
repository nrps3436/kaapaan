# DataTable Component - Usage Examples

Professional dataframe-style table with Pandas/Streamlit/Notion-inspired design.

## Import

```typescript
import DataTable from './components/common/DataTable'
```

## Basic Usage

```typescript
const columns = [
  { key: 'id', label: 'ID', type: 'number', align: 'right', sortable: true },
  { key: 'name', label: 'Vessel Name', type: 'text', sortable: true },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'lat', label: 'Latitude', type: 'number', align: 'right' },
  { key: 'lng', label: 'Longitude', type: 'number', align: 'right' },
  { key: 'timestamp', label: 'Last Updated', type: 'date' },
]

const data = [
  { id: 1, name: 'அலை மீன்', status: 'Active', lat: 10.123, lng: 80.456, timestamp: '2024-11-04T16:30:00Z' },
  { id: 2, name: 'கடல் வெற்றி', status: 'Safe', lat: 9.876, lng: 79.234, timestamp: '2024-11-04T16:28:00Z' },
  { id: 3, name: 'மீன் செல்வம்', status: 'Warning', lat: 11.234, lng: 81.567, timestamp: '2024-11-04T16:25:00Z' },
]

<DataTable 
  columns={columns} 
  data={data}
  onSort={(key) => console.log('Sort by', key)}
  sortKey="id"
  sortDirection="asc"
/>
```

## Features

✅ **Sticky Header** - Header stays visible while scrolling
✅ **Zebra Striping** - Alternating row colors for readability
✅ **Hover Effects** - Smooth row highlighting on hover
✅ **Monospaced Numbers** - Perfect column alignment for numeric data
✅ **Status Badges** - Color-coded status indicators
✅ **Sortable Columns** - Click headers to sort (optional)
✅ **Dark Mode** - Automatically adapts to system theme
✅ **Responsive** - Horizontal scroll on small screens

## Column Types

- `text` - Regular text (left-aligned by default)
- `number` - Monospaced numeric data (right-aligned, 2 decimal places)
- `date` - ISO timestamp converted to locale string
- `status` - Color-coded badge (Safe/Warning/Critical/Danger)

## Status Colors

The `status` type automatically color-codes values:
- **Green** - "Safe", "Active"
- **Yellow** - "Warning", "Moderate"  
- **Orange** - "Critical", "High"
- **Red** - "Danger", "SOS"

## Styling

Professional dataframe styles are defined in `index.css`:
- Clean grid borders with thin gray lines
- Sans-serif font (Inter) for readability
- Tabular nums for perfect number alignment
- Subtle shadows and transitions
- Light & dark mode color palettes
