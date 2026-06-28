import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "lk-server-error",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: "./server-error.component.html",
  styleUrls: ["./server-error.component.scss"]
})
export class ServerErrorComponent {}