# SwingVista HTML Structure Documentation

This document outlines the HTML structure, semantic markup, and accessibility features of the SwingVista application.

## Application Architecture

SwingVista is built with Next.js 15 using the App Router, which generates semantic HTML with proper structure and accessibility features.

## Root Layout Structure

### HTML Document Structure

```html
<!DOCTYPE html>
<html lang="en" class="inter-font inter-variable">
<head>
  <!-- Critical CSS inlined to prevent FOUC -->
  <style>
    html { background-color: #FAFAFA !important; }
    body { margin: 0 !important; background-color: #FAFAFA !important; }
    .fouc-prevention { background-color: #FAFAFA !important; }
  </style>
  
  <!-- Meta tags -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10B981">
  
  <!-- Title and description -->
  <title>SwingVista - Golf Swing Analysis</title>
  <meta name="description" content="Advanced golf swing analysis with AI-powered insights">
</head>
<body class="min-h-screen bg-white text-gray-900 antialiased fouc-prevention">
  <header class="border-b border-gray-200 bg-white">
    <!-- Header content -->
  </header>
  
  <main class="min-h-screen bg-white">
    <!-- Page content -->
  </main>
  
  <footer class="border-t border-gray-200 bg-white">
    <!-- Footer content -->
  </footer>
</body>
</html>
```

## Page Structure

### Home Page (`/`)

```html
<main class="max-w-5xl mx-auto px-4 py-16">
  <div class="text-center">
    <h1 class="text-5xl font-bold mb-6 text-gray-900">
      Welcome to <span class="text-green-600">SwingVista</span>
    </h1>
    <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Advanced golf swing analysis with AI-powered insights.
    </p>
    <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
      <a href="/camera" class="w-full sm:w-auto bg-green-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]">
        📹 Start Camera Analysis
      </a>
      <a href="/upload" class="w-full sm:w-auto bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]">
        📤 Upload Video
      </a>
    </div>
  </div>
</main>
```

## Component Structure

### Header Component

```html
<header class="border-b border-gray-200 bg-white">
  <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
    <a href="/" class="flex items-center space-x-2">
      <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">SV</span>
      </div>
      <span class="font-bold text-xl text-gray-800">SwingVista</span>
    </a>
    <nav class="flex items-center gap-8 text-sm font-medium">
      <a href="/" class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200">
        🏠 Home
      </a>
      <a href="/camera" class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200">
        📹 Camera
      </a>
      <a href="/upload" class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200">
        📤 Upload
      </a>
    </nav>
  </div>
</header>
```

## Semantic HTML Elements

### Document Structure
- `<html>`: Root element with language attribute
- `<head>`: Document metadata and resources
- `<body>`: Document content with accessibility classes

### Content Structure
- `<header>`: Site header with navigation
- `<main>`: Main content area
- `<footer>`: Site footer with links
- `<nav>`: Navigation sections

### Heading Hierarchy
```html
<h1>Welcome to SwingVista</h1>          <!-- Page title -->
  <h2>Camera Ready</h2>                  <!-- Section title -->
  <h2>Upload Area</h2>                   <!-- Section title -->
```

## Accessibility Features

### ARIA Attributes
```html
<button disabled aria-label="Processing, please wait">
  Processing...
</button>

<nav role="navigation" aria-label="Main navigation">
  <a href="/" aria-current="page">Home</a>
</nav>
```

### Focus Management
```html
<button tabindex="0" onkeydown="handleKeyDown">
  Start Recording
</button>
```

## Responsive Design Structure

### Mobile-First Approach
```html
<div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
  <button class="w-full sm:w-auto ...">Mobile Full Width</button>
  <button class="w-full sm:w-auto ...">Desktop Auto Width</button>
</div>
```

### Breakpoint Classes
- `sm:` (640px+): Small screens and up
- `md:` (768px+): Medium screens and up
- `lg:` (1024px+): Large screens and up
- `xl:` (1280px+): Extra large screens and up

## Performance Optimizations

### Critical CSS Inlining
```html
<style>
  html { background-color: #FAFAFA !important; }
  body { margin: 0 !important; }
  .fouc-prevention { background-color: #FAFAFA !important; }
</style>
```

### Font Loading
```html
<link rel="preload" href="/_next/static/media/inter.woff2" as="font" type="font/woff2" crossorigin>
```

## SEO Structure

### Meta Tags
```html
<head>
  <title>SwingVista - Golf Swing Analysis</title>
  <meta name="description" content="Advanced golf swing analysis with AI-powered insights">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10B981">
</head>
```

## Future HTML Enhancements

### Planned Features
1. **Video Elements**: `<video>` tags for swing analysis
2. **Form Elements**: Input fields for user data
3. **Canvas Elements**: For swing visualization
4. **WebRTC Elements**: For camera access

### Accessibility Improvements
1. **Skip Links**: Navigation shortcuts
2. **Landmark Roles**: Better screen reader support
3. **Live Regions**: Dynamic content announcements
4. **High Contrast**: Better color contrast options

---

This HTML structure documentation will be updated as new features and accessibility improvements are added to the application.