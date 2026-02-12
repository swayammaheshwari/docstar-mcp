# How to Use Docstar MCP

Docstar MCP provides tools that your AI assistant (Claude, Cursor, etc.) can use to check your git history and generate documentation.

**Important:** The MCP server does not run automatically in the background when you commit. You must **ask** the AI to perform actions using the tools.

## Example Prompts

Here are some things you can say to your AI assistant to use the tools:

### 1. Check Recent Changes
> "Check my recent git changes."
> "What are the last 5 commits in this repo?"

This uses the `get_recent_changes` tool.

### 2. Generate Documentation
> "Generate documentation for the last 3 commits."
> "Write a summary of the recent changes to `src/components/`."

This uses `get_recent_changes` to get the diffs, and then `generate_docs_for_changes` to create the documentation.

### 3. Update Files
> "Update the CHANGELOG.md with the recent changes."
> "Create a new file `docs/new-feature.md` describing the latest commit."

This uses `apply_doc_update` to save the generated documentation to a file.

## Workflow Example

1.  Make some changes in your project (e.g., `hitman-ui`) and commit them.
2.  Open your AI assistant (e.g., Claude Desktop or Cursor).
3.  Type: **"I just pushed some changes. Can you check the git history and draft a documentation update for me?"**
4.  The AI will:
    *   Call `get_recent_changes` to see your commits.
    *   Call `generate_docs_for_changes` to write the docs.
    *   (Optional) Ask you to confirm before using `apply_doc_update` to save the file.
