# MCP Git Server

An MCP (Model Context Protocol) server that provides comprehensive Git operations as tools for AI assistants and
applications. This server enables AI systems to interact with Git repositories through a structured, validated
interface.

## Tools

The server provides the following Git operations:

### Repository Management

1. **`init`** - Initialize new Git repository
2. **`status`** - Get repository status with detailed file information

### File Operations

3. **`add`** - Stage files for commit
4. **`reset`** - Reset repository state (soft, mixed, hard)

### Commit Operations

5. **`commit`** - Create commits with comprehensive options
6. **`log`** - View commit history with filtering and formatting options
7. **`show`** - Display commit details and changes

### Branch Operations

8. **`create-branch`** - Create new branches from any starting point
9. **`checkout`** - Switch branches/commits with advanced options

### Comparison Operations

10. **`diff`** - Show differences between commits, branches, or files

> [!NOTE] Server intentionally lacks push operations to avoid security risks.

## Tool Details

### git_status

Shows the working tree status with comprehensive formatting options.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `short` (boolean, optional): Give output in short format
- `branch` (boolean, optional): Show branch and tracking info
- `verbose` (boolean/number, optional): Show textual changes staged for commit
- `untrackedFiles` (boolean/string, optional): Show untracked files
- `ignoreSubmodules` (string, optional): Ignore changes to submodules
- `pathspec` (array, optional): Limit output to given paths

**Returns:** Detailed repository status information

### git_add

Adds file contents to the staging area.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `files` (array): List of file paths to stage

**Returns:** Confirmation of staged files

### git_commit

Records changes to the repository with extensive commit options.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `message` (string): Commit message
- `all` (boolean, optional): Automatically stage modified files
- `author` (string, optional): Override author
- `amend` (boolean, optional): Amend the previous commit
- `gpgSign` (boolean/string, optional): GPG sign commit
- `trailers` (array, optional): Add trailers to commit message
- Plus many more advanced options...

**Returns:** Commit confirmation with details

### git_log

Shows commit history with advanced filtering and formatting.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `maxCount` (number, optional): Limit number of commits
- `since` (string, optional): Show commits after date
- `author` (string, optional): Filter by author
- `format` (string, optional): Pretty-print format
- `graph` (boolean, optional): Show text-based graph
- `pathspec` (array, optional): Limit to specific paths

**Returns:** Formatted commit history

### git_create_branch

Creates new branches with flexible options.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `branchName` (string): Name of new branch
- `startPoint` (string, optional): Starting commit/branch/tag
- `switchToBranch` (boolean, optional): Switch to new branch (default: true)
- `force` (boolean, optional): Force create, reset if exists

**Returns:** Branch creation confirmation

### git_checkout

Switches branches or commits with advanced options.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `target` (string): Branch/commit/tag to checkout
- `force` (boolean, optional): Force checkout
- `createBranch` (string, optional): Create and checkout new branch
- `detach` (boolean, optional): Detached HEAD mode
- `pathspec` (array, optional): Limit to specific paths

**Returns:** Checkout confirmation

### git_reset

Resets repository state with different modes.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `target` (string, optional): Target commit (default: HEAD)
- `mode` (string, optional): Reset mode - soft/mixed/hard (default: mixed)
- `pathspec` (array, optional): Limit to specific paths

**Returns:** Reset confirmation

### git_diff

Shows differences between commits, branches, or files.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `from` (string, optional): Source commit/branch/tag
- `to` (string, optional): Target commit/branch/tag
- `staged` (boolean, optional): Show staged changes
- `nameOnly` (boolean, optional): Show only changed file names
- `pathspec` (array, optional): Limit to specific paths

**Returns:** Diff output

### git_show

Displays commit details and changes.

**Inputs:**

- `repoPath` (string): Absolute path to Git repository
- `commit` (string, optional): Commit to show (default: HEAD)
- `format` (string, optional): Pretty-print format
- `stat` (boolean, optional): Show diffstat
- `pathspec` (array, optional): Limit to specific paths

**Returns:** Commit details and changes

### git_init

Initializes a new Git repository.

**Inputs:**

- `repoPath` (string): Path where to initialize repository
- `bare` (boolean, optional): Create bare repository
- `initialBranch` (string, optional): Set initial branch name
- `template` (string, optional): Template directory

**Returns:** Initialization confirmation

## Installation

```json
{
	"mcpServers": {
		"git": {
			"command": "npx",
			"args": ["-y", "@ver0/mcp-git"]
		}
	}
}
```
