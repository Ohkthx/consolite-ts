import { Component } from "@angular/core";
import { TerminalComponent } from "../terminal/terminal.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [CommonModule, TerminalComponent],
  templateUrl: "./icon.component.html",
  styleUrl: "./icon.component.css",
})
export class IconComponent {
  /** Controls the viewing of the terminal. */
  showTerminal: boolean = false;

  /* Triggers the showing and hiding of the terminal component. */
  onIconDoubleClick(): void {
    this.showTerminal = !this.showTerminal;
  }
}
