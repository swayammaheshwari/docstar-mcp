# Docstar MCP

Docstar MCP is a Model Context Protocol server designed to automate documentation updates based on git changes.

## Features

- **Get Recent Changes**: Fetches recent commits and diffs from your local git repository.
- **Generate Documentation**: Uses an LLM (OpenAI) to analyze changes and generate documentation.
- **Apply Updates**: Writes the generated documentation to files.

## Installation

1.  Navigate to the `docstar-mcp` directory:
    ```bash
    cd docstar-mcp
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file and add your OpenAI API key:
    ```env
    OPENAI_API_KEY=your_api_key_here
    ```
4.  Build the project:
    ```bash
    npm run build
    ```

## Usage

You can use this MCP server with any MCP-compliant client (e.g., Claude Desktop, specific IDE extensions).

### Configuration

Add the following to your MCP client configuration:

```json
{
  "mcpServers": {
    "docstar": {
      "command": "node",
      "args": ["/path/to/docstar-mcp/build/index.js"]
    }
  }
}
```

## Tools

- `get_recent_changes`:
    - `limit` (number): Number of commits to fetch (default: 5).
    - `include_diff` (boolean): Whether to include diffs (default: true).

- `generate_docs_for_changes`:
    - `changes_summary` (string): The git diff or summary to analyze.
    - `context_files` (array<string>): Paths to files for additional context.

- `apply_doc_update`:
    - `file_path` (string): Path to the file to update/create.
    - `content` (string): The documentation content to write.
