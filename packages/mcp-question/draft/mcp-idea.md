# MCP Question - The idea

- This package is a MCP server that can be used by agents to ask questions to user.
- It is expected to spawn terminal with questionnaire and wait for user to answer.
- Questions can be of two types:
  - Text input
  - Multiple choice
- It is expected to return the answers to the agent.
- Agent can question one or multiple questions in single call.
- Maximum amount of questions must be limited.
- There must be a limit for mcp to wait for user to answer.
- Max wait time must scale with amount of questions.
