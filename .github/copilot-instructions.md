# AI Coding Instructions for Next.js App Router

## 1. Code Style & Structure

- **Framework:** Use Next.js 14+ App Router (`app/` directory). Do not use the `pages/` directory.
- **Language:** TypeScript. Use interfaces for props and data types.
- **Components:**
  - Default to **Server Components**.
  - Use `'use client'` only when necessary (hooks, event listeners, state).
  - Use functional components with arrow functions: `const Component = () => {}`.
- **Styling:**
  - Use **Tailwind CSS** for all styling.
  - Use **shadcn/ui** components for UI elements (Buttons, Inputs, Cards). Do not build these from scratch.
  - Avoid arbitrary values (e.g., `h-[50px]`). Use standard Tailwind spacing (e.g., `h-12`).

## 2. Data Fetching & State

- **Server Side:** Use direct DB calls (Supabase) in Server Components.
- **Client Side:** Use `TanStack Query` (React Query) for client-side fetching if needed.
- **Mutations:** Use **Server Actions** for form submissions and data mutations. Do not use API routes (`pages/api`) unless absolutely necessary.
- **Optimistic UI:** Implement optimistic updates for a snappy mobile feel.

## 3. Database (Supabase)

- Use the generated types from Supabase: `Database['public']['Tables']['tablename']['Row']`.
- Do not manually type database interfaces; infer them from the Supabase client.

## 4. File Naming

- Use `kebab-case` for file names (e.g., `dashboard-card.tsx`).
- Use `page.tsx` for routes and `layout.tsx` for layouts.
- Place related components in a `_components` folder inside the route directory.

## 5. Mobile First Design

- Always write mobile styles first (e.g., `w-full`).
- Add responsive breakpoints (e.g., `md:w-1/2`) only for larger screens.
- Ensure touch targets are at least 44px for buttons/inputs.
