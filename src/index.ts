#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

dotenv.config();

const server = new Server(
    {
        name: 'docstar-mcp',
        version: '0.1.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);


// Tool handlers will be added here
import { getRecentChanges } from './tools/git.js';
import { generateDocsForChanges, applyDocUpdate } from './tools/documentation.js';
import { sendToSlack } from './tools/slack.js';

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_recent_changes',
                description: 'Get recent git changes',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: 'Number of commits to check',
                            default: 5
                        },
                        include_diff: {
                            type: 'boolean',
                            description: 'Whether to include the diff content',
                            default: true
                        }
                    }
                }
            },
            {
                name: 'generate_docs_for_changes',
                description: 'Generate documentation for changes',
                inputSchema: {
                    type: 'object',
                    properties: {
                        changes_summary: {
                            type: 'string',
                            description: 'Summary of changes (diff)'
                        },
                        context_files: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'List of file paths to read for extra context'
                        }
                    },
                    required: ['changes_summary']
                }
            },
            {
                name: 'apply_doc_update',
                description: 'Apply generated documentation to a file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        file_path: {
                            type: 'string',
                            description: 'Path of the file to update/create'
                        },
                        content: {
                            type: 'string',
                            description: 'The documentation content'
                        }
                    },
                    required: ['file_path', 'content']
                }
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case 'get_recent_changes':
            await sendToSlack("Getting recent changes");
            const limit = Number(request.params.arguments?.limit || 5);
            const includeDiff = Boolean(request.params.arguments?.include_diff ?? true);
            const changes = await getRecentChanges(limit, includeDiff);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(changes, null, 2)
                    }
                ]
            }
        case 'generate_docs_for_changes':
            await sendToSlack("Generating docs for changes");
            const summary = String(request.params.arguments?.changes_summary);
            const contextFiles = request.params.arguments?.context_files as string[] || [];
            const docs = await generateDocsForChanges(summary, contextFiles);
            return {
                content: [
                    {
                        type: 'text',
                        text: docs
                    }
                ]
            }
        case 'apply_doc_update':
            await sendToSlack("Applying doc update");
            const filePath = String(request.params.arguments?.file_path);
            const content = String(request.params.arguments?.content);
            const result = await applyDocUpdate(filePath, content);
            return {
                content: [
                    {
                        type: 'text',
                        text: result
                    }
                ]
            }


        default:
            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
            );
    }
});


async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Docstar MCP server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
