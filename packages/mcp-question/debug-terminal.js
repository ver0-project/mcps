import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TerminalQuestionnaire} from './dist/terminal/terminal.js';

/**
 * Debug script to test terminal questionnaire functionality.
 * This script BYPASSES the MCP tool layer and directly invokes the full terminal spawning cycle:
 * 1. Creates temporary files
 * 2. Spawns new terminal window
 * 3. Waits for user responses
 * 4. Cleans up temporary files
 */
async function debugTerminalQuestionnaire() {
	console.log('🔍 Starting Terminal Questionnaire Debug Script');
	console.log('================================================');
	console.log('ℹ️  This script bypasses MCP tools and directly tests terminal spawning');

	try {
		// Get the directory of this script
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);

		// Load the example payload
		const payloadPath = path.join(__dirname, 'example-payload.json');
		console.log(`📄 Loading example payload from: ${payloadPath}`);

		const payloadData = await fs.readFile(payloadPath, 'utf8');
		const questionnaire = JSON.parse(payloadData);

		console.log(`✅ Loaded questionnaire with ${questionnaire.questions.length} questions`);
		console.log('📋 Questions:');
		for (const [index, q] of questionnaire.questions.entries()) {
			console.log(`  ${index + 1}. [${q.type}] ${q.prompt}`);
		}

		console.log('\n🚀 Executing questionnaire...');
		console.log('⏳ A new terminal window should open with the questionnaire');
		console.log('💡 Complete the questionnaire in the new window to see the results here');

		// Create terminal questionnaire instance (bypassing MCP tool layer)
		const terminal = new TerminalQuestionnaire();

		// Execute the questionnaire - this does the FULL terminal spawning cycle:
		// - Creates temp files with questionnaire data
		// - Spawns new terminal window with runner script
		// - Waits for response file to be created
		// - Reads and parses response
		// - Cleans up temp files
		const response = await terminal.execute(questionnaire);

		console.log('\n🎉 Questionnaire completed!');
		console.log('=====================================');

		// Display results
		if (response.cancelled) {
			console.log('❌ Questionnaire was cancelled by the user');
		} else if (response.timedOut) {
			console.log('⏰ Questionnaire timed out');
		} else {
			console.log('✅ Questionnaire completed successfully');
			console.log('\n📊 Results:');
			console.log('------------');

			for (const [index, resp] of response.responses.entries()) {
				const question = questionnaire.questions.find((q) => q.id === resp.questionId);
				console.log(`\n${index + 1}. ${question?.prompt || resp.questionId}:`);
				console.log(`   Answer: ${resp.response.join(', ')}`);
			}
		}

		console.log('\n🔚 Debug session complete');
	} catch (error) {
		console.error('❌ Error during debug execution:', error);
		console.error('Stack trace:', error.stack);
		throw error;
	}
}

// Run the debug script
await debugTerminalQuestionnaire();
