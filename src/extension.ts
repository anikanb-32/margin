import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as path from 'path';
import OpenAI from 'openai';

// Global state
let marginPanel: vscode.WebviewPanel | undefined;
let isHoverEnabled = false;
let lastAnalyzedRange: vscode.Range | undefined;
let hoverTimeout: NodeJS.Timeout | undefined;

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

// White border highlight for currently analyzed code - THICKER AND MORE VISIBLE
const activeHoverDecorationType = vscode.window.createTextEditorDecorationType({
    border: '3px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '4px',
    isWholeLine: true,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'  // Slight white background too
});

function analyzeCode(code: string, document: vscode.TextDocument) {
    const functionRanges: vscode.Range[] = [];
    const loopRanges: vscode.Range[] = [];
    const conditionalRanges: vscode.Range[] = [];
    const apiCallRanges: vscode.Range[] = [];
    const tryBlockRanges: vscode.Range[] = [];
    const asyncRanges: vscode.Range[] = [];
    const classRanges: vscode.Range[] = [];
    const switchRanges: vscode.Range[] = [];
    const htmlElementRanges: vscode.Range[] = [];
    const cssRuleRanges: vscode.Range[] = [];

    const languageId = document.languageId;

    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
        try {
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx']
            });

            traverse(ast, {
                FunctionDeclaration(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        functionRanges.push(range);
                    }
                },
                ArrowFunctionExpression(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        functionRanges.push(range);
                    }
                },
                ForStatement(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        loopRanges.push(range);
                    }
                },
                WhileStatement(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        loopRanges.push(range);
                    }
                },
                IfStatement(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        conditionalRanges.push(range);
                    }
                },
                TryStatement(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        tryBlockRanges.push(range);
                    }
                },
                ClassDeclaration(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        classRanges.push(range);
                    }
                },
                SwitchStatement(path: any) {
                    const node = path.node;
                    if (node.loc) {
                        const range = new vscode.Range(
                            node.loc.start.line - 1,
                            node.loc.start.column,
                            node.loc.end.line - 1,
                            node.loc.end.column
                        );
                        switchRanges.push(range);
                    }
                },
                CallExpression(path: any) {
                    const node = path.node;
                    const callee = node.callee;
                    if (callee.type === 'Identifier' && ['fetch', 'axios', 'request', 'get', 'post'].includes(callee.name)) {
                        if (node.loc) {
                            const range = new vscode.Range(
                                node.loc.start.line - 1,
                                node.loc.start.column,
                                node.loc.end.line - 1,
                                node.loc.end.column
                            );
                            apiCallRanges.push(range);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Parse error:', error);
        }
    } else if (languageId === 'html') {
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/<[^/!][^>]*>/)) {
                const range = new vscode.Range(i, 0, i, line.length);
                htmlElementRanges.push(range);
            }
        }
    } else if (languageId === 'css') {
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

function updateDecorations(editor: vscode.TextEditor) {
    if (!editor) {
        return;
    }

    // Only show decorations when hover analysis is enabled
    if (!isHoverEnabled) {
        // Clear all decorations when disabled
        editor.setDecorations(functionDecorationType, []);
        editor.setDecorations(loopDecorationType, []);
        editor.setDecorations(conditionalDecorationType, []);
        editor.setDecorations(apiCallDecorationType, []);
        editor.setDecorations(htmlElementDecorationType, []);
        editor.setDecorations(cssRuleDecorationType, []);
        editor.setDecorations(activeHoverDecorationType, []);
        return;
    }

    const document = editor.document;
    const code = document.getText();
    const languageId = document.languageId;

    const {
        functionRanges,
        loopRanges,
        conditionalRanges,
        apiCallRanges,
        htmlElementRanges,
        cssRuleRanges
    } = analyzeCode(code, document);

    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
        editor.setDecorations(functionDecorationType, functionRanges);
        editor.setDecorations(loopDecorationType, loopRanges);
        editor.setDecorations(conditionalDecorationType, conditionalRanges);
        editor.setDecorations(apiCallDecorationType, apiCallRanges);
    } else if (languageId === 'html') {
        editor.setDecorations(htmlElementDecorationType, htmlElementRanges);
    } else if (languageId === 'css') {
        editor.setDecorations(cssRuleDecorationType, cssRuleRanges);
    }
    
    // Apply white border to last analyzed range if it exists
    if (lastAnalyzedRange) {
        editor.setDecorations(activeHoverDecorationType, [lastAnalyzedRange]);
    }
}

// OpenAI client and cache
let openaiClient: OpenAI | null = null;
const explanationCache = new Map<string, string>();

function getOpenAIClient(): OpenAI | null {
    if (openaiClient) {
        return openaiClient;
    }
    
    const config = vscode.workspace.getConfiguration('margin');
    let apiKey = config.get<string>('openaiApiKey');
    
    if (!apiKey) {
        return null;
    }
    
    openaiClient = new OpenAI({
        apiKey: apiKey
    });
    
    return openaiClient;
}

async function getRelatedFiles(document: vscode.TextDocument): Promise<string> {
    const text = document.getText();
    const importRegex = /import.*from\s+['"](.+)['"]/g;
    const relatedContent: string[] = [];
    
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
                    } catch {
                        continue;
                    }
                }
            }
        } catch (error) {
            // Skip if we can't resolve
        }
    }
    
    return relatedContent.join('\n');
}

async function getAIExplanationWithContext(
    code: string, 
    codeType: string, 
    document: vscode.TextDocument,
    fullFileContent: string
): Promise<string> {
    const cacheKey = `${codeType}:${code}`;
    
    if (explanationCache.has(cacheKey)) {
        return explanationCache.get(cacheKey)!;
    }
    
    const client = getOpenAIClient();
    
    if (!client) {
        return `AI explanation unavailable. Please configure your OpenAI API key in VS Code settings (search for "Margin: OpenAI API Key").`;
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
                    content: "You are a helpful code explanation assistant for designers who are learning to code. Explain code snippets in 1-2 short sentences. Focus on what the code does and why it's important. Use simple language. CRITICAL: Do NOT use phrases like 'The `element` element', 'This element', 'The element', or any variation that references the element name. Instead, directly explain what the code does without mentioning element names. Start your explanation with action words like 'This displays', 'This creates', 'This handles', 'This manages', etc. If the code snippet appears to be empty or contains only whitespace, respond with 'No meaningful code detected at this location.'"
                },
                {
                    role: "user",
                    content: contextMessage
                }
            ],
            max_tokens: 100,
            temperature: 0.3
        });
        
        let explanation = response.choices[0]?.message?.content || 'No explanation available.';
        
        // Clean up any remaining element references
        explanation = explanation.replace(/^The\s+`[^`]+`\s+element\s+/i, '');
        explanation = explanation.replace(/^This\s+element\s+/i, 'This ');
        explanation = explanation.replace(/^The\s+element\s+/i, '');
        
        explanationCache.set(cacheKey, explanation);
        
        return explanation;
    } catch (error: any) {
        console.error('OpenAI API error:', error);
        if (error?.status === 401) {
            return `Invalid API key. Please check your OpenAI API key in VS Code settings.`;
        }
        return `Error getting AI explanation: ${error?.message || 'Unknown error'}`;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Margin extension is now active!');
    vscode.window.showInformationMessage('Margin is now active!');

    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations(activeEditor);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            updateDecorations(editor);
            if (marginPanel) {
                marginPanel.webview.html = getWebviewContent(context, editor);
            }
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            updateDecorations(activeEditor);
            if (marginPanel) {
                marginPanel.webview.html = getWebviewContent(context, activeEditor);
            }
        }
    }, null, context.subscriptions);

    const openPanelCommand = vscode.commands.registerCommand('margin.openPanel', () => {
        createMarginPanel(context);
    });

    const toggleHoverCommand = vscode.commands.registerCommand('margin.toggleHover', () => {
        isHoverEnabled = !isHoverEnabled;
        if (marginPanel) {
            marginPanel.webview.postMessage({
                type: 'hoverToggled',
                enabled: isHoverEnabled
            });
        }
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
        vscode.window.showInformationMessage(`Margin hover analysis ${isHoverEnabled ? 'enabled' : 'disabled'}`);
    });

    // Single AI-powered hover provider
    const aiHoverProvider = vscode.languages.registerHoverProvider(
        ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html', 'css'],
        {
            async provideHover(document, position, token) {
                if (!isHoverEnabled || !marginPanel) {
                    return null;
                }

                const code = document.getText();
                const languageId = document.languageId;
                const { functionRanges, loopRanges, conditionalRanges, apiCallRanges, htmlElementRanges, cssRuleRanges } = analyzeCode(code, document);
                
                const isInRange = (range: vscode.Range) => range.contains(position);
                
                let hoveredRange: vscode.Range | null = null;
                let codeType = '';
                
                // Collect all ranges that contain the hover position
                const containingRanges: { range: vscode.Range; type: string }[] = [];
                
                if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
                    functionRanges.forEach(range => {
                        if (range.contains(position)) containingRanges.push({ range, type: 'Function' });
                    });
                    loopRanges.forEach(range => {
                        if (range.contains(position)) containingRanges.push({ range, type: 'Loop' });
                    });
                    conditionalRanges.forEach(range => {
                        if (range.contains(position)) containingRanges.push({ range, type: 'Conditional' });
                    });
                    apiCallRanges.forEach(range => {
                        if (range.contains(position)) containingRanges.push({ range, type: 'API Call' });
                    });
                } else if (languageId === 'html') {
                    htmlElementRanges.forEach(range => {
                        if (range.contains(position)) containingRanges.push({ range, type: 'HTML Element' });
                    });
                } else if (languageId === 'css') {
                    cssRuleRanges.forEach(range => {
                        if (range.contains(position)) containingRanges.push({ range, type: 'CSS Rule' });
                    });
                }
                
                if (containingRanges.length > 0) {
                    // Find the largest range (most lines and characters)
                    const largestRange = containingRanges.reduce((largest, current) => {
                        const currentSize = (current.range.end.line - current.range.start.line) * 1000 + 
                                          (current.range.end.character - current.range.start.character);
                        const largestSize = (largest.range.end.line - largest.range.start.line) * 1000 + 
                                           (largest.range.end.character - largest.range.start.character);
                        return currentSize > largestSize ? current : largest;
                    });
                    
                    hoveredRange = largestRange.range;
                    codeType = largestRange.type;
                } else {
                    // Fallback to current line for unsupported content
                    const line = document.lineAt(position.line);
                    const lineText = line.text.trim();
                    
                    if (languageId === 'html' && lineText && (lineText.includes('<') || lineText.includes('>'))) {
                        hoveredRange = line.range;
                        codeType = 'HTML Element';
                    } else if (languageId === 'css' && lineText && (lineText.includes(':') || lineText.includes('{') || lineText.includes('}'))) {
                        hoveredRange = line.range;
                        codeType = 'CSS Property';
                    } else if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
                        hoveredRange = line.range;
                        codeType = 'Code Block';
                    } else {
                        // Skip empty lines or unsupported content
                        return null;
                    }
                }
                
                if (hoveredRange && marginPanel) {
                    const codeSnippet = document.getText(hoveredRange).trim();
                    
                    // Skip analysis if code snippet is empty or just whitespace
                    if (!codeSnippet) {
                        return null;
                    }
                    
                     // Store the range and apply white border decoration
                     lastAnalyzedRange = hoveredRange;
                     const editor = vscode.window.activeTextEditor;
                     if (editor) {
                         editor.setDecorations(activeHoverDecorationType, [hoveredRange]);
                         
                         // Clear previous timeout
                         if (hoverTimeout) {
                             clearTimeout(hoverTimeout);
                         }
                         
                         // Set timeout to clear white border after 3 seconds
                         hoverTimeout = setTimeout(() => {
                             editor.setDecorations(activeHoverDecorationType, []);
                             lastAnalyzedRange = undefined;
                         }, 3000);
                     }
                    
                    const fullFileContent = document.getText();
                    const lineNumber = position.line + 1;
                    const fileName = document.fileName.split('/').pop() || 'Unknown';
                    
                    // Send immediate update to panel WITHOUT code snippet
                    marginPanel.webview.postMessage({
                        type: 'codeAnalysis',
                        analysis: {
                            elementType: codeType,
                            purpose: 'Loading AI explanation...',
                            visualContext: `Found in ${fileName} at line ${lineNumber}`,
                            lineNumber: lineNumber,
                            isLoading: true
                        }
                    });
                    
                    // Get AI explanation asynchronously
                    getAIExplanationWithContext(
                        codeSnippet, 
                        codeType, 
                        document,
                        fullFileContent
                    ).then(explanation => {
                        if (marginPanel) {
                            marginPanel.webview.postMessage({
                                type: 'codeAnalysis',
                                analysis: {
                                    elementType: codeType,
                                    purpose: explanation,
                                    visualContext: `Found in ${fileName} at line ${lineNumber}`,
                                    lineNumber: lineNumber,
                                    isLoading: false
                                }
                            });
                        }
                    }).catch(error => {
                        console.error('Error getting AI explanation:', error);
                        if (marginPanel) {
                            marginPanel.webview.postMessage({
                                type: 'codeAnalysis',
                                analysis: {
                                    elementType: codeType,
                                    purpose: 'Error getting AI explanation. Please check your API key.',
                                    visualContext: `Found in ${fileName} at line ${lineNumber}`,
                                    lineNumber: lineNumber,
                                    isLoading: false
                                }
                            });
                        }
                    });
                }
                
                return null;
            }
        }
    );

    const showLegendCommand = vscode.commands.registerCommand('margin.showLegend', () => {
        if (marginPanel) {
            const editor = vscode.window.activeTextEditor;
            marginPanel.webview.html = getWebviewContent(context, editor);
        } else {
            createMarginPanel(context);
        }
    });

    context.subscriptions.push(
        openPanelCommand,
        toggleHoverCommand,
        aiHoverProvider,
        showLegendCommand,
        functionDecorationType,
        loopDecorationType,
        conditionalDecorationType,
        apiCallDecorationType,
        htmlElementDecorationType,
        cssRuleDecorationType,
        activeHoverDecorationType
    );
}

function createMarginPanel(context: vscode.ExtensionContext) {
    if (marginPanel) {
        marginPanel.reveal(vscode.ViewColumn.Beside);
        return;
    }

    const editor = vscode.window.activeTextEditor;

    marginPanel = vscode.window.createWebviewPanel(
        'margin',
        'Margin',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
        }
    );

    marginPanel.webview.html = getWebviewContent(context, editor);

    marginPanel.webview.onDidReceiveMessage(
        message => {
            switch (message.type) {
                case 'toggleHover':
                    isHoverEnabled = message.enabled;
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        updateDecorations(editor);
                    }
                    vscode.window.showInformationMessage(`Code hover ${isHoverEnabled ? 'enabled' : 'disabled'}`);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    marginPanel.onDidDispose(
        () => {
            marginPanel = undefined;
            lastAnalyzedRange = undefined;
            
            // Clear hover timeout
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = undefined;
            }
            
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.setDecorations(functionDecorationType, []);
                editor.setDecorations(loopDecorationType, []);
                editor.setDecorations(conditionalDecorationType, []);
                editor.setDecorations(apiCallDecorationType, []);
                editor.setDecorations(htmlElementDecorationType, []);
                editor.setDecorations(cssRuleDecorationType, []);
                editor.setDecorations(activeHoverDecorationType, []);
            }
        },
        null,
        context.subscriptions
    );
}

function getWebviewContent(context: vscode.ExtensionContext, editor?: vscode.TextEditor) {
    let fileVisualization = '';

    const hasValidFile = editor && editor.document && ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html', 'css'].includes(editor.document.languageId);

    if (hasValidFile && editor) {
        const document = editor.document;
        const code = document.getText();
        const totalLines = document.lineCount;
        const languageId = document.languageId;

        const { functionRanges, loopRanges, conditionalRanges, apiCallRanges, htmlElementRanges, cssRuleRanges } = analyzeCode(code, document);

        const lineTypes: { [key: number]: string[] } = {};

        const markLines = (ranges: vscode.Range[], type: string) => {
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
        } else if (languageId === 'html') {
            markLines(htmlElementRanges, 'html');
        } else if (languageId === 'css') {
            markLines(cssRuleRanges, 'css');
        }

        fileVisualization = '<div class="file-viz-container">';
        for (let i = 0; i < totalLines; i++) {
            const types = lineTypes[i] || [];
            let colorClass = 'empty';

            if (types.includes('function')) {
                colorClass = 'function-color';
            } else if (types.includes('loop')) {
                colorClass = 'loop-color';
            } else if (types.includes('conditional')) {
                colorClass = 'conditional-color';
            } else if (types.includes('api')) {
                colorClass = 'api-color';
            } else if (types.includes('html')) {
                colorClass = 'html-color';
            } else if (types.includes('css')) {
                colorClass = 'css-color';
            }

            fileVisualization += `<div class="line-bar ${colorClass}" title="Line ${i + 1}"></div>`;
        }
        fileVisualization += '</div>';
    } else {
        fileVisualization = '<div class="no-file">Open a supported file (JS/TS/HTML/CSS) to see visualization</div>';
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Margin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 20px;
            font-size: 13px;
        }
        .header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        .header p {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        .toggle-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 6px;
        }
        .toggle {
            position: relative;
            width: 44px;
            height: 24px;
            background-color: var(--vscode-input-background);
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
            border: 1px solid var(--vscode-input-border);
        }
        .toggle.active {
            background-color: var(--vscode-button-background);
        }
        .toggle-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 18px;
            height: 18px;
            background-color: var(--vscode-button-foreground);
            border-radius: 50%;
            transition: transform 0.2s;
        }
        .toggle.active .toggle-slider {
            transform: translateX(20px);
        }
        .toggle-container label {
            font-size: 13px;
            color: var(--vscode-foreground);
            cursor: pointer;
        }
        .analysis-area {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 24px;
            min-height: 200px;
        }
        .placeholder {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        .analysis-content {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .analysis-content h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        .analysis-section {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .analysis-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .analysis-value {
            font-size: 13px;
            color: var(--vscode-foreground);
            line-height: 1.5;
        }
        .element-type-badge {
            display: inline-block;
            padding: 4px 10px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .legend-section {
            margin-bottom: 24px;
        }
        .legend-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--vscode-foreground);
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
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
    </style>
</head>
<body>
    <div class="header">
        <h2>Margin</h2>
        <p>AI-powered code understanding for designers</p>
    </div>
    
    <div class="toggle-container">
        <div class="toggle" id="hoverToggle">
            <div class="toggle-slider"></div>
        </div>
        <label for="hoverToggle">Enable AI Hover Analysis</label>
    </div>
    
    <div class="analysis-area" id="analysisArea">
        <div class="placeholder">
            Enable hover and move your cursor over highlighted code to see AI-powered explanations here...
        </div>
    </div>
    
    <div class="legend-section">
        <div class="legend-title">Code Highlighting Legend</div>
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
        <div class="legend-title">File Visualization Map</div>
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
            
            vscode.postMessage({
                type: 'toggleHover',
                enabled: isEnabled
            });
        });

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
            const isLoading = analysis.purpose && analysis.purpose.includes('');
            
            analysisArea.innerHTML = \`
                <div class="analysis-content">
                    <h3> AI Code Analysis</h3>
                    <div class="analysis-section">
                        <div class="analysis-label">Element Type</div>
                        <div class="analysis-value">
                            <span class="element-type-badge">\${analysis.elementType || 'Unknown'}</span>
                        </div>
                    </div>
                    <div class="analysis-section">
                        <div class="analysis-label">\${isLoading ? 'AI Explanation' : 'AI Explanation'}</div>
                        <div class="analysis-value" style="line-height: 1.6; white-space: pre-wrap;">\${analysis.purpose || 'N/A'}</div>
                    </div>
                    <div class="analysis-section">
                        <div class="analysis-label">📍 Location</div>
                        <div class="analysis-value">\${analysis.visualContext || 'N/A'}</div>
                    </div>
                    <div class="analysis-section">
                        <div class="analysis-label">Line Number</div>
                        <div class="analysis-value">Line \${analysis.lineNumber || 'N/A'}</div>
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
}

export function deactivate() {}