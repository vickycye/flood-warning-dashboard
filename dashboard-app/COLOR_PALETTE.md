# Universal Color Palette Documentation

This document explains how to use the universal color palette configured in your Tailwind CSS v4 setup.

## Overview

The color palette is configured in `src/app/globals.css` using Tailwind CSS v4's `@theme inline` feature. This provides a consistent color system across your entire application with automatic dark mode support.

## Color Categories

### 1. Primary Colors (UW purple)
Used for main brand elements, primary buttons, links, and key UI elements.

**Usage Examples:**
```html
<!-- Primary button -->
<button class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded">
  Primary Action
</button>

<!-- Primary text -->
<h1 class="text-primary-700">Main Heading</h1>

<!-- Primary background -->
<div class="bg-primary-50">Light primary background</div>
```

### 2. Secondary Colors (UW gold or grey)
Used for secondary elements, borders, backgrounds, and supporting UI elements.

**Usage Examples:**
```html
<!-- Secondary button -->
<button class="bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-4 py-2 rounded">
  Secondary Action
</button>

<!-- Card background -->
<div class="bg-secondary-50 border border-secondary-200 p-4 rounded">
  Card content
</div>

<!-- Muted text -->
<p class="text-secondary-600">Secondary information</p>
```

### 3. Accent Colors (Green-based)
Used for success states, positive actions, and highlighting important information.

**Usage Examples:**
```html
<!-- Success indicator -->
<div class="bg-accent-100 text-accent-800 px-3 py-1 rounded">
  Success
</div>

<!-- Positive action button -->
<button class="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded">
  Confirm
</button>
```

### 4. Warning Colors (Yellow/Orange-based)
Used for warnings, alerts, and cautionary messages.

**Usage Examples:**
```html
<!-- Warning alert -->
<div class="bg-warning-100 border border-warning-300 text-warning-800 px-4 py-3 rounded">
  Warning message
</div>

<!-- Warning button -->
<button class="bg-warning-500 hover:bg-warning-600 text-white px-4 py-2 rounded">
  Proceed with Caution
</button>
```

### 5. Error Colors (Red-based)
Used for error states, destructive actions, and critical messages.

**Usage Examples:**
```html
<!-- Error message -->
<div class="bg-error-100 border border-error-300 text-error-800 px-4 py-3 rounded">
  Error occurred
</div>

<!-- Delete button -->
<button class="bg-error-500 hover:bg-error-600 text-white px-4 py-2 rounded">
  Delete
</button>
```

### 6. Success Colors (Green-based)
Used for success messages and positive feedback.

**Usage Examples:**
```html
<!-- Success message -->
<div class="bg-success-100 border border-success-300 text-success-800 px-4 py-3 rounded">
  Operation completed successfully
</div>
```

### 7. Neutral Colors (Gray-based)
Used for text, backgrounds, and general UI elements.

**Usage Examples:**
```html
<!-- Body text -->
<p class="text-neutral-700">Regular paragraph text</p>

<!-- Light background -->
<div class="bg-neutral-50">Light background</div>

<!-- Border -->
<div class="border border-neutral-200">Bordered element</div>
```

## Color Scale

Each color category follows a 50-950 scale where:
- **50-100**: Very light tints (backgrounds, hover states)
- **200-300**: Light tints (borders, subtle backgrounds)
- **400-500**: Medium shades (main brand colors, buttons)
- **600-700**: Darker shades (hover states, emphasis)
- **800-900**: Dark shades (text on light backgrounds)
- **950**: Darkest shades (text on very light backgrounds)

## Dark Mode Support

The color palette automatically adapts to dark mode using `prefers-color-scheme: dark`. Colors are inverted appropriately for better contrast and readability in dark environments.

## Common Usage Patterns

### Headers
```html
<h1 class="text-primary-700 dark:text-primary-300">Main Header</h1>
<h2 class="text-secondary-800 dark:text-secondary-200">Sub Header</h2>
<h3 class="text-neutral-700 dark:text-neutral-300">Section Header</h3>
```

### Buttons
```html
<!-- Primary button -->
<button class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded transition-colors">
  Primary Action
</button>

<!-- Secondary button -->
<button class="bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-4 py-2 rounded transition-colors">
  Secondary Action
</button>

<!-- Danger button -->
<button class="bg-error-500 hover:bg-error-600 text-white px-4 py-2 rounded transition-colors">
  Delete
</button>
```

### Cards
```html
<div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 shadow-sm">
  <h3 class="text-neutral-900 dark:text-neutral-100 mb-2">Card Title</h3>
  <p class="text-neutral-600 dark:text-neutral-400">Card content</p>
</div>
```

### Alerts
```html
<!-- Success alert -->
<div class="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-success-800 dark:text-success-200 px-4 py-3 rounded">
  Success message
</div>

<!-- Error alert -->
<div class="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-800 dark:text-error-200 px-4 py-3 rounded">
  Error message
</div>
```

## Customization

To modify the color palette:

1. Edit the CSS custom properties in the `:root` section of `src/app/globals.css`
2. Update the corresponding `@theme inline` variables
3. Adjust dark mode colors in the `@media (prefers-color-scheme: dark)` section

## Best Practices

1. **Consistency**: Use the same color categories for similar UI elements across your application
2. **Accessibility**: Ensure sufficient contrast ratios between text and background colors
3. **Semantic Meaning**: Use colors that match their semantic meaning (red for errors, green for success, etc.)
4. **Dark Mode**: Always test your color choices in both light and dark modes
5. **Hover States**: Use slightly darker/lighter shades for hover and active states

## Available Classes

You can use any of these Tailwind classes throughout your application:

- `bg-primary-{50-950}`, `text-primary-{50-950}`, `border-primary-{50-950}`
- `bg-secondary-{50-950}`, `text-secondary-{50-950}`, `border-secondary-{50-950}`
- `bg-accent-{50-950}`, `text-accent-{50-950}`, `border-accent-{50-950}`
- `bg-warning-{50-950}`, `text-warning-{50-950}`, `border-warning-{50-950}`
- `bg-error-{50-950}`, `text-error-{50-950}`, `border-error-{50-950}`
- `bg-success-{50-950}`, `text-success-{50-950}`, `border-success-{50-950}`
- `bg-neutral-{50-950}`, `text-neutral-{50-950}`, `border-neutral-{50-950}`

Replace `{50-950}` with any number from 50 to 950 in increments of 50. 