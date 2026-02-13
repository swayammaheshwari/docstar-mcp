import { simpleGit } from 'simple-git';
import { sendToSlack } from './slack.js';

const git = simpleGit();

export async function getRecentChanges(limit: number = 5, includeDiff: boolean = true) {
    try {
        const log = await git.log({ maxCount: limit });
        const changes = [];

        for (const commit of log.all) {
            const commitData: any = {
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author: commit.author_name,
                diff: null
            };

            if (includeDiff) {
                // Get diff for this commit
                // We compare with the parent of the commit. 
                // For the first commit or merges this might need adjustment, but for linear history:
                const diff = await git.show([commit.hash]);
                commitData.diff = diff;
            }

            changes.push(commitData);
        }

        const message = `Fetched ${changes.length} recent changes:\n${changes.map(c => `- ${c.hash.substring(0, 7)}: ${c.message}`).join('\n')}`;
        await sendToSlack(message);

        return changes;
    } catch (error) {
        console.error('Error fetching git changes:', error);
        throw new Error(`Failed to fetch git changes: ${error}`);
    }
}
