import { Terminal } from "xterm";

/**
 * Paramenter include inside of a ICommand.
 */
class Param {
  name: string = "";
  description: string = "";
  optional: boolean = false;
  // Stores the value passed.
  value: string = "";
}

/**
 * Basic structure of a command.
 */
export interface ICommand {
  // Command used to trigger the command.
  cmd: string;
  // Long name of the command.
  name: string;
  description: string;
  // Parameters that are required to operate the command.
  params: Param[];
}

/**
 * Command that can be used to by the terminal component.
 */
export class Command {
  /** String used to trigger the command. */
  cmd: string = "";
  /** Name of the command. */
  name: string = "";
  /** Description of the command. */
  description: string = "";
  /** Parameters passed to the command. */
  params: Param[] = [];

  /**
   * Creates a command from default data.
   * @param {ICommand} values - Default values to use for the commmand.
   */
  constructor(values: ICommand) {
    this.cmd = values.cmd;
    this.name = values.name;
    this.description = values.description;
    this.params = values.params;
  }

  /**
   * Parses data in the form of a slice into a Command.
   * @param {ICommand} defaults - Default command with not user values added.
   * @param {string[]} data - Data to be parsed and placed as values received.
   * @returns {Command} Newly created command from the defaults and parsed data.
   */
  static from_slice(defaults: ICommand, data: string[]): Command {
    let cmd = new Command(defaults);
    for (var idx = 0; idx < data.length; idx++) {
      if (idx >= cmd.params.length) break;
      cmd.params[idx].value = data[idx];
    }

    return cmd;
  }

  /**
   * Gets the help message for the Command.
   * @returns {string} Returns the help message for the Command.
   */
  public to_help(): string {
    if (this.cmd !== "help") {
      return `${this.name}, [${this.cmd}] ${this.description}`;
    }

    let values: string[] = [];
    for (let [key, value] of Object.entries(COMMANDS)) {
      values.push(`${value.name}, [${value.cmd}] ${value.description}`);
    }

    return values.join("\n\r");
  }

  /**
   * Converts the Command to a string representation.
   * @returns {string} Returns the string representation for the Command.
   */
  public to_string(): string {
    return `Doing some task as: ${this.name}`;
  }

  /**
   * Executes the command.
   * @param {Terminal} terminal - Terminal the command was typed in.
   * @returns The result from execution of the command.
   */
  public execute(terminal: Terminal): string {
    let output: string = "Command complete.";

    switch (this.cmd) {
      case "clear":
        terminal.reset();
        return "";
      default:
        break;
    }

    return output;
  }
}

/** Type used to define the dictionary. */
export type Commands = { [key: string]: ICommand };
/** Dictionary holding all of the possible commands. */
export const COMMANDS: Commands = {
  help: {
    cmd: "help",
    name: "Help",
    description: "Shows help message for commands.",
    params: [
      {
        name: "command",
        description: "Command to look up.",
        optional: true,
        value: "",
      },
    ],
  },
  account: {
    cmd: "account",
    name: "Account",
    description: "Shows account information.",
    params: [],
  },
  clear: {
    cmd: "clear",
    name: "Clear",
    description: "Clears the terminal screen.",
    params: [],
  },
};
