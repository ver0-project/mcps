# MCP Question Server

An MCP (Model Context Protocol) server that enables AI agents to ask users questions through an interactive terminal
interface. Perfect for gathering user input, preferences, and feedback during AI-assisted workflows.

## Features

- 🎯 **Interactive Terminal Interface** - Spawns new terminal windows for user interaction
- 📝 **Open-ended Questions** - Free-text input with validation and length constraints
- ✅ **Multiple Choice Questions** - Single or multi-select options with descriptions
- 🎨 **Custom "Other" Option** - Automatic fallback to custom text input (always available unless disabled)
- ⚡ **Cross-platform Support** - Works on macOS, Windows, and Linux
- 🔄 **Structured Responses** - Returns JSON-formatted answers with metadata
- ⏱️ **Timeout Management** - Configurable timeout prevents infinite waiting
- 🎛️ **Flexible Validation** - Min/max length, selection constraints, and more

## Installation

Add to your MCP client configuration:

```json
{
	"mcpServers": {
		"question": {
			"command": "npx",
			"args": ["-y", "@ver0/mcp-question"]
		}
	}
}
```

## Usage

The server provides a single tool: `ask-question`

### Basic Examples

**Open-ended Question:**

```json
{
	"questions": [
		{
			"type": "open",
			"id": "user_name",
			"prompt": "What is your name?",
			"description": "Please enter your full name",
			"placeholder": "John Doe",
			"minLength": 2,
			"maxLength": 50
		}
	]
}
```

**Multiple Choice Question:**

```json
{
	"questions": [
		{
			"type": "multiple_choice",
			"id": "favorite_language",
			"prompt": "What is your favorite programming language?",
			"options": [
				{
					"id": "typescript",
					"label": "TypeScript",
					"description": "Typed superset of JavaScript"
				},
				{
					"id": "python",
					"label": "Python",
					"description": "High-level, interpreted language"
				}
			],
			"defaultOptionID": "typescript"
		}
	]
}
```

**Multi-select with Custom Option:**

```json
{
	"questions": [
		{
			"type": "multiple_choice",
			"id": "technologies",
			"prompt": "Which technologies do you use?",
			"allowMultiple": true,
			"allowOwnVariant": true,
			"minSelections": 1,
			"maxSelections": 3,
			"options": [
				{"id": "react", "label": "React"},
				{"id": "vue", "label": "Vue.js"},
				{"id": "angular", "label": "Angular"}
			]
		}
	]
}
```

### Question Types

#### Open Questions

- **Type**: `"open"`
- **Fields**:
  - `placeholder`: Optional placeholder text
  - `minLength`: Minimum character length (default: 0)
  - `maxLength`: Maximum character length (default: 1000)

#### Multiple Choice Questions

- **Type**: `"multiple_choice"`
- **Fields**:
  - `options`: Array of choice options
  - `defaultOptionID`: Pre-selected option ID
  - `allowMultiple`: Enable multi-select (default: false)
  - `allowOwnVariant`: Show "Other" option (default: true)
  - `minSelections`: Minimum selections required
  - `maxSelections`: Maximum selections allowed

### Response Format

```json
{
	"responses": [
		{
			"questionId": "user_name",
			"response": ["John Doe"],
			"customText": "Custom answer when Other was selected"
		}
	],
	"cancelled": false,
	"timedOut": false
}
```

### Common Use Cases

1. **User Onboarding**: Collect user preferences and setup information
2. **Project Configuration**: Ask about project settings and requirements
3. **Feedback Collection**: Gather user opinions and suggestions
4. **Decision Making**: Present options and get user choices
5. **Data Validation**: Confirm generated content or decisions