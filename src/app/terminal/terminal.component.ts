import { Component, HostListener, OnInit } from "@angular/core";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { processor } from "./commands/processor";

@Component({
  selector: "app-terminal",
  standalone: true,
  imports: [],
  templateUrl: "./terminal.component.html",
  styleUrl: "./terminal.component.css",
})
export class TerminalComponent implements OnInit {
  private terminal!: Terminal;
  private fitAddon!: FitAddon;
  /** Holds input from the user. */
  private inputBuffer: string = "";
  /** Used to skip the terminal login. */
  private skipLogin: boolean = false;

  /* Action controls. */
  private isDragging: boolean = false;
  private isResizing: boolean = false;

  /* Track terminal shape, size, and position. */
  private headerHeight: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private startWidth: number = 0;
  private startHeight: number = 0;

  /* Stores credentials passed. NOT SAFE, used for testing. */
  private username: string = "";
  private password: string = "";

  ngOnInit(): void {
    this.updateHeaderHeight();

    // Create the terminal.
    this.terminal = new Terminal({
      cursorBlink: true,
      allowTransparency: true,
      // fontFamily: "'Consolas', 'Monaco', 'Lucida Console', monospace",
    });
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Sets up the initial terminal.
    const element = document.getElementById("terminal-container");
    if (element) {
      const rect = element.getBoundingClientRect();
      this.currentX = rect.left;
      this.currentY = rect.top;
      this.terminal.open(element);
      this.fixWindow(false);
      this.terminal.write(this.skipLogin ? "> " : "login: ");
    }

    // Processes user input.
    this.terminal.onData((data) => {
      if (data === "\x7f" || data === "\x08") {
        this.handleBackspace();
      } else {
        this.handleInput(data);
      }
    });
  }

  /**
   * Checks if the user is logged in currently.
   * @returns {boolean} Returns true, if logged in, false otherwise.
   */
  private isLoggedIn(): boolean {
    return this.skipLogin || (this.username !== "" && this.password !== "");
  }

  /**
   * Handles the user pressing the backspace instead of typing.
   */
  private handleBackspace(): void {
    // Remove the last character from the input buffer.
    this.inputBuffer = this.inputBuffer.slice(0, -1);

    // Move the cursor back one position.
    this.terminal.write("\b \b");
  }

  /**
   * Handles additional input provided by the user.
   * @param {string} data - Character typed within the terminal.
   */
  private handleInput(data: string): void {
    this.inputBuffer += data;

    // Write the character back to the terminal to be seen.
    // Currently disabled if they are typing in a password.
    if (this.username === "" || this.isLoggedIn()) {
      this.terminal.write(data);
    }

    // Check if 'Enter' was pressed
    if (data !== "\r" && data !== "\n") return;

    // Process normal user input.
    this.processInput(this.inputBuffer.trim());
    this.inputBuffer = "";
  }

  /**
   * Processes user input to fill in credentials provided.
   * @param {string} input - Input provided by the user.
   */
  private processLogin(input: string): void {
    if (this.username === "") {
      this.username = input;
      this.terminal.write("\npassword: ");
      return;
    }

    this.password = input;
    this.terminal.write("\r\n> ");
  }

  /**
   * Processes input supplied by the user.
   * @param {string} input - Input provided by the user.
   */
  private processInput(input: string): void {
    // Process login data.
    if (!this.isLoggedIn()) return this.processLogin(input);

    // Process a command.
    let response: string = processor(this.terminal, input);
    if (response !== "") {
      // Send the response to the user.
      this.terminal.writeln(`\r\n${response}`);
    }
    this.terminal.write("> ");
  }

  /**
   * Updates the header height for the window.
   */
  private updateHeaderHeight(): void {
    const headerElement = document.getElementById("terminal-header");
    if (headerElement) {
      this.headerHeight = headerElement.offsetHeight;
    }
  }

  /**
   * Updates the position for the terminal window.
   */
  private updateWindowPosition(): void {
    const element = document.getElementById("terminal-window");
    if (element) {
      element.style.left = `${this.currentX}px`;
      element.style.top = `${this.currentY}px`;
    }
  }

  /**
   * Triggered when first moving the terminal window.
   * @param {MouseEvent} event - Mouse event for the dragging.
   */
  onDragStart(event: MouseEvent): void {
    if (this.isResizing) return;

    this.isDragging = true;
    this.startX = event.clientX - this.currentX;
    this.startY = event.clientY - this.currentY;
  }

  /**
   * Triggered when moving the terminal window. Updates the positioning.
   * @param {MouseEvent} event - Mouse event for the dragging.
   */
  onDragMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.currentX = event.clientX - this.startX;
    this.currentY = event.clientY - this.startY;
    this.updateWindowPosition();
  }

  /**
   * Triggered when no longer moving the terminal window. Updates the terminal.
   */
  onDragEnd(): void {
    this.isDragging = false;
    this.fixWindow(false);
  }

  /**
   * Triggered when first resizing the terminal window.
   * @param {MouseEvent} event - Mouse event for the resizing.
   */
  onResizeStart(event: MouseEvent): void {
    if (this.isDragging) return;

    this.isResizing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const windowElement = document.getElementById("terminal-window");
    if (windowElement) {
      this.startWidth = windowElement.offsetWidth;
      this.startHeight = windowElement.offsetHeight;
    }

    event.preventDefault();
  }

  /**
   * Triggered when resizing the terminal window. Updates the positioning.
   * @param {MouseEvent} event - Mouse event for the resizing.
   */
  onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    const element = document.getElementById("terminal-window");
    if (element) {
      element.style.width = `${this.startWidth + dx}px`;
      element.style.height = `${this.startHeight + dy}px`;
    }
    this.fixWindow(true);
  }

  /**
   * Triggered when no longer resizing the terminal window. Updates the terminal.
   */
  onResizeEnd(): void {
    this.isResizing = false;
    this.fixWindow(true);
  }

  /**
   * Corrects the terminal within the window be proper dimensions.
   */
  private fixTerminalContainer(): void {
    this.updateHeaderHeight();
    const window = document.getElementById("terminal-window");
    const terminal = document.getElementById("terminal-container");

    // Adjust to account for the header / title bar.
    if (window && terminal) {
      const windowHeight = window.offsetHeight;
      terminal.style.height = `${windowHeight - this.headerHeight - 1}px`;
    }
  }

  private redrawTerminal(): void {
    const terminalElement = document.getElementById("terminal-container");
    if (terminalElement) {
      terminalElement.style.display = "none";
      setTimeout(() => {
        terminalElement.style.display = "block";
        this.fitAddon.fit();
      }, 0);
    }
  }

  /**
   * Fixes the terminal window after being modified.
   * @param {boolean} resize - True if the action being called after resizing.
   */
  private fixWindow(resize: boolean): void {
    this.fixTerminalContainer();
    setTimeout(() => {
      this.fitAddon.fit();
    }, 0);

    // if (resize) this.redrawTerminal();
  }

  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event) {
    this.fixWindow(true);
  }
}
