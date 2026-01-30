# MatUp Frontend

A fitness partner matching platform where users can find workout partners, join fitness events, and build a trusted fitness community.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Package Manager:** npm

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── login/
│   │   └── page.tsx       # Login page
│   ├── signup/
│   │   └── page.tsx       # Signup page
│   ├── events/
│   │   └── page.tsx       # Events listing
│   ├── profile/           # User profiles (TODO)
│   └── dashboard/         # User dashboard (TODO)
├── components/            # Reusable components (TODO)
└── lib/                   # Utilities, API client (TODO)
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | User login |
| `/signup` | User registration |
| `/events` | Browse fitness events |

## Development

The app uses hot reload - changes to files automatically update in the browser.

### Key files to know

- `src/app/layout.tsx` - Global layout, metadata, fonts
- `src/app/globals.css` - Tailwind config and global styles
- `src/app/page.tsx` - Landing page

### Adding a new page

Create a folder with `page.tsx` inside `src/app/`:

```
src/app/my-new-page/page.tsx  →  /my-new-page
```

## MVP Roadmap

- [ ] Supabase integration (auth + database)
- [ ] User authentication (signup/login/logout)
- [ ] User profiles
- [ ] Create event form
- [ ] Event detail page with join functionality
- [ ] User dashboard
- [ ] Basic ratings system
- [ ] Deploy to Vercel

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
