export const getBaseTools = (cwd: string): string => {
    let tools = "";

    // Execute Command
    tools += "## execute_command\n";
    tools += "Description: Execute a CLI command on the system. All commands are executed automatically.\n";
    tools += "Parameters:\n";
    tools += "- command: (required) The CLI command to execute\n";
    tools += "Usage: <execute_command><command>command here</command></execute_command>\n\n";

    // Read File
    tools += "## read_file\n";
    tools += "Description: Read file contents. All reads are executed automatically.\n";
    tools += "Parameters:\n";
    tools += "- path: (required) File path relative to " + cwd + "\n";
    tools += "Usage: <read_file><path>path here</path></read_file>\n\n";

    // Write File
    tools += "## write_to_file\n";
    tools += "Description: Write content to a file. All writes are executed automatically.\n";
    tools += "Parameters:\n";
    tools += "- path: (required) File path relative to " + cwd + "\n";
    tools += "- content: (required) Complete file content\n";
    tools += "Usage: <write_to_file><path>path</path><content>content
