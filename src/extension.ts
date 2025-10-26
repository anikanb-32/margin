import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as path from 'path';
import OpenAI from 'openai';

// Global state
let codeVisPanel: vscode.WebviewPanel | undefined;
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
            const line = lines[i].trim();
            // Match any line with HTML tags (opening, closing, or self-closing)
            if (line.length > 0 && line.includes('<') && line.includes('>')) {
                const range = new vscode.Range(i, 0, i, lines[i].length);
                htmlElementRanges.push(range);
            }
        }
        console.log('HTML parsing complete:', htmlElementRanges.length, 'elements found');
    } else if (languageId === 'css') {
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Match selectors, properties, or closing braces - be very permissive
            if (line.length > 0 && (
                line.includes('{') || 
                line.includes('}') || 
                (line.includes(':') && !line.startsWith('//') && !line.startsWith('/*'))
            )) {
                const range = new vscode.Range(i, 0, i, lines[i].length);
                cssRuleRanges.push(range);
            }
        }
        console.log('CSS parsing complete:', cssRuleRanges.length, 'rules found');
    }
    
    console.log('analyzeCode complete for', languageId, ':', {
        functions: functionRanges.length,
        loops: loopRanges.length,
        conditionals: conditionalRanges.length,
        apiCalls: apiCallRanges.length,
        htmlElements: htmlElementRanges.length,
        cssRules: cssRuleRanges.length
    });

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

    const document = editor.document;
    const languageId = document.languageId;

    if (!codeVisPanel || !isHoverEnabled) {
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

    console.log('Decorations applied:', {
        functions: functionRanges.length,
        loops: loopRanges.length,
        conditionals: conditionalRanges.length,
        apiCalls: apiCallRanges.length,
        htmlElements: htmlElementRanges.length,
        cssRules: cssRuleRanges.length
    });
}

// OpenAI setup
let openaiClient: OpenAI | null = null;
const explanationCache = new Map<string, string>();

function getOpenAIClient(): OpenAI | null {
    if (openaiClient) {
        return openaiClient;
    }
    
    const config = vscode.workspace.getConfiguration('codevis');
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
        return `**${codeType}**\n\nAI explanation unavailable. Please configure your OpenAI API key in VS Code settings (search for "CodeVis: OpenAI API Key").`;
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
                    content: "You are a helpful code explanation assistant for designers who are learning to code. You have access to the full project context. Explain code snippets concisely in 2-4 sentences, considering how they fit into the larger project. Focus on what the code does, why it exists in this context, and how it relates to other parts of the codebase. Use simple language and avoid jargon when possible."
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
    } catch (error: any) {
        console.error('OpenAI API error:', error);
        if (error?.status === 401) {
            return `**${codeType}**\n\n❌ Invalid API key. Please check your OpenAI API key in VS Code settings.`;
        }
        return `**${codeType}**\n\n❌ Error getting AI explanation: ${error?.message || 'Unknown error'}`;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeVis extension is now active!');
    vscode.window.showInformationMessage('CodeVis is now active!');

    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations(activeEditor);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            updateDecorations(editor);
            if (codeVisPanel) {
                codeVisPanel.webview.html = getWebviewContent(context, editor);
            }
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            updateDecorations(activeEditor);
            if (codeVisPanel) {
                codeVisPanel.webview.html = getWebviewContent(context, activeEditor);
            }
        }
    }, null, context.subscriptions);

    const openPanelCommand = vscode.commands.registerCommand('codevis.openPanel', () => {
        createCodeVisPanel(context);
    });

    const toggleHoverCommand = vscode.commands.registerCommand('codevis.toggleHover', () => {
        isHoverEnabled = !isHoverEnabled;
        if (codeVisPanel) {
            codeVisPanel.webview.postMessage({
                type: 'hoverToggled',
                enabled: isHoverEnabled
            });
        }
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
        vscode.window.showInformationMessage(`CodeVis hover analysis ${isHoverEnabled ? 'enabled' : 'disabled'}`);
    });

    // Single AI-powered hover provider
    const aiHoverProvider = vscode.languages.registerHoverProvider(
        ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html', 'css'],
        {
            async provideHover(document, position, token) {
                if (!isHoverEnabled || !codeVisPanel) {
                    return null;
                }

                const code = document.getText();
                const languageId = document.languageId;
                const { functionRanges, loopRanges, conditionalRanges, apiCallRanges, htmlElementRanges, cssRuleRanges } = analyzeCode(code, document);
                
                const isInRange = (range: vscode.Range) => range.contains(position);
                
                let hoveredRange: vscode.Range | null = null;
                let codeType = '';
                let emoji = '';
                
                // Determine what type of code is being hovered
                if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
                    if (functionRanges.some(isInRange)) {
                        hoveredRange = functionRanges.find(isInRange) || null;
                        codeType = 'Function';
                        emoji = '🟢';
                    } else if (loopRanges.some(isInRange)) {
                        hoveredRange = loopRanges.find(isInRange) || null;
                        codeType = 'Loop';
                        emoji = '🔴';
                    } else if (conditionalRanges.some(isInRange)) {
                        hoveredRange = conditionalRanges.find(isInRange) || null;
                        codeType = 'Conditional';
                        emoji = '🔵';
                    } else if (apiCallRanges.some(isInRange)) {
                        hoveredRange = apiCallRanges.find(isInRange) || null;
                        codeType = 'API Call';
                        emoji = '🟡';
                    } else {
                        // For any other JS/TS code, get the current line
                        const line = document.lineAt(position.line);
                        hoveredRange = line.range;
                        codeType = 'Code Block';
                        emoji = '⚪';
                    }
                } else if (languageId === 'html') {
                    if (htmlElementRanges.some(isInRange)) {
                        hoveredRange = htmlElementRanges.find(isInRange) || null;
                        codeType = 'HTML Element';
                        emoji = '🟠';
                    } else {
                        // If not in a detected range, get the current line for HTML
                        const line = document.lineAt(position.line);
                        hoveredRange = line.range;
                        codeType = 'HTML Element';
                        emoji = '🟠';
                    }
                } else if (languageId === 'css') {
                    if (cssRuleRanges.some(isInRange)) {
                        hoveredRange = cssRuleRanges.find(isInRange) || null;
                        codeType = 'CSS Rule';
                        emoji = '🟣';
                    } else {
                        // If not in a detected range, get the current line for CSS
                        const line = document.lineAt(position.line);
                        hoveredRange = line.range;
                        codeType = 'CSS Property';
                        emoji = '🟣';
                    }
                }
                
                if (hoveredRange && codeVisPanel) {
                    const codeSnippet = document.getText(hoveredRange);
                    const fullFileContent = document.getText();
                    const lineNumber = position.line + 1;
                    const fileName = document.fileName.split('/').pop() || 'Unknown';
                    
                    // Send immediate update to panel with code snippet
                    codeVisPanel.webview.postMessage({
                        type: 'codeAnalysis',
                        analysis: {
                            codeLine: codeSnippet.substring(0, 150) + (codeSnippet.length > 150 ? '...' : ''),
                            elementType: `${emoji} ${codeType}`,
                            purpose: '⏳ Analyzing with AI...',
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
                        if (codeVisPanel) {
                            codeVisPanel.webview.postMessage({
                                type: 'codeAnalysis',
                                analysis: {
                                    codeLine: codeSnippet.substring(0, 150) + (codeSnippet.length > 150 ? '...' : ''),
                                    elementType: `${emoji} ${codeType}`,
                                    purpose: explanation,
                                    lineNumber: lineNumber,
                                    isLoading: false
                                }
                            });
                        }
                    }).catch(error => {
                        console.error('Error getting AI explanation:', error);
                        if (codeVisPanel) {
                            codeVisPanel.webview.postMessage({
                                type: 'codeAnalysis',
                                analysis: {
                                    codeLine: codeSnippet.substring(0, 150) + (codeSnippet.length > 150 ? '...' : ''),
                                    elementType: `${emoji} ${codeType}`,
                                    purpose: '❌ Error getting AI explanation. Please check your API key.',
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

    const showLegendCommand = vscode.commands.registerCommand('codevis.showLegend', () => {
        if (codeVisPanel) {
            const editor = vscode.window.activeTextEditor;
            codeVisPanel.webview.html = getWebviewContent(context, editor);
        } else {
            createCodeVisPanel(context);
        }
    });

    context.subscriptions.push(
        openPanelCommand,
        toggleHoverCommand,
        aiHoverProvider,
        showLegendCommand
    );
}

function createCodeVisPanel(context: vscode.ExtensionContext) {
    if (codeVisPanel) {
        codeVisPanel.reveal(vscode.ViewColumn.Beside);
        return;
    }

    const editor = vscode.window.activeTextEditor;

    codeVisPanel = vscode.window.createWebviewPanel(
        'codeVis',
        'CodeVis',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
        }
    );

    codeVisPanel.webview.html = getWebviewContent(context, editor);

    codeVisPanel.webview.onDidReceiveMessage(
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

    codeVisPanel.onDidDispose(
        () => {
            codeVisPanel = undefined;
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.setDecorations(functionDecorationType, []);
                editor.setDecorations(loopDecorationType, []);
                editor.setDecorations(conditionalDecorationType, []);
                editor.setDecorations(apiCallDecorationType, []);
                editor.setDecorations(htmlElementDecorationType, []);
                editor.setDecorations(cssRuleDecorationType, []);
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
        const fileName = document.fileName.split('/').pop() || 'Unknown';
        fileVisualization += `<div style="margin-bottom: 10px; font-weight: bold;">📄 ${fileName}</div>`;
        fileVisualization += `<div style="margin-bottom: 10px; font-size: 12px; color: var(--vscode-descriptionForeground);">Total Lines: ${totalLines} • ${languageId.toUpperCase()}</div>`;

        const maxLines = Math.min(totalLines, 200);
        
        for (let i = 0; i < maxLines; i++) {
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

            fileVisualization += `<div class="line-bar ${colorClass}" title="Line ${i + 1}${types.length > 0 ? ': ' + types.join(', ') : ''}"></div>`;
        }

        if (totalLines > 200) {
            fileVisualization += `<div style="text-align: center; padding: 10px; color: var(--vscode-descriptionForeground); font-size: 12px;">... and ${totalLines - 200} more lines</div>`;
        }

        const summary = [];
        if (functionRanges.length > 0) summary.push(`${functionRanges.length} functions`);
        if (loopRanges.length > 0) summary.push(`${loopRanges.length} loops`);
        if (conditionalRanges.length > 0) summary.push(`${conditionalRanges.length} conditionals`);
        if (apiCallRanges.length > 0) summary.push(`${apiCallRanges.length} API calls`);
        if (htmlElementRanges.length > 0) summary.push(`${htmlElementRanges.length} HTML elements`);
        if (cssRuleRanges.length > 0) summary.push(`${cssRuleRanges.length} CSS rules`);

        if (summary.length > 0) {
            fileVisualization += `<div style="margin-top: 10px; padding: 8px; background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">Found: ${summary.join(', ')}</div>`;
        }

        fileVisualization += '</div>';
    } else {
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
            white-space: pre-wrap;
            word-break: break-word;
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
            gap: 2px;
            max-height: 400px;
            overflow-y: auto;
        }
        .line-bar {
            height: 4px;
            border-radius: 2px;
            transition: height 0.2s;
            min-height: 4px;
        }
        .line-bar:hover {
            height: 8px;
        }
        .line-bar.empty {
            background-color: rgba(128, 128, 128, 0.15);
        }
        .line-bar.function-color {
            background-color: rgba(100, 200, 100, 0.6);
        }
        .line-bar.loop-color {
            background-color: rgba(200, 100, 100, 0.6);
        }
        .line-bar.conditional-color {
            background-color: rgba(100, 100, 200, 0.6);
        }
        .line-bar.api-color {
            background-color: rgba(200, 200, 100, 0.6);
        }
        .line-bar.html-color {
            background-color: rgba(255, 165, 0, 0.6);
        }
        .line-bar.css-color {
            background-color: rgba(138, 43, 226, 0.6);
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
        <h2>🎨 CodeVis</h2>
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
            ✨ Enable hover and move your cursor over highlighted code to see AI-powered explanations here...
        </div>
    </div>
    
    <div class="legend-section">
        <div class="legend-title">📊 Code Highlighting Legend</div>
        <div class="legend-item">
            <div class="color-box function-color"></div>
            <div class="legend-description">
                <div class="title">🟢 Functions</div>
                <div class="examples">function declarations, arrow functions, methods</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box loop-color"></div>
            <div class="legend-description">
                <div class="title">🔴 Loops</div>
                <div class="examples">for loops, while loops, do-while loops</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box conditional-color"></div>
            <div class="legend-description">
                <div class="title">🔵 Conditionals</div>
                <div class="examples">if statements, else statements, ternary operators</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box api-color"></div>
            <div class="legend-description">
                <div class="title">🟡 API Calls</div>
                <div class="examples">fetch, axios, HTTP requests</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box html-color"></div>
            <div class="legend-description">
                <div class="title">🟠 HTML Elements</div>
                <div class="examples">div, span, button, input elements</div>
            </div>
        </div>
        <div class="legend-item">
            <div class="color-box css-color"></div>
            <div class="legend-description">
                <div class="title">🟣 CSS Rules</div>
                <div class="examples">selectors, properties, media queries</div>
            </div>
        </div>
    </div>
    
    <div class="file-viz-section">
        <div class="legend-title">📈 File Visualization Map</div>
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
                        <div class="analysis-label">💡 AI Explanation</div>
                        <div class="analysis-value" style="line-height: 1.6; white-space: pre-wrap;">\${analysis.purpose || 'N/A'}</div>
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