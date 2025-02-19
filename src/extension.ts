import * as vscode from 'vscode';
import axios from 'axios';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('tweax.optimizeSelection', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No active editor found.");
                return;
            }

            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showErrorMessage("No code selected.");
                return;
            }

            const selectedCode = editor.document.getText(selection);

            if (!panel) {
                panel = vscode.window.createWebviewPanel(
                    'codeOptimizerSidebar',
                    'Code Optimizer',
                    vscode.ViewColumn.Beside,
                    { enableScripts: true }
                );
                panel.onDidDispose(() => panel = undefined);
            }

            panel.webview.html = getWebviewContent();

            try {
                const response = await axios.post('http://localhost:5000/optimize', { code: selectedCode });
                console.log(response.data); // Log the API response for debugging
                const { optimized_code, explanation, time_complexity, space_complexity, cpu_usage_before, cpu_usage_after, memory_usage_before, memory_usage_after, error } = response.data;

                if (error) {
                    vscode.window.showErrorMessage(`Optimization Error: ${error}`);
                    return;
                }

                panel.webview.postMessage({
                    type: 'update',
                    optimizedCode: extractCodeBlock(optimized_code),
                    explanation: explanation || "No explanation available.",
                    timeComplexity: time_complexity || "Not available.",
                    spaceComplexity: space_complexity || "Not available.",
                    cpuUsageBefore: cpu_usage_before || "Not available.",
                    cpuUsageAfter: cpu_usage_after || "Not available.",
                    memoryUsageBefore: memory_usage_before || "Not available.",
                    memoryUsageAfter: memory_usage_after || "Not available."
                });
            } catch (error) {
                vscode.window.showErrorMessage("Error contacting the optimization server.");
                console.error(error);  // Log any errors from the API call
            }
        })
    );
}

function extractCodeBlock(text: string): string {
    const match = text.match(/```[\w]*\n([\s\S]*?)\n```/);
    return match ? match[1].trim() : text; // Extract only the code inside the backticks
}

function getWebviewContent(): string {
    return `
    <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 10px; }
                pre { background: #3C3C3C; padding: 10px; border-radius: 5px; overflow-x: auto; }
                button { background: #3C3C3C; color: white; margin-top: 5px; padding: 5px 10px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h3>Code Optimizer</h3>
            <div>
                <h4>Optimized Code:</h4>
                <pre><code id="optimizedCode"></code></pre>
                <button onclick="copyCode()">Copy Code</button>
            </div>
            <div>
                <h4>Explanation:</h4>
                <p id="explanation"></p>
            </div>
            <div>
                <h4>Time Complexity:</h4>
                <p id="timeComplexity"></p>
            </div>
            <div>
                <h4>Space Complexity:</h4>
                <p id="spaceComplexity"></p>
            </div>
            <div>
                <h4>CPU Usage (Before):</h4>
                <p id="cpuUsageBefore"></p>
            </div>
            <div>
                <h4>CPU Usage (After):</h4>
                <p id="cpuUsageAfter"></p>
            </div>
            <div>
                <h4>Memory Usage (Before):</h4>
                <p id="memoryUsageBefore"></p>
            </div>
            <div>
                <h4>Memory Usage (After):</h4>
                <p id="memoryUsageAfter"></p>
            </div>
            <script>
                const vscode = acquireVsCodeApi();

                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    if (message.type === 'update') {
                        console.log("Received message:", message);  // Log to ensure message is being received
                        document.getElementById('optimizedCode').innerText = message.optimizedCode;
                        document.getElementById('explanation').innerText = message.explanation;
                        document.getElementById('timeComplexity').innerText = message.timeComplexity;
                        document.getElementById('spaceComplexity').innerText = message.spaceComplexity;
                        document.getElementById('cpuUsageBefore').innerText = message.cpuUsageBefore;
                        document.getElementById('cpuUsageAfter').innerText = message.cpuUsageAfter;
                        document.getElementById('memoryUsageBefore').innerText = message.memoryUsageBefore;
                        document.getElementById('memoryUsageAfter').innerText = message.memoryUsageAfter;
                    }
                });

                function copyCode() {
                    const codeText = document.getElementById("optimizedCode").innerText;
                    navigator.clipboard.writeText(codeText);
                    alert("Optimized code copied!");
                }
            </script>
        </body>
    </html>
    `;
}

export function deactivate() {}
