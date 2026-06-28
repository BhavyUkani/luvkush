import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "lk-shipping-policy",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: "./shipping-policy.component.html",
  styleUrls: ["./shipping-policy.component.scss"]
})
export class ShippingPolicyComponent {}