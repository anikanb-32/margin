"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const path = __importStar(require("path"));
const openai_1 = __importDefault(require("openai"));
// Global state
let codeVisPanel;
let isHoverEnabled = false;
// Define different highlight styles for different code types
const functionDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(100, 200, 100, 0.2)',
    overviewRulerColor: 'rgba(100, 200, 100, 0.6)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: true
});
const loopDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 100, 100, 0.2)',
    overviewRulerColor: 'rgba(200, 100, 100, 0.6)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: true
});
const conditionalDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(100, 100, 200, 0.2)',
    overviewRulerColor: 'rgba(100, 100, 200, 0.6)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: true
});
const apiCallDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(200, 200, 100, 0.2)',
    overviewRulerColor: 'rgba(200, 200, 100, 0.6)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: true
});
const htmlElementDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    overviewRulerColor: 'rgba(255, 165, 0, 0.6)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: true
});
const cssRuleDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    overviewRulerColor: 'rgba(138, 43, 226, 0.6)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: true
});
function analyzeCode(code, document) {
    const functionRanges = [];
    const loopRanges = [];
    const conditionalRanges = [];
    const apiCallRanges = [];
    const tryBlockRanges = [];
    const asyncRanges = [];
    const classRanges = [];
    const switchRanges = [];
    const htmlElementRanges = [];
    const cssRuleRanges = [];
    const languageId = document.languageId;
    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
        try {
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx']
            });
            (0, traverse_1.default)(ast, {
                FunctionDeclaration(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        functionRanges.push(range);
                    }
                },
                ArrowFunctionExpression(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        functionRanges.push(range);
                    }
                },
                ForStatement(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        loopRanges.push(range);
                    }
                },
                WhileStatement(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        loopRanges.push(range);
                    }
                },
                IfStatement(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        conditionalRanges.push(range);
                    }
                },
                TryStatement(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        tryBlockRanges.push(range);
                    }
                },
                ClassDeclaration(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        classRanges.push(range);
                    }
                },
                SwitchStatement(path) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                        switchRanges.push(range);
                    }
                },
                CallExpression(path) {
                    const node = path.node;
                    const callee = node.callee;
                    if (callee.type === 'Identifier' && ['fetch', 'axios', 'request', 'get', 'post'].includes(callee.name)) {
                        if (node.loc) {
                            const range = new vscode.Range(node.loc.start.line - 1, node.loc.start.column, node.loc.end.line - 1, node.loc.end.column);
                            apiCallRanges.push(range);
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Parse error:', error);
        }
    }
    else if (languageId === 'html') {
        // Parse HTML elements
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/<[^/!][^>]*>/)) {
                const range = new vscode.Range(i, 0, i, line.length);
                htmlElementRanges.push(range);
            }
        }
    }
    else if (languageId === 'css') {
        // Parse CSS rules
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^[^{}]+{/) || line.match(/^[^{}]+}/)) {
                const range = new vscode.Range(i, 0, i, line.length);
                cssRuleRanges.push(range);
            }
        }
    }
    return {
        functionRanges,
        loopRanges,
        conditionalRanges,
        apiCallRanges,
        tryBlockRanges,
        asyncRanges,
        classRanges,
        switchRanges,
        htmlElementRanges,
        cssRuleRanges
    };
}
function updateDecorations(editor) {
    if (!editor) {
        return;
    }
    const document = editor.document;
    const languageId = document.languageId;
    // Only apply decorations if the panel is open AND hover is enabled
    if (!codeVisPanel || !isHoverEnabled) {
        // Clear all decorations when panel is closed or hover is disabled
        editor.setDecorations(functionDecorationType, []);
        editor.setDecorations(loopDecorationType, []);
        editor.setDecorations(conditionalDecorationType, []);
        editor.setDecorations(apiCallDecorationType, []);
        editor.setDecorations(htmlElementDecorationType, []);
        editor.setDecorations(cssRuleDecorationType, []);
        return;
    }
    console.log('Updating decorations for file:', document.fileName, 'Language:', languageId, 'Hover enabled:', isHoverEnabled);
    const code = document.getText();
    const { functionRanges, loopRanges, conditionalRanges, apiCallRanges, htmlElementRanges, cssRuleRanges } = analyzeCode(code, document);
    // Apply decorations based on file type
    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
        editor.setDecorations(functionDecorationType, functionRanges);
        editor.setDecorations(loopDecorationType, loopRanges);
        editor.setDecorations(conditionalDecorationType, conditionalRanges);
        editor.setDecorations(apiCallDecorationType, apiCallRanges);
    }
    else if (languageId === 'html') {
        editor.setDecorations(htmlElementDecorationType, htmlElementRanges);
    }
    else if (languageId === 'css') {
        editor.setDecorations(cssRuleDecorationType, cssRuleRanges);
    }
    console.log('Decorations applied:', {
        functions: functionRanges.length,
        loops: loopRanges.length,
        conditionals: conditionalRanges.length,
        apiCalls: apiCallRanges.length,
        htmlElements: htmlElementRanges.length,
        cssRules: cssRuleRanges.length
    });
}
// Function to analyze code context using OpenAI API
async function analyzeCodeWithAI(codeLine, surroundingContext, elementType) {
    // TODO: Implement OpenAI API call
    // For now, return mock data
    return {
        purpose: `This ${elementType} handles user interaction and updates the UI state accordingly.`,
        elementType: elementType,
        visualContext: 'This renders as a clickable button in the top navigation bar'
    };
}
function getElementType(position, document) {
    const languageId = document.languageId;
    const line = document.lineAt(position.line).text;
    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
        const code = document.getText();
        const { functionRanges, loopRanges, conditionalRanges, apiCallRanges, tryBlockRanges, classRanges, switchRanges } = analyzeCode(code, document);
        const isInRange = (range) => range.contains(position);
        if (functionRanges.some(isInRange))
            return 'Function';
        if (loopRanges.some(isInRange))
            return 'Loop';
        if (conditionalRanges.some(isInRange))
            return 'Conditional';
        if (switchRanges.some(isInRange))
            return 'Switch Statement';
        if (tryBlockRanges.some(isInRange))
            return 'Try/Catch Block';
        if (classRanges.some(isInRange))
            return 'Class';
        if (apiCallRanges.some(isInRange))
            return 'API Call';
        // Check for HTML/JSX elements
        const divMatch = line.match(/<(\w+)/);
        if (divMatch)
            return divMatch[1].toUpperCase() + ' Element';
        return 'Code Block';
    }
    else if (languageId === 'html') {
        const elementMatch = line.match(/<(\w+)/);
        if (elementMatch)
            return elementMatch[1].toUpperCase() + ' Element';
        return 'HTML Content';
    }
    else if (languageId === 'css') {
        if (line.includes('{'))
            return 'CSS Rule';
        if (line.includes('}'))
            return 'CSS Rule End';
        return 'CSS Property';
    }
    return 'Code Block';
}
// AI-powered hover provider
let openaiClient = null;
const explanationCache = new Map();
// Function to get or create OpenAI client
function getOpenAIClient() {
    if (openaiClient) {
        return openaiClient;
    }
    const config = vscode.workspace.getConfiguration('codevis');
    let apiKey = config.get('openaiApiKey');
    if (!apiKey) {
        return null;
    }
    openaiClient = new openai_1.default({
        apiKey: apiKey
    });
    return openaiClient;
}
// Function to find related files (imports, exports)
async function getRelatedFiles(document) {
    const text = document.getText();
    const importRegex = /import.*from\s+['"](.+)['"]/g;
    const relatedContent = [];
    let match;
    while ((match = importRegex.exec(text)) !== null) {
        const importPath = match[1];
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
            if (workspaceFolder) {
                let resolvedPath = importPath;
                if (importPath.startsWith('./') || importPath.startsWith('../')) {
                    const currentDir = document.uri.fsPath.split('/').slice(0, -1).join('/');
                    resolvedPath = `${currentDir}/${importPath}`;
                }
                const possiblePaths = [
                    resolvedPath + '.js',
                    resolvedPath + '.ts',
                    resolvedPath + '.jsx',
                    resolvedPath + '.tsx',
                    resolvedPath + '/index.js',
                    resolvedPath + '/index.ts'
                ];
                for (const path of possiblePaths) {
                    try {
                        const uri = vscode.Uri.file(path);
                        const doc = await vscode.workspace.openTextDocument(uri);
                        const content = doc.getText();
                        relatedContent.push(`\n--- Related file: ${importPath} ---\n${content.substring(0, 800)}\n`);
                        break;
                    }
                    catch {
                        continue;
                    }
                }
            }
        }
        catch (error) {
            // Skip if we can't resolve
        }
    }
    return relatedContent.join('\n');
}
// Enhanced function to get AI explanation with project context
async function getAIExplanationWithContext(code, codeType, document, fullFileContent) {
    const cacheKey = `${codeType}:${code}`;
    if (explanationCache.has(cacheKey)) {
        return explanationCache.get(cacheKey);
    }
    const client = getOpenAIClient();
    if (!client) {
        return `**${codeType}**\n\nAI explanation unavailable. Please configure your OpenAI API key in settings.`;
    }
    try {
        const relatedFiles = await getRelatedFiles(document);
        let contextMessage = `Here is the current file:\n\n${fullFileContent}\n\n`;
        if (relatedFiles) {
            contextMessage += `Here are related files that are imported:\n${relatedFiles}\n\n`;
        }
        contextMessage += `Now, explain what this specific ${codeType} does:\n\n${code}`;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful code explanation assistant. You have access to the full project context. Explain code snippets concisely in 2-4 sentences, considering how they fit into the larger project. Focus on what the code does, why it exists in this context, and how it relates to other parts of the codebase."
                },
                {
                    role: "user",
                    content: contextMessage
                }
            ],
            max_tokens: 200,
            temperature: 0.3
        });
        const explanation = response.choices[0]?.message?.content || 'No explanation available.';
        explanationCache.set(cacheKey, explanation);
        return explanation;
    }
    catch (error) {
        console.error('OpenAI API error:', error);
        return `**${codeType}**\n\nError getting AI explanation. Please check your API key and try again.`;
    }
}
function activate(context) {
    console.log('CodeVis extension is now active!');
    vscode.window.showInformationMessage('CodeVis is now active!');
    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations(activeEditor);
    }
    // Update decorations on editor change
    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            updateDecorations(editor);
            // Update the file visualization in the panel when editor changes
            if (codeVisPanel) {
                codeVisPanel.webview.html = getWebviewContent(context, editor);
            }
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            updateDecorations(activeEditor);
            // Update the file visualization when document content changes
            if (codeVisPanel) {
                codeVisPanel.webview.html = getWebviewContent(context, activeEditor);
            }
        }
    }, null, context.subscriptions);
    // Register command to open the CodeVis panel
    const openPanelCommand = vscode.commands.registerCommand('codevis.openPanel', () => {
        createCodeVisPanel(context);
    });
    // Register command to toggle hover functionality
    const toggleHoverCommand = vscode.commands.registerCommand('codevis.toggleHover', () => {
        isHoverEnabled = !isHoverEnabled;
        if (codeVisPanel) {
            codeVisPanel.webview.postMessage({
                type: 'hoverToggled',
                enabled: isHoverEnabled
            });
        }
        // Update decorations when toggle state changes
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
        vscode.window.showInformationMessage(`CodeVis hover analysis ${isHoverEnabled ? 'enabled' : 'disabled'}`);
    });
    // Around line 360-377, you have your existing hover provider
    // After that hover provider ends at line 377, ADD THIS NEW CODE:
    // Register AI-powered hover provider that sends to panel
    const aiHoverProvider = vscode.languages.registerHoverProvider(['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], {
        async provideHover(document, position, token) {
            // Only proceed if hover is enabled
            if (!isHoverEnabled) {
                return null;
            }
            const code = document.getText();
            const { functionRanges, loopRanges, conditionalRanges, apiCallRanges } = analyzeCode(code, document);
            const isInRange = (range) => {
                return range.contains(position);
            };
            const getCodeFromRange = (range) => {
                return document.getText(range);
            };
            let hoveredRange = null;
            let codeType = '';
            let emoji = '';
            if (functionRanges.some(isInRange)) {
                hoveredRange = functionRanges.find(isInRange) || null;
                codeType = 'Function';
                emoji = '🟢';
            }
            else if (loopRanges.some(isInRange)) {
                hoveredRange = loopRanges.find(isInRange) || null;
                codeType = 'Loop';
                emoji = '🔴';
            }
            else if (conditionalRanges.some(isInRange)) {
                hoveredRange = conditionalRanges.find(isInRange) || null;
                codeType = 'Conditional';
                emoji = '🔵';
            }
            else if (apiCallRanges.some(isInRange)) {
                hoveredRange = apiCallRanges.find(isInRange) || null;
                codeType = 'API Call';
                emoji = '🟡';
            }
            if (hoveredRange && codeVisPanel) {
                const codeSnippet = getCodeFromRange(hoveredRange);
                const fullFileContent = document.getText();
                const lineNumber = position.line + 1;
                // Send loading message to panel
                codeVisPanel.webview.postMessage({
                    type: 'codeAnalysis',
                    analysis: {
                        codeLine: codeSnippet.substring(0, 100) + (codeSnippet.length > 100 ? '...' : ''),
                        elementType: `${emoji} ${codeType}`,
                        purpose: '⏳ Loading AI explanation...',
                        visualContext: 'Analyzing code structure and context...',
                        lineNumber: lineNumber
                    }
                });
                // Get AI explanation asynchronously
                getAIExplanationWithContext(codeSnippet, codeType, document, fullFileContent).then(explanation => {
                    // Send the actual explanation to panel
                    if (codeVisPanel) {
                        codeVisPanel.webview.postMessage({
                            type: 'codeAnalysis',
                            analysis: {
                                codeLine: codeSnippet.substring(0, 100) + (codeSnippet.length > 100 ? '...' : ''),
                                elementType: `${emoji} ${codeType}`,
                                purpose: explanation,
                                visualContext: `Found in ${document.fileName.split('/').pop()} at line ${lineNumber}`,
                                lineNumber: lineNumber
                            }
                        });
                    }
                });
            }
            // Return null so no hover tooltip appears
            return null;
        }
    });
    context.subscriptions.push(aiHoverProvider);
    // Continue with the rest of your activate function...
    // Register hover provider for ALL file types
    const hoverProvider = vscode.languages.registerHoverProvider(['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html', 'css'], {
        provideHover(document, position, token) {
            console.log('Hover triggered at line:', position.line, 'Language:', document.languageId);
            const line = document.lineAt(position.line);
            const codeLine = line.text.trim();
            const elementType = getElementType(position, document);
            // Get surrounding context (5 lines before and after)
            const startLine = Math.max(0, position.line - 5);
            const endLine = Math.min(document.lineCount - 1, position.line + 5);
            const contextRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
            const surroundingContext = document.getText(contextRange);
            // Always send analysis to panel if it's open
            if (codeVisPanel) {
                // Get AI analysis (placeholder for now)
                const analysis = analyzeCodeWithAI(codeLine, surroundingContext, elementType);
                codeVisPanel.webview.postMessage({
                    type: 'codeAnalysis',
                    analysis: {
                        codeLine: codeLine,
                        purpose: `This ${elementType.toLowerCase()} handles specific functionality in the code.`,
                        elementType: elementType,
                        visualContext: 'This code element contributes to the overall application structure.',
                        lineNumber: position.line + 1
                    }
                });
            }
            // Create inline hover content with color coding
            const code = document.getText();
            const { functionRanges, loopRanges, conditionalRanges, apiCallRanges, htmlElementRanges, cssRuleRanges } = analyzeCode(code, document);
            const isInRange = (range) => range.contains(position);
            let hoverText = '';
            if (functionRanges.some(isInRange)) {
                hoverText = '**Function** <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/></svg>\n\nThis is a function that encapsulates reusable code logic.';
            }
            else if (loopRanges.some(isInRange)) {
                hoverText = '**Loop** <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>\n\nThis loop repeatedly executes code.';
            }
            else if (conditionalRanges.some(isInRange)) {
                hoverText = '**Conditional Statement** <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H9m0-7V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>\n\nThis checks a condition and executes different code based on the result.';
            }
            else if (apiCallRanges.some(isInRange)) {
                hoverText = '**API Call** <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>\n\nThis makes a network request to fetch or send data.';
            }
            else if (htmlElementRanges.some(isInRange)) {
                hoverText = '**HTML Element** <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>\n\nThis is an HTML element that defines the structure of the webpage.';
            }
            else if (cssRuleRanges.some(isInRange)) {
                hoverText = '**CSS Rule** <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>\n\nThis CSS rule defines styling for HTML elements.';
            }
            else {
                // Show basic info for any line
                hoverText = `**Line ${position.line + 1}** <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/></svg>\n\n\`${codeLine}\`\n\nType: ${elementType}`;
            }
            return new vscode.Hover(hoverText);
        }
    });
    // Register command to show legend
    const showLegendCommand = vscode.commands.registerCommand('codevis.showLegend', () => {
        if (codeVisPanel) {
            // Update existing panel with current editor
            const editor = vscode.window.activeTextEditor;
            codeVisPanel.webview.html = getWebviewContent(context, editor);
        }
        else {
            createCodeVisPanel(context);
        }
    });
    context.subscriptions.push(openPanelCommand, toggleHoverCommand, hoverProvider, showLegendCommand);
}
exports.activate = activate;
function createCodeVisPanel(context) {
    if (codeVisPanel) {
        codeVisPanel.reveal(vscode.ViewColumn.Beside);
        return;
    }
    const editor = vscode.window.activeTextEditor;
    // Create and show a new webview panel
    codeVisPanel = vscode.window.createWebviewPanel('codeVis', 'CodeVis', vscode.ViewColumn.Beside, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
    });
    // Set the webview's initial html content
    codeVisPanel.webview.html = getWebviewContent(context, editor);
    // Handle messages from the webview
    codeVisPanel.webview.onDidReceiveMessage(message => {
        switch (message.type) {
            case 'toggleHover':
                isHoverEnabled = message.enabled;
                // Update decorations when toggle state changes
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    updateDecorations(editor);
                }
                vscode.window.showInformationMessage(`Code hover ${isHoverEnabled ? 'enabled' : 'disabled'}`);
                break;
        }
    }, undefined, context.subscriptions);
    // Clean up when the panel is closed
    codeVisPanel.onDidDispose(() => {
        codeVisPanel = undefined;
        // Clear decorations when panel is closed
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.setDecorations(functionDecorationType, []);
            editor.setDecorations(loopDecorationType, []);
            editor.setDecorations(conditionalDecorationType, []);
            editor.setDecorations(apiCallDecorationType, []);
            editor.setDecorations(htmlElementDecorationType, []);
            editor.setDecorations(cssRuleDecorationType, []);
        }
    }, null, context.subscriptions);
}
function getWebviewContent(context, editor) {
    let fileVisualization = '';
    // Check if we have a valid editor
    const hasValidFile = editor && editor.document && ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html', 'css'].includes(editor.document.languageId);
    if (hasValidFile && editor) {
        const document = editor.document;
        const code = document.getText();
        const totalLines = document.lineCount;
        const languageId = document.languageId;
        // Analyze the code to get all ranges
        const { functionRanges, loopRanges, conditionalRanges, apiCallRanges, htmlElementRanges, cssRuleRanges } = analyzeCode(code, document);
        // Create a map of line numbers to their types
        const lineTypes = {};
        // Helper to mark lines
        const markLines = (ranges, type) => {
            ranges.forEach(range => {
                for (let i = range.start.line; i <= range.end.line; i++) {
                    if (!lineTypes[i]) {
                        lineTypes[i] = [];
                    }
                    lineTypes[i].push(type);
                }
            });
        };
        if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
            markLines(functionRanges, 'function');
            markLines(loopRanges, 'loop');
            markLines(conditionalRanges, 'conditional');
            markLines(apiCallRanges, 'api');
        }
        else if (languageId === 'html') {
            markLines(htmlElementRanges, 'html');
        }
        else if (languageId === 'css') {
            markLines(cssRuleRanges, 'css');
        }
        // Generate visualization bars
        fileVisualization = '<div class="file-viz-container">';
        const fileName = document.fileName.split('/').pop() || 'Unknown';
        fileVisualization += `<div style="margin-bottom: 10px; font-weight: bold;">📄 ${fileName}</div>`;
        fileVisualization += `<div style="margin-bottom: 10px; font-size: 12px; color: var(--vscode-descriptionForeground);">Total Lines: ${totalLines} • ${languageId.toUpperCase()}</div>`;
        // Limit visualization to first 200 lines for performance
        const maxLines = Math.min(totalLines, 200);
        for (let i = 0; i < maxLines; i++) {
            const types = lineTypes[i] || [];
            let colorClass = 'empty';
            // Priority: function > loop > conditional > api > html > css
            if (types.includes('function')) {
                colorClass = 'function-color';
            }
            else if (types.includes('loop')) {
                colorClass = 'loop-color';
            }
            else if (types.includes('conditional')) {
                colorClass = 'conditional-color';
            }
            else if (types.includes('api')) {
                colorClass = 'api-color';
            }
            else if (types.includes('html')) {
                colorClass = 'html-color';
            }
            else if (types.includes('css')) {
                colorClass = 'css-color';
            }
            fileVisualization += `<div class="line-bar ${colorClass}" title="Line ${i + 1}${types.length > 0 ? ': ' + types.join(', ') : ''}"></div>`;
        }
        if (totalLines > 200) {
            fileVisualization += `<div style="text-align: center; padding: 10px; color: var(--vscode-descriptionForeground); font-size: 12px;">... and ${totalLines - 200} more lines</div>`;
        }
        // Add summary of found elements
        const summary = [];
        if (functionRanges.length > 0)
            summary.push(`${functionRanges.length} functions`);
        if (loopRanges.length > 0)
            summary.push(`${loopRanges.length} loops`);
        if (conditionalRanges.length > 0)
            summary.push(`${conditionalRanges.length} conditionals`);
        if (apiCallRanges.length > 0)
            summary.push(`${apiCallRanges.length} API calls`);
        if (htmlElementRanges.length > 0)
            summary.push(`${htmlElementRanges.length} HTML elements`);
        if (cssRuleRanges.length > 0)
            summary.push(`${cssRuleRanges.length} CSS rules`);
        if (summary.length > 0) {
            fileVisualization += `<div style="margin-top: 10px; padding: 8px; background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">Found: ${summary.join(', ')}</div>`;
        }
        fileVisualization += '</div>';
    }
    else {
        fileVisualization = '<div class="no-file">Open a JavaScript/TypeScript/HTML/CSS file to see visualization</div>';
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeVis</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
            line-height: 1.5;
        }
        .header {
            margin-bottom: 24px;
        }
        .header h2 {
            color: var(--vscode-foreground);
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
        }
        .header p {
            color: var(--vscode-descriptionForeground);
            margin: 0;
            font-size: 13px;
        }
        .toggle-container {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            padding: 16px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }
        .toggle {
            position: relative;
            width: 48px;
            height: 24px;
            background: rgba(128, 128, 128, 0.3);
            cursor: pointer;
            margin-right: 12px;
            transition: background-color 0.2s ease;
            border-radius: 12px;
        }
        .toggle.active {
            background: rgba(100, 200, 100, 0.6);
        }
        .toggle-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            transition: transform 0.2s ease;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .toggle.active .toggle-slider {
            transform: translateX(24px);
        }
        .toggle-container label {
            color: var(--vscode-foreground);
            font-weight: 500;
            font-size: 14px;
        }
        .analysis-area {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 20px;
            min-height: 200px;
            margin-bottom: 24px;
        }
        .placeholder {
            color: var(--vscode-descriptionForeground);
            text-align: center;
            padding: 40px 20px;
            font-size: 14px;
            font-style: italic;
        }
        .analysis-content h3 {
            color: var(--vscode-foreground);
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 16px;
            font-weight: 600;
        }
        .analysis-section {
            margin-bottom: 16px;
        }
        .analysis-label {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 6px;
        }
        .analysis-value {
            color: var(--vscode-foreground);
            font-size: 14px;
            line-height: 1.6;
        }
        .code-line {
            background: var(--vscode-textCodeBlock-background);
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 13px;
            color: var(--vscode-textPreformat-foreground);
            overflow-x: auto;
        }
        .element-type-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(100, 200, 100, 0.3);
            color: var(--vscode-foreground);
        }
        /* Legend Section */
        .legend-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        .legend-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            color: var(--vscode-foreground);
        }
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 6px;
            padding: 6px 10px;
            border-radius: 5px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }
        .color-box {
            width: 40px;
            height: 40px;
            margin-right: 12px;
            border-radius: 4px;
            border: 2px solid;
            flex-shrink: 0;
        }
        .function-color {
            background-color: rgba(100, 200, 100, 0.2);
            border-color: rgba(100, 200, 100, 0.2);
        }
        .loop-color {
            background-color: rgba(200, 100, 100, 0.2);
            border-color: rgba(200, 100, 100, 0.2);
        }
        .conditional-color {
            background-color: rgba(100, 100, 200, 0.2);
            border-color: rgba(100, 100, 200, 0.2);
        }
        .api-color {
            background-color: rgba(200, 200, 100, 0.2);
            border-color: rgba(200, 200, 100, 0.2);
        }
        .html-color {
            background-color: rgba(255, 165, 0, 0.2);
            border-color: rgba(255, 165, 0, 0.2);
        }
        .css-color {
            background-color: rgba(138, 43, 226, 0.2);
            border-color: rgba(138, 43, 226, 0.2);
        }
        .legend-description {
            flex: 1;
        }
        .legend-description .title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 3px;
            color: var(--vscode-foreground);
        }
        .legend-description .examples {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        /* File Visualization */
        .file-viz-section {
            margin-top: 24px;
        }
        .file-viz-container {
            background-color: var(--vscode-editor-background);
            border: 2px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 1px;
            max-height: 300px;
            overflow-y: auto;
        }
        .line-bar {
            height: 3px;
            border-radius: 2px;
            transition: height 0.2s;
        }
        .line-bar:hover {
            height: 6px;
        }
        .line-bar.empty {
            background-color: rgba(128, 128, 128, 0.2);
        }
        .no-file {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        svg {
            color: var(--vscode-foreground);
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>CodeVis</h2>
        <p>Understand your code structure and purpose at a glance</p>
    </div>
    
    <div class="toggle-container">
        <div class="toggle" id="hoverToggle">
            <div class="toggle-slider"></div>
        </div>
        <label for="hoverToggle">Enable Hover Analysis</label>
    </div>
    
    <div class="analysis-area" id="analysisArea">
        <div class="placeholder">
            Enable hover and move your cursor over code to see detailed analysis here...
        </div>
    </div>
    
    <div class="legend-section">
        <div class="legend-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/></svg>Code Highlighting Legend</div>
        <div class="legend-item">
            <div class="color-box function-color"></div>
            <div class="legend-description">
                <div class="title">Functions</div>
                <div class="examples">function declarations, arrow functions, methods</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box loop-color"></div>
            <div class="legend-description">
                <div class="title">Loops</div>
                <div class="examples">for loops, while loops, do-while loops</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box conditional-color"></div>
            <div class="legend-description">
                <div class="title">Conditionals</div>
                <div class="examples">if statements, else statements, ternary operators</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box api-color"></div>
            <div class="legend-description">
                <div class="title">API Calls</div>
                <div class="examples">fetch, axios, HTTP requests</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box html-color"></div>
            <div class="legend-description">
                <div class="title">HTML Elements</div>
                <div class="examples">div, span, button, input elements</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box css-color"></div>
            <div class="legend-description">
                <div class="title">CSS Rules</div>
                <div class="examples">selectors, properties, media queries</div>
            </div>
        </div>
    </div>
    
    <div class="file-viz-section">
        <div class="legend-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>File Visualization Map</div>
        ${fileVisualization}
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        const toggle = document.getElementById('hoverToggle');
        const analysisArea = document.getElementById('analysisArea');
        let isEnabled = false;

        toggle.addEventListener('click', () => {
            isEnabled = !isEnabled;
            toggle.classList.toggle('active', isEnabled);
            
            // Send message to extension
            vscode.postMessage({
                type: 'toggleHover',
                enabled: isEnabled
            });
        });

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'hoverToggled':
                    isEnabled = message.enabled;
                    toggle.classList.toggle('active', isEnabled);
                    break;
                case 'codeAnalysis':
                    displayAnalysis(message.analysis);
                    break;
            }
        });


    
function displayAnalysis(analysis) {
    const isLoading = analysis.purpose && analysis.purpose.includes('⏳');
    
    analysisArea.innerHTML = \`
        <div class="analysis-content">
            <h3>🤖 AI Code Analysis</h3>
            <div class="analysis-section">
                <div class="analysis-label">Element Type</div>
                <div class="analysis-value">
                    <span class="element-type-badge">\${analysis.elementType || 'Unknown'}</span>
                </div>
            </div>
            <div class="analysis-section">
                <div class="analysis-label">Code Snippet</div>
                <div class="code-line">\${analysis.codeLine || 'N/A'}</div>
            </div>
            <div class="analysis-section">
                <div class="analysis-label">\${isLoading ? '⏳ AI Explanation' : '💡 AI Explanation'}</div>
                <div class="analysis-value" style="line-height: 1.6; white-space: pre-wrap;">\${analysis.purpose || 'N/A'}</div>
            </div>
            <div class="analysis-section">
                <div class="analysis-label">📍 Location</div>
                <div class="analysis-value">\${analysis.visualContext || 'N/A'}</div>
            </div>
            <div class="analysis-section">
                <div class="analysis-label">Line Number</div>
                <div class="analysis-value">\${analysis.lineNumber || 'N/A'}</div>
            </div>
        </div>
    \`;
}
    </script>
</body>
</html>`;
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map