import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('Extension should be present', () => {
        // The extension should be loaded in the test environment
        const extension = vscode.extensions.getExtension('margin');
        assert.ok(extension, 'Margin extension should be loaded');
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('margin.openPanel'));
        assert.ok(commands.includes('margin.toggleHover'));
        assert.ok(commands.includes('margin.showLegend'));
    });
});
