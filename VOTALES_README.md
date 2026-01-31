# VoTales UI - Branching Story Platform Frontend

A minimalist, ebook-reader-inspired interface for reading and navigating branching stories.

## Features

- **Elegant Reading Experience**: Clean, serif typography with optimal line length and spacing
- **Branch Navigation**: Choose your story path with vote counts visible
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- **History Navigation**: Go back to previous tale nodes
- **Real-time Vote Tracking**: See which paths are most popular

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query (TanStack)** - Data fetching and caching
- **Axios** - API client
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/
│   └── TaleReader.tsx      # Main reading interface component
├── services/
│   └── api.ts              # API service layer
├── types/
│   └── tale.ts             # TypeScript type definitions
├── App.tsx                 # Main app component with tale ID input
└── main.tsx                # Entry point with React Query provider
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## API Integration

The app connects to a .NET 9 API at `https://localhost:32771`. Expected endpoints:

- `GET /api/tales/{id}/with-choices` - Get tale with available choices
- `GET /api/tales/{id}` - Get single tale
- `GET /api/tales/{taleId}/choices` - Get choices for a tale
- `POST /api/choices/{choiceId}/vote` - Vote for a choice

## Data Models

### Tale
```typescript
{
  id: string;        // GUID
  content: string;   // Tale text content
}
```

### Choice
```typescript
{
  id: string;           // GUID
  taleId: string;       // Parent tale ID
  previewText: string;  // Choice description
  votes: number;        // Vote count
  targetTaleId: string; // Next tale ID
}
```

## Design Philosophy

The interface is designed to feel like a premium ebook reader:
- Cream background (#faf9f6) reduces eye strain
- Serif fonts (Georgia) for comfortable reading
- Generous padding and line height
- Choices fixed at bottom, out of reading flow
- Minimal, unobtrusive UI elements

## Customization

### Colors
Edit `src/components/TaleReader.tsx` and `src/App.tsx` to change color scheme. Current palette uses stone grays and cream backgrounds.

### Typography
Adjust font families in `tailwind.config.js`:
```javascript
fontFamily: {
  'serif': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
}
```

### API URL
Update in `src/services/api.ts`:
```typescript
const API_BASE_URL = 'https://localhost:32771/api';
```

## Future Enhancements

- [ ] Save reading progress
- [ ] React Flow visualization of story tree
- [ ] Dark mode support
- [ ] Bookmark favorite paths
- [ ] Share tale IDs easily
- [ ] Reading statistics

## License

MIT
