# A11y Playground - Intentional Accessibility Issues

This playground app contains intentional accessibility issues for testing the Nuxt A11y module.

## Common Accessibility Issues Implemented

### Layout (Header & Footer)
- ❌ Non-semantic navigation markup (div instead of nav)
- ❌ Missing aria-labels on navigation
- ❌ Images missing alt text
- ❌ Poor color contrast on links (#aaa on dark background)
- ❌ Button without accessible name
- ❌ Heading order skipped (h1 to h4)
- ❌ Non-descriptive link text ("Click here", "Read more")
- ❌ Low contrast text in footer
- ❌ Contact info as plain text instead of links

### Home Page (/)
- ❌ Heading level skip (h1 to h4)
- ❌ Poor contrast buttons
- ❌ Empty link
- ❌ Decorative images without alt=""
- ❌ Section without heading or aria-label
- ❌ Icon without alt text or aria-label
- ❌ Low contrast text
- ❌ Non-descriptive link text
- ❌ onClick on div instead of button
- ❌ Images missing alt text
- ❌ Form without labels (placeholder as label)
- ❌ Button with no accessible name
- ❌ Checkbox without proper label association

### About Page (/about-us)
- ❌ Heading level skip (h1 to h4)
- ❌ Low contrast text
- ❌ Redundant link text
- ❌ Images missing alt text
- ❌ Role not properly marked up
- ❌ Icon buttons without labels
- ❌ List not using proper list markup
- ❌ Numbers not marked up as data
- ❌ Timeline without proper ARIA landmarks

### Contact Page (/contact)
- ❌ Form inputs without labels (placeholders only)
- ❌ Email input without autocomplete
- ❌ Select without label
- ❌ Textarea without label or character limit
- ❌ Checkboxes without proper label association
- ❌ Low contrast submit button
- ❌ Reset button (not recommended)
- ❌ Contact info not in address tag
- ❌ Icons without text alternatives
- ❌ Phone and email not clickable links
- ❌ Social media links without accessible names
- ❌ iframe without title
- ❌ FAQ not using proper disclosure pattern (button/details)

## Testing the A11y Plugin

1. Run the playground: `pnpm run dev`
2. Open http://localhost:3000 in your browser
3. Open Nuxt DevTools (Shift + Option + D)
4. Navigate to the A11y tab
5. Click "Trigger Scan" to see all violations
6. Test the new ID feature by:
   - Clicking on individual affected elements to pin them
   - Hovering over violation cards to highlight elements
   - Unpinning elements to see ID reassignment
   - Pinning elements across different violations that share the same selector

## Routes

- **/** - Home page with hero, services, CTA, gallery, and newsletter
- **/about-us** - About page with mission, team, values, stats, and timeline
- **/contact** - Contact page with form, info, map, and FAQ

All pages include a shared header and footer with navigation.
