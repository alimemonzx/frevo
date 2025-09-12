# Frevo - Freelancer.com Enhancement Extension

A Chrome extension that enhances your Freelancer.com experience by filtering projects based on star ratings and providing AI-powered writing assistance.

## Features

### ⭐ Star Rating Filter

- **Smart Filtering**: Filter projects based on minimum star rating (0.0 to 5.0)
- **Precise Control**: Adjust minimum rating with 0.1 precision using the slider
- **Smart Memory**: Remembers your last selected rating preference
- **Event-driven Filtering**: Triggers instantly on slider changes and page navigation
- **Toggle On/Off**: Enable or disable filtering from the extension popup
- **Search Page Only**: Filtering only works on `/search/projects` pages
- **Example**: Set to 3.5 to only see projects with 3.5+ star ratings

### ✨ AI Writing Assistant (Frevo)

- **Write with Frevo** button on project detail pages
- OpenAI integration for AI-powered content generation
- Secure API key storage in Chrome sync storage
- Test API connectivity directly from the extension
- React-based UI components with modern styling

### 📄 Jobs Per Page Control

- **Customizable Pagination**: Set jobs per page from 1 to 100 (default: 20)
- **Smart Request Interception**: Automatically modifies API requests to use your preferred pagination
- **Real-time Updates**: Changes apply immediately to new requests
- **Persistent Settings**: Remembers your pagination preference across sessions

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Usage

### Star Rating Filter

1. Click the Frevo extension icon in your browser toolbar
2. In the **Filter Controls** section (left side), toggle the filter on/off
3. **Adjust Minimum Rating**: When enabled, use the slider to set your desired minimum star rating (0.0 to 5.0)
4. **Navigate to Search Page**: Go to any Freelancer.com search page (URL contains `/search/projects`)
5. The filter will automatically hide projects below your selected rating threshold
6. **Instant Filtering**: Changes to the slider trigger filtering immediately

**Examples:**

- Set to 0.0: Show all projects (no filtering)
- Set to 3.0: Only show projects with 3.0+ star ratings
- Set to 4.5: Only show high-quality projects with 4.5+ star ratings

**Note**: The star rating filter only works on search/projects pages. It will not affect project detail pages or other sections of the site.

### AI Writing Assistant

1. In the **AI Assistant** section (right side), enter your OpenAI API key
2. Navigate to any project detail page on Freelancer.com
3. Look for the **"Write with Frevo"** button next to the existing AI button
4. Click the button to generate AI-powered proposals
5. The generated proposal will be automatically inserted into the bid form

### Jobs Per Page Control

1. In the **Filter Controls** section, find the "Jobs per page" input field
2. Enter your desired number of jobs per page (1-100, default: 20)
3. The setting is automatically saved and applied to future API requests
4. Navigate to any Freelancer.com search page to see the changes
5. The pagination will use your custom setting instead of the default 20 jobs per page

## Development

### Environment Configuration

The extension supports different environments for development and production:

#### Environment Files

- `.env.development` - Development environment (uses `http://localhost:3000`)
- `.env.production` - Production environment (uses `https://frevo.app`)
- `.env` - Default fallback environment

#### Environment Variables

- `VITE_API_BASE_URL` - Base URL for API endpoints
- `VITE_APP_ENV` - Current environment (development/production)

#### Development Commands

```bash
# Development mode (uses localhost:3000)
npm run dev

# Production mode (uses frevo.app)
npm run dev:prod

# Build for development
npm run build:dev

# Build for production
npm run build
```

#### Switching Environments

1. **For Development**: Use `npm run dev` or `npm run build:dev`
2. **For Production**: Use `npm run dev:prod` or `npm run build`

The extension will automatically use the correct API endpoints based on the environment.

### Project Structure

```
zero-rating-filter/
├── src/                     # React source code
│   ├── App.tsx             # Extension popup (React)
│   ├── main.tsx            # React entry point
│   ├── index.css           # Global styles
│   ├── vite-env.d.ts       # Vite type definitions
│   └── components/         # React components
│       ├── Header.tsx      # Extension header
│       ├── StatusCard.tsx  # Toggle status card
│       ├── OpenAIKeyInput.tsx # API key input
│       ├── OpenAIModal.tsx # API key modal
│       ├── InfoSection.tsx # Information section
│       ├── Footer.tsx      # Extension footer
│       └── Icons.tsx       # Icon components
├── public/                 # Static assets
│   ├── extension/         # Extension files
│   │   ├── manifest.json  # Extension manifest
│   │   ├── content.js     # Content script
│   │   ├── background.js  # Background service worker
│   │   ├── inject.js      # Injected script for pagination
│   │   └── assets/        # Extension assets
│   │       ├── content.js # Additional content script
│   │       └── style.css  # Styles for injected components
│   └── vite.svg           # Vite logo
├── dist/                  # Built extension files
├── package.json           # Dependencies and scripts
├── package-lock.json      # Locked dependencies
├── tsconfig.json          # TypeScript configuration
├── tsconfig.app.json      # App-specific TS config
├── tsconfig.node.json     # Node-specific TS config
├── vite.config.ts         # Vite build configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── eslint.config.js       # ESLint configuration
└── README.md              # This file
```

### Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build extension for production
- `npm run lint` - Run ESLint

### Adding New Features

1. **Popup UI**: Modify `src/App.tsx` and components in `src/components/` for popup functionality
2. **Content Script**: Modify `public/extension/content.js` for page-level functionality
3. **Background Script**: Modify `public/extension/background.js` for background tasks and request interception
4. **Injected Scripts**: Modify `public/extension/inject.js` for scripts injected into the page
5. **Manifest**: Update `public/extension/manifest.json` for permissions and configuration
6. **Build**: Run `npm run build` to generate updated extension files

### Key Files Explained

- **`src/App.tsx`**: Main popup interface with filter controls and AI settings
- **`public/extension/content.js`**: Content script that runs on Freelancer.com pages
- **`public/extension/background.js`**: Background service worker for request interception
- **`public/extension/inject.js`**: Script injected into pages for pagination control
- **`public/extension/manifest.json`**: Extension configuration and permissions

## API Integration

The extension integrates with OpenAI's API for AI-powered writing assistance:

- **Model**: GPT-4o (latest model)
- **Storage**: API keys are stored securely in Chrome sync storage
- **Security**: API keys are never logged or transmitted except to OpenAI's API
- **Testing**: Built-in API connectivity test

## Technical Architecture

### Request Interception System

The extension uses a multi-layered approach for request interception:

1. **Background Service Worker**: Handles API request interception using Chrome's webRequest API
2. **Content Script**: Manages UI interactions and communicates with background script
3. **Injected Script**: Runs in page context to modify pagination behavior
4. **Message Passing**: Secure communication between different extension contexts

### Storage Strategy

- **Chrome Sync Storage**: For user preferences (filter settings, API keys)
- **Chrome Local Storage**: For jobs per page setting and temporary data
- **Persistent Settings**: All user preferences are remembered across sessions

## Permissions

- `storage` - For saving user preferences and API keys
- `activeTab` - For accessing current tab content
- `scripting` - For injecting content scripts
- Host permissions for Freelancer.com domains (including subdomains)

## Browser Compatibility

- **Chrome**: Full support (tested on Chrome 120+)
- **Edge**: Full support (Chromium-based)
- **Firefox**: Limited support (may require manifest adjustments)
- **Safari**: Not supported (different extension API)

## Troubleshooting

### Common Issues

1. **Extension not loading**: Check that all files are in the correct locations
2. **Filter not working**: Ensure you're on a search page (`/search/projects`)
3. **AI button not appearing**: Refresh the page and check console for errors
4. **Pagination not updating**: Check that the jobs per page setting is saved correctly

### Debug Mode

Enable debug logging by opening the browser console and looking for messages starting with:

- `🎯` - Content script events
- `📄` - Pagination updates
- `⭐` - Star rating filter events
- `✨` - AI assistant events
- `🔧` - Technical operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
