# NeuroBridge AI - Architecture & Implementation Guide

## System Overview

NeuroBridge AI is a comprehensive hospital emergency triage and EEG analysis platform. The system is designed for real-time patient prioritization and AI-assisted clinical decision-making in high-stress emergency settings.

## Architecture

### Frontend Architecture

```
Next.js 16 (App Router)
├── Client Components (Interactive)
│   ├── Modals (Patient Input)
│   ├── Dashboards (Real-time Data)
│   └── Forms (Data Submission)
├── Server Components (Data Fetching)
│   ├── Layouts
│   └── Static Pages
└── API Routes (Optional Backend Integration)
```

### Component Hierarchy

```
RootLayout
├── Sidebar (Navigation)
└── Header (Top Navigation)
    ├── Search
    ├── Notifications
    └── User Menu

Main Content Areas:
├── Dashboard (/)
│   ├── KPI Cards
│   └── Patient Queue
├── Patients (/patients)
│   ├── Patient List
│   └── Patient Detail [id]
├── EEG (/eeg)
│   ├── Upload Interface
│   └── Analysis View [id]
├── Queue (/queue)
│   └── Queue Management
├── Reports (/reports)
│   └── Analytics Dashboard
├── Admin (/admin)
│   ├── System Metrics
│   ├── User Management
│   └── Activity Logs
└── Settings (/settings)
    └── User Preferences
```

## Data Flow

### Patient Triage Flow

```
User Opens Dashboard
    ↓
Sidebar displays default route (/)
    ↓
Dashboard loads with:
    - Real-time patient queue
    - KPI metrics
    - Sample patient data
    ↓
User clicks "New Triage Assessment"
    ↓
Modal opens with form
    ↓
User enters:
    - Patient name
    - Vital signs
    - Chief complaint
    ↓
AI calculates urgency (simulated)
    ↓
Patient added to queue
    ↓
Dashboard updates with new patient
    ↓
User can click patient for detailed view
```

### EEG Analysis Flow

```
User navigates to /eeg
    ↓
Upload interface displays
    ↓
User uploads EDF/PDF file
    ↓
File processing starts (simulated)
    ↓
File appears in "Recent Uploads"
    ↓
User clicks "View" to see analysis
    ↓
/eeg/[id] page loads with:
    - Study metadata
    - Frequency band analysis
    - Channel visualization
    - Clinical findings
```

## State Management

### Current State Approach

The application uses **React Hooks** for state management:

```typescript
// Dashboard component
const [patients, setPatients] = useState<Patient[]>([...]);
const [showTriageModal, setShowTriageModal] = useState(false);

// Queue component
const [sortBy, setSortBy] = useState<'severity' | 'timeInQueue'>('severity');
const [filterSeverity, setFilterSeverity] = useState<string>('all');
```

### For Production

Consider migrating to:
- **SWR** - For server state and caching
- **React Query** - For complex data fetching
- **Zustand** - For complex client state
- **Context API** - For shared state (auth, theme)

## Styling System

### Design Tokens (CSS Variables)

Located in `/app/globals.css`:

```css
:root {
  --primary: oklch(0.55 0.2 250);        /* Blue */
  --accent: oklch(0.6 0.25 35);          /* Orange */
  --destructive: oklch(0.6 0.25 25);     /* Red */
  --background: oklch(0.95 0.01 200);    /* Light Cyan */
}
```

### Color Usage

- **Primary**: Main buttons, links, borders
- **Accent**: Highlights, emphasis, warnings
- **Destructive**: Errors, critical alerts
- **Severity Colors**: RED/ORANGE/YELLOW/GREEN for patient triage

### Tailwind Classes

```typescript
// Semantic usage
<div className="bg-primary text-primary-foreground" />     // Primary action
<div className="bg-secondary text-secondary-foreground" /> // Secondary area
<div className="border border-border" />                   // Borders
<div className="text-muted-foreground" />                  // Muted text
```

## Component Best Practices

### Structure Pattern

```typescript
'use client'; // Mark as client component if needed

import { useState } from 'react';
import { Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  // Type definitions
}

export default function Component({ ...props }: ComponentProps) {
  const [state, setState] = useState();
  
  const handler = () => {
    // Logic
  };

  return (
    <div className="space-y-4">
      {/* JSX */}
    </div>
  );
}
```

### Naming Conventions

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Props**: `camelCase`
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

## Responsive Design

### Breakpoints (Tailwind)

- `sm`: 640px
- `md`: 768px - Sidebar becomes visible
- `lg`: 1024px
- `xl`: 1280px

### Mobile Considerations

```typescript
// Sidebar responsive
className={`
  fixed md:relative         // Fixed on mobile, relative on tablet+
  w-64 md:w-auto           // Full width on mobile
  md:ml-64                 // Add margin for layout
`}

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

## Animations & Transitions

### Available Animations (Tailwind + Custom)

- `animate-pulse` - Pulsing effect
- `animate-slide-in` - Slide from left
- `animate-fade-in` - Fade in
- `animate-scale-in` - Scale up
- `animate-spin` - Rotating spinner

### Usage

```typescript
<div className="animate-fade-in">Content appears</div>
<div className="severity-pulse-red">Critical alert</div>
<div className="duration-300 ease-out">Smooth transition</div>
```

## Error Handling

### Error Boundaries

Implement React Error Boundaries for production:

```typescript
'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## Performance Optimization

### Current

- Static generation where possible
- Component-level code splitting
- CSS utility classes (minimal bundle)
- Optimized image loading

### For Production

- Implement image optimization with `next/image`
- Add analytics and monitoring
- Cache strategies with SWR
- Database query optimization
- API response caching
- CDN for static assets

## Security Considerations

### Current (Demo)

- No authentication required
- Mock data only
- HIPAA concepts implemented (not enforced)

### For Production

1. **Authentication**
   - Implement Auth.js or similar
   - Role-based access control (RBAC)
   - Session management

2. **Data Protection**
   - Encrypt sensitive data
   - Use HTTPS/TLS
   - Implement HIPAA compliance
   - Data sanitization

3. **API Security**
   - Validate all inputs
   - Rate limiting
   - CORS configuration
   - API key management

4. **Audit & Logging**
   - Track all user actions
   - Maintain audit logs
   - Monitor for suspicious activity

## Testing

### Recommended Tools

- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Cypress** - E2E testing
- **Playwright** - Cross-browser testing

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import Header from '@/components/header';

test('Header renders with title', () => {
  render(<Header />);
  expect(screen.getByText('HEALTH')).toBeInTheDocument();
});
```

## Database Integration (Future)

### Schema Example

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  role ENUM('admin', 'doctor', 'nurse'),
  created_at TIMESTAMP
);

-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  name VARCHAR,
  mrn VARCHAR UNIQUE,
  age INT,
  gender VARCHAR
);

-- Triage Cases
CREATE TABLE triage_cases (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  severity ENUM('RED', 'ORANGE', 'YELLOW', 'GREEN'),
  vitals JSONB,
  ai_confidence FLOAT,
  created_at TIMESTAMP
);

-- EEG Studies
CREATE TABLE eeg_studies (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  file_path VARCHAR,
  duration INT,
  channels INT,
  created_at TIMESTAMP
);
```

## API Integration (Future)

### Example Endpoints

```typescript
// In route handlers (app/api/)

// GET /api/patients
export async function GET() {
  // Fetch from database
  return Response.json(patients);
}

// POST /api/triage
export async function POST(request: Request) {
  const data = await request.json();
  // Process with AI
  // Save to database
  return Response.json(result);
}

// GET /api/eeg/[id]/analysis
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Fetch EEG analysis from backend
  return Response.json(analysis);
}
```

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Automatic deployment on push
# Visit: https://your-project.vercel.app
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
AUTH_SECRET=...
```

## Monitoring & Analytics

### Recommended Services

- **Vercel Analytics** - Performance metrics
- **Sentry** - Error tracking
- **LogRocket** - Session recording
- **Datadog** - Full monitoring

### Key Metrics to Track

- Page load time
- Error rates
- User engagement
- API response times
- Database query performance

---

## Support & Resources

- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- Tailwind Docs: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

---

**Last Updated**: April 7, 2026
