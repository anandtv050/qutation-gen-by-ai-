# Text Input Application

A production-ready text input interface built with React, TypeScript, Vite, and shadcn/ui. Works seamlessly on both web and mobile devices.

## Features

- Clean, modern UI with shadcn/ui components
- Fully responsive design for web and mobile
- Character counter
- Loading states
- Form validation
- Dark mode support (via CSS variables)
- TypeScript for type safety
- Fast development with Vite

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── textarea.tsx
│   │   └── card.tsx
│   └── TextInputForm.tsx # Main form component
├── lib/
│   └── utils.ts         # Utility functions
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles with Tailwind
```

## Customization

### Modifying the Form Handler

Edit the `handleSubmit` function in [src/components/TextInputForm.tsx](src/components/TextInputForm.tsx) to integrate with your API:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!text.trim()) return

  setIsLoading(true)

  try {
    // Replace with your API call
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    const data = await response.json()
    setResult(data.result)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsLoading(false)
  }
}
```

### Styling

The app uses Tailwind CSS with shadcn/ui's design system. Customize colors and themes in:

- [src/index.css](src/index.css) - CSS variables for colors
- [tailwind.config.js](tailwind.config.js) - Tailwind configuration

### Adding More Components

Add more shadcn/ui components by creating files in `src/components/ui/` following the shadcn/ui documentation.

## Mobile Optimization

The interface is fully responsive with:
- Touch-friendly tap targets (minimum 44x44px)
- Readable text sizes on mobile
- Proper viewport scaling
- Flexible layouts that adapt to screen size
- Optimized form controls for mobile keyboards

## License

MIT
