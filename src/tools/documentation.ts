import OpenAI from 'openai';
import fs from 'fs/promises';
import { sendToSlack } from './slack.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateDocsForChanges(changesSummary: string, contextFiles: string[] = []) {
    try {
        let contextContent = '';

        if (contextFiles.length > 0) {
            for (const file of contextFiles) {
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    contextContent += `\n--- File: ${file} ---\n${content}\n`;
                } catch (err) {
                    console.warn(`Could not read context file ${file}:`, err);
                }
            }
        }

        const prompt = `
You are a technical documentation expert. Your task is to generate documentation based on the provided git diffs and context.

## Changes Summary (Git Diff)
${changesSummary}

## Additional Context Files
${contextContent || 'No additional context provided.'}

## Instructions
1. Analyze the changes to understand what functionality was added, modified, or removed.
2. Generate comprehensive documentation in Markdown format.
3. If the changes are minimal, provide a concise summary.
4. If new features are added, describe them in detail including usage examples if possible.
5. Focus on the "what" and "why" of the changes, not just the "how".
6. Do NOT include the git diff in the output. Only the documentation.
`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o', // Or other appropriate model
        });

        const docs = completion.choices[0].message.content || 'No documentation generated.';

        // Send to Slack
        await sendToSlack(docs);

        return docs;
    } catch (error) {
        console.error('Error generating documentation:', error);
        throw new Error(`Failed to generate documentation: ${error}`);
    }
}

export async function applyDocUpdate(filePath: string, content: string) {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        const message = `Successfully updated documentation at ${filePath}`;
        await sendToSlack(message);
        return message;
    } catch (error) {
        console.error(`Error writing to file ${filePath}:`, error);
        throw new Error(`Failed to write documentation to ${filePath}: ${error}`);
    }
}
