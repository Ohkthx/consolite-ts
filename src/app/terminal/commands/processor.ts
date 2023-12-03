import { Terminal } from "xterm";
import { COMMANDS, Command, Commands, ICommand } from "./commands";

/**
 * Extracts a value from the dictionary.
 * @param {Commands} dictionary - Dictionary to extract a value from.
 * @param {string} key - Key to search for.
 * @returns {ICommand | undefined} Returns the ICommand if found, otherwise undefined.
 */
function getValue(dictionary: Commands, key: string): ICommand | undefined {
  if (key in dictionary) {
    return dictionary[key];
  } else {
    return undefined;
  }
}

/**
 * Parses data provided to identify the command and executes the command.
 * @param {Terminal} terminal - Terminal command was typed in.
 * @param {string} data - Data to be parsed.
 * @returns {string} The output from execution in string format.
 */
export function processor(terminal: Terminal, data: string): string {
  let parsed = data.split(" ");
  let value = getValue(COMMANDS, parsed[0]);
  if (value === undefined) {
    return `Unknown command: ${parsed[0]}`;
  }

  // Extract the help for another command.
  if (value.cmd == "help") {
    if (parsed.length > 1) {
      // Help command for another command.
      value = getValue(COMMANDS, parsed[1]);
      if (value === undefined) {
        return `Unknown help: ${parsed[1]}`;
      }
    }
    return new Command(value).to_help();
  }

  // Process the command.
  let cmd = Command.from_slice(value, parsed.slice(1));
  if (cmd === undefined) {
    return `Invalid command: ${parsed[0]}`;
  }

  return cmd.execute(terminal);
}
