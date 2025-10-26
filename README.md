# CodeVis - Code Understanding Extension

CodeVis is a VS Code extension that helps you understand your code structure and purpose at a glance. It provides visual highlighting, AI-powered explanations, and interactive code analysis.

## Features

- **Visual Code Highlighting**: Automatically highlights different code elements (functions, loops, conditionals, API calls, HTML elements, CSS rules) with color-coded backgrounds
- **AI-Powered Analysis**: Get intelligent explanations of your code using OpenAI's GPT models
- **Interactive Panel**: View code analysis in a dedicated side panel with file visualization
- **Multi-Language Support**: Works with JavaScript, TypeScript, HTML, and CSS files
- **Hover Analysis**: Hover over code elements to see detailed explanations
- **File Visualization Map**: See a visual representation of your entire file's structure

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- VS Code
- OpenAI API key (optional, for AI features)

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   cd /path/to/codevisualization
   npm install
   ```

2. **Compile the extension:**
   ```bash
   npm run compile
   ```

3. **Run the extension in development mode:**
   - Open this folder in VS Code
   - Press `F5` or go to Run > Start Debugging
   - This will open a new VS Code window with your extension loaded

### Configuration

1. **Set up OpenAI API key (optional):**
   - Open VS Code Settings (Cmd/Ctrl + ,)
   - Search for "CodeVis"
   - Enter your OpenAI API key in the "OpenAI API Key" field
   - This enables AI-powered code explanations

## Usage

### Basic Usage

1. **Open the CodeVis panel:**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "CodeVis: Open Panel" and select it
   - Or use the command palette to run "CodeVis: Show Legend"

2. **Enable hover analysis:**
   - In the CodeVis panel, toggle the "Enable Hover Analysis" switch
   - Now hover over code elements to see detailed analysis

3. **View file visualization:**
   - The panel automatically shows a visual map of your current file
   - Different colors represent different code element types

### Commands

- `CodeVis: Open Panel` - Opens the main CodeVis analysis panel
- `CodeVis: Toggle Hover Analysis` - Enables/disables hover-based code analysis
- `CodeVis: Show Legend` - Shows the code highlighting legend and file visualization

### Code Highlighting Legend

- 🟢 **Functions** - Function declarations, arrow functions, methods
- 🔴 **Loops** - for loops, while loops, do-while loops
- 🔵 **Conditionals** - if statements, else statements, ternary operators
- 🟡 **API Calls** - fetch, axios, HTTP requests
- 🟠 **HTML Elements** - div, span, button, input elements
- 🟣 **CSS Rules** - selectors, properties, media queries

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run compile
```

### Watching for Changes

```bash
npm run watch
```

## Extension Settings

This extension contributes the following settings:

* `codevis.openaiApiKey`: Your OpenAI API key for AI-powered code explanations

## Requirements

- VS Code ^1.74.0
- Node.js ^16.0.0

## Known Issues

- AI features require a valid OpenAI API key
- Large files (>200 lines) show truncated visualization for performance
- Some complex code patterns may not be detected accurately

## Release Notes

### 0.0.1

Initial release with basic code highlighting and AI-powered analysis features.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
