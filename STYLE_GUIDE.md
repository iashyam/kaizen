# Programming Style & Design Guide

Reference guide for building apps with this stack and conventions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite |
| Styling | Tailwind CSS v4 with CSS custom properties |
| Server State | TanStack React Query v5 |
| Routing | react-router-dom v7 |
| Icons | lucide-react |
| Drag & Drop | @dnd-kit |
| Charts | recharts |
| Backend | Python FastAPI + Motor (async MongoDB) |
| Auth | JWT (python-jose) + bcrypt |
| Validation | Pydantic v2 |

## Project Structure

```
/frontend/src
  /components      # Reusable UI components (PascalCase files)
  /pages           # Route-level page components
  /contexts        # React Context providers (Auth, Theme)
  /hooks           # Custom hooks (camelCase files)
  /models          # Config objects, constants, type mappings
  api.ts           # All backend communication
  index.css        # Theme variables, custom animations
  App.tsx          # Router setup, provider hierarchy

/backend
  /models          # Pydantic request/response schemas
  /routers         # FastAPI route handlers per feature
  /services        # Business logic (streak calc, scheduling)
  main.py          # App entry, lifespan, router includes
  auth.py          # JWT + password handling
  database.py      # MongoDB client setup + indexes
  config.py        # Environment variable loading
```

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Components | PascalCase file + export | `HabitCard.tsx` |
| Hooks | camelCase, `use` prefix | `useSwipe.ts` |
| Constants | SCREAMING_SNAKE_CASE | `CATEGORY_CONFIG` |
| Props | `interface Props` above component | `interface Props { habit: Habit }` |
| API functions | camelCase, verb prefix | `createHabit()`, `getTodosToday()` |
| Backend routes | snake_case, REST verbs | `POST /api/habits` |
| Query keys | Array format | `['todos-today']`, `['habits', id]` |

## Component Pattern

```tsx
interface Props {
  habit: HabitWithStatus;
  onToggle: (id: string, completed: boolean) => void;
}

export default function HabitCard({ habit, onToggle }: Props) {
  const [animating, setAnimating] = useState(false);

  return (
    <div className="bg-surface-card rounded-xl p-4">
      {/* ... */}
    </div>
  );
}
```

Rules:
- Functional components only, no class components
- Props interface defined directly above the component
- Default export for page/feature components
- Hooks at the top of the function body

## State Management (3 Layers)

### 1. Context API - Global UI state
Auth (user/token/login/logout) and Theme (light/dark toggle). Persisted in localStorage.

### 2. React Query - Server state
```tsx
// Fetching
const { data: todos } = useQuery({
  queryKey: ['todos-today'],
  queryFn: getTodosToday,
});

// Mutations with optimistic updates
const addMutation = useMutation({
  mutationFn: createTodo,
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: ['todos-today'] });
    const prev = queryClient.getQueryData(['todos-today']);
    queryClient.setQueryData(['todos-today'], [...(prev ?? []), optimistic]);
    return { prev };
  },
  onError: (_err, _vars, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(['todos-today'], ctx.prev);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos-today'] });
  },
});
```

Default config: 30s stale time, 1 retry.

### 3. Local state - Component UI flags
Simple `useState` for animation flags, form inputs, toggles.

## API Layer

Single `api.ts` file. All requests go through a shared `request<T>()` helper:

```tsx
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...options });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
```

Export named functions grouped by feature: `getHabits()`, `createTodo()`, `updateBudget()`, etc.

## Styling

### Theme System (CSS custom properties)

```css
:root {
  --surface-bg: #f7f7f7;
  --surface-card: #ffffff;
  --text-primary: #3c3c3c;
  --text-secondary: #777777;
  --border-color: #e5e5e5;
}

.dark {
  --surface-bg: #131f24;
  --surface-card: #1a2c35;
  --text-primary: #e5e5e5;
  /* ... */
}
```

### Tailwind Usage
- Semantic classes: `bg-surface-card`, `text-txt-primary`, `border-brd`
- Spacing: `gap-3`, `p-4`, `mb-3`
- Rounded corners: `rounded-xl`, `rounded-full`
- Transitions: `transition-all duration-300`
- Press feedback: `active:scale-90`

### Custom Animations
Define `@keyframes` in `index.css`, expose as utility classes:
- `.animate-jelly` - spring press effect
- `.animate-bounce-in` - element appearance
- `.animate-slide-up` - modal entry

## Mobile-First / PWA

- Viewport: `width=device-width, viewport-fit=cover`
- Height: `100dvh` (dynamic viewport height)
- Safe area: `padding-top: env(safe-area-inset-top)`
- Tap handling: `-webkit-tap-highlight-color: transparent`
- Touch: `touch-action: manipulation`
- Keyboard detection via `visualViewport` API, adjust layout when keyboard opens

## Backend Patterns

### Route Handler
```python
@router.post("/")
async def create_habit(habit: HabitCreate, user: dict = Depends(get_current_user)):
    doc = habit.model_dump()
    doc["user_id"] = user["id"]
    result = await db.habits.insert_one(doc)
    return {"id": str(result.inserted_id)}
```

### Pydantic Models
```python
class HabitCreate(BaseModel):
    name: str
    category: str
    repeat_type: str = "daily"
    repeat_days: list[int] = []
    emoji: str | None = None
```

### Auth
- All endpoints use `Depends(get_current_user)` for JWT validation
- All DB queries filter by `user_id` to enforce ownership
- Passwords hashed with bcrypt, tokens are JWT with expiry

## Key Principles

1. **Optimistic updates everywhere** - Mutate UI immediately, rollback on error
2. **Mobile-first** - Design for phone, PWA-capable
3. **Light + dark theme** - CSS variables toggle via `.dark` class
4. **Minimal dependencies** - Prefer native APIs over libraries
5. **Feature-grouped files** - Backend routers/models/services per feature
6. **Single API module** - All fetch calls in one `api.ts` file
7. **Animations for feedback** - Jelly, bounce, slide for tactile feel
8. **No class components** - Hooks-only React
