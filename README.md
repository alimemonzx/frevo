# Frevo - Freelancer.com Enhancement Extension

A Chrome extension that enhances your Freelancer.com experience by filtering out zero-rated projects and providing AI-powered writing assistance.

## Features

### 🎯 Zero Rating Filter

- Automatically hides projects with 0 ratings
- Helps you focus on quality opportunities
- Toggle on/off from the extension popup

### ✨ AI Writing Assistant (Frevo)

- **Write with Frevo** button on project detail pages
- OpenAI integration for AI-powered content generation
- Secure API key storage in Chrome sync storage
- Test API connectivity directly from the extension

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

### Zero Rating Filter

1. Click the Frevo extension icon in your browser toolbar
2. Toggle the filter on/off using the switch
3. The filter will automatically hide zero-rated projects on Freelancer.com

### AI Writing Assistant

1. Navigate to any project detail page on Freelancer.com
2. Look for the **"Write with Frevo"** button next to the existing AI button
3. Click the button to open the AI settings modal
4. Enter your OpenAI API key (stored securely in Chrome sync storage)
5. Test the API connection with the "Test API Call" button
6. Once configured, you can use Frevo for AI-powered writing assistance

## Development

### Project Structure

```
├── src/
│   ├── App.tsx              # Extension popup (React)
│   ├── contentScript.tsx    # Content script (TypeScript)
│   └── components/          # React components
├── public/
│   └── extension/
│       └── manifest.json    # Extension manifest
├── dist/                    # Built extension files
└── package.json
```

### Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build extension for production
- `npm run lint` - Run ESLint

### Adding New Features

1. Modify `src/contentScript.tsx` for page-level functionality
2. Modify `src/App.tsx` for popup functionality
3. Update `public/extension/manifest.json` for permissions and configuration
4. Run `npm run build` to generate updated extension files

## API Integration

The extension integrates with OpenAI's API for AI-powered writing assistance:

- **Model**: GPT-3.5-turbo
- **Storage**: API keys are stored securely in Chrome sync storage
- **Security**: API keys are never logged or transmitted except to OpenAI's API
- **Testing**: Built-in API connectivity test

## Permissions

- `storage` - For saving user preferences and API keys
- `activeTab` - For accessing current tab content
- `scripting` - For injecting content scripts
- Host permissions for Freelancer.com domains

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
