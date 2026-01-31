# VoTales UI - Quick Start Guide

## How to Use

1. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

2. **Enter a Tale ID**: 
   - The app will show a welcome screen asking for a Tale ID (GUID)
   - Enter a valid tale ID from your backend
   - Click "Begin Reading"

3. **Read and Choose**:
   - The tale content appears in the center with elegant typography
   - Scroll down to see available choices at the bottom
   - Each choice shows preview text and vote count
   - Click a choice to navigate to the next tale

4. **Navigate Back**:
   - Use the "Go Back" button to return to previous tales
   - The app maintains your reading history

## Key Components

### TaleReader
Main reading interface component located at [src/components/TaleReader.tsx](src/components/TaleReader.tsx)

**Features**:
- Fetches tale data using React Query
- Displays tale content with ebook-style formatting
- Shows choices in a fixed bottom panel
- Handles voting and navigation
- Maintains reading history for back navigation

### States Components
Reusable UI states at [src/components/States.tsx](src/components/States.tsx)
- `LoadingState` - Animated loading indicator
- `ErrorState` - Error display with optional retry
- `EmptyState` - Empty state placeholder

## API Endpoints Expected

Make sure your .NET backend at `https://localhost:32771` implements:

```
GET  /api/tales/{id}/with-choices
Response: {
  tale: { id: string, content: string },
  choices: [{ id: string, taleId: string, previewText: string, votes: number, targetTaleId: string }]
}

POST /api/choices/{choiceId}/vote
Response: 204 No Content or 200 OK
```

## Customization Examples

### Change Background Color
In [src/components/TaleReader.tsx](src/components/TaleReader.tsx), replace:
```tsx
className="min-h-screen bg-[#faf9f6]"
```
with your preferred color.

### Adjust Reading Width
Change `max-w-3xl` in TaleReader to:
- `max-w-2xl` - Narrower (more ebook-like)
- `max-w-4xl` - Wider
- `max-w-5xl` - Very wide

### Change Font
Edit [tailwind.config.js](tailwind.config.js):
```javascript
fontFamily: {
  'serif': ['Merriweather', 'Georgia', 'serif'],
}
```
Then add Google Font link in [index.html](index.html).

## Troubleshooting

### HTTPS/SSL Certificate Issues
If you get SSL errors connecting to `https://localhost:32771`:

Edit [src/services/api.ts](src/services/api.ts) and add:
```typescript
import https from 'https';

const api = axios.create({
  baseURL: API_BASE_URL,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Only for local development!
  })
});
```

### CORS Issues
Make sure your .NET backend allows CORS from `http://localhost:5173`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

### Tale Not Loading
1. Check browser console for API errors
2. Verify tale ID is correct GUID format
3. Ensure backend is running at https://localhost:32771
4. Test API endpoint directly in browser or Postman

## Next Steps

1. **Add Authentication**: Integrate user authentication for personalized reading
2. **Story Tree Visualization**: Use React Flow to show the branching structure
3. **Reading Progress**: Save progress to localStorage or backend
4. **Social Features**: Share tales, favorite paths, comment on choices

## File Structure Summary

```
src/
├── components/
│   ├── TaleReader.tsx    # Main reading interface ⭐
│   └── States.tsx        # Loading/Error/Empty states
├── services/
│   └── api.ts            # API client configuration
├── types/
│   └── tale.ts           # TypeScript interfaces
├── App.tsx               # Tale ID input & routing
├── main.tsx              # React Query setup
└── index.css             # Tailwind imports
```

Happy reading! 📖✨
