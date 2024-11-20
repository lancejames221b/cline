import { ClineMessage } from "./ExtensionMessage"

/**
 * Combines sequences of command and command_output messages in an array of ClineMessages.
 * Also tracks and logs CRUD operations for better transparency.
 *
 * This function processes an array of ClineMessages objects, looking for sequences
 * where a 'command' message is followed by one or more 'command_output' messages.
 * When such a sequence is found, it combines them into a single message, merging
 * their text contents. Additionally, it tracks and logs CRUD operations for better
 * visibility and auditing.
 *
 * @param messages - An array of ClineMessage objects to process.
 * @returns A new array of ClineMessage objects with command sequences combined.
 *
 * @example
 * const messages: ClineMessage[] = [
 *   { type: 'ask', ask: 'command', text: 'ls', ts: 1625097600000 },
 *   { type: 'ask', ask: 'command_output', text: 'file1.txt', ts: 1625097601000 },
 *   { type: 'ask', ask: 'command_output', text: 'file2.txt', ts: 1625097602000 }
 * ];
 * const result = simpleCombineCommandSequences(messages);
 * // Result: [{ type: 'ask', ask: 'command', text: 'ls\nfile1.txt\nfile2.txt', ts: 1625097600000 }]
 */
export function combineCommandSequences(messages: ClineMessage[]): ClineMessage[] {
	const combinedCommands: ClineMessage[] = []
	const crudOperations: {
		type: 'create' | 'read' | 'update' | 'delete'
		path: string
		timestamp: number
		automated: boolean
	}[] = []

	// First pass: combine commands with their outputs and track CRUD operations
	for (let i = 0; i < messages.length; i++) {
		if (messages[i].type === "ask" && messages[i].ask === "command") {
			let combinedText = messages[i].text || ""
			let didAddOutput = false
			let j = i + 1

			// Track CRUD operations
			const command = messages[i].text || ""
			if (command.includes('write_to_file')) {
				const automated = !command.includes('require_confirmation')
				const pathMatch = command.match(/path>([^<]+)<\/path>/)
				if (pathMatch) {
					crudOperations.push({
						type: command.includes('overwrite') ? 'update' : 'create',
						path: pathMatch[1],
						timestamp: messages[i].ts,
						automated
					})
				}
			} else if (command.includes('read_file')) {
				const automated = !command.includes('require_confirmation')
				const pathMatch = command.match(/path>([^<]+)<\/path>/)
				if (pathMatch) {
					crudOperations.push({
						type: 'read',
						path: pathMatch[1],
						timestamp: messages[i].ts,
						automated
					})
				}
			}

			while (j < messages.length) {
				if (messages[j].type === "ask" && messages[j].ask === "command") {
					// Stop if we encounter the next command
					break
				}
				if (messages[j].ask === "command_output" || messages[j].say === "command_output") {
					if (!didAddOutput) {
						// Add a newline before the first output
						combinedText += `\n${COMMAND_OUTPUT_STRING}`
						didAddOutput = true
					}
					// handle cases where we receive empty command_output (ie when extension is relinquishing control over exit command button)
					const output = messages[j].text || ""
					if (output.length > 0) {
						combinedText += "\n" + output
					}
				}
				j++
			}

			// Add CRUD operation log if any were tracked
			if (crudOperations.length > 0) {
				const crudLogs = crudOperations.map(op => 
					`[${new Date(op.timestamp).toISOString()}] ${op.type.toUpperCase()} operation on ${op.path} (${op.automated ? 'automated' : 'confirmed'})`
				).join('\n')
				combinedText += `\n\nCRUD Operations Log:\n${crudLogs}`
			}

			combinedCommands.push({
				...messages[i],
				text: combinedText,
			})

			i = j - 1 // Move to the index just before the next command or end of array
		}
	}

	// Second pass: remove command_outputs and replace original commands with combined ones
	return messages
		.filter((msg) => !(msg.ask === "command_output" || msg.say === "command_output"))
		.map((msg) => {
			if (msg.type === "ask" && msg.ask === "command") {
				const combinedCommand = combinedCommands.find((cmd) => cmd.ts === msg.ts)
				return combinedCommand || msg
			}
			return msg
		})
}

export const COMMAND_OUTPUT_STRING = "Output:"
