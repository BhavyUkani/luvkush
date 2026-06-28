import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "lk-forbidden",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: "./forbidden.component.html",
  styleUrls: ["./forbidden.component.scss"]
})
export class ForbiddenComponent {}