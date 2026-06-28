import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "lk-about",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: "./about.component.html",
  styleUrls: ["./about.component.scss"]
})
export class AboutComponent {
  readonly values = [
    {
      icon: '🌿',
      title: '100% Natural',
      desc: 'Every ingredient is botanical, sourced from trusted farms across India with full supply chain traceability.'
    },
    {
      icon: '🔬',
      title: 'Lab Verified',
      desc: 'Each batch is tested for purity and potency before it reaches you. No compromises on quality standards.'
    },
    {
      icon: '🙌',
      title: 'Customer First',
      desc: 'If you are not satisfied, we make it right. No questions asked. Your trust is our most prized possession.'
    },
    {
      icon: '🌍',
      title: 'Sustainably Sourced',
      desc: 'We partner with small farms and use eco-friendly packaging — because what is good for you should also be good for the planet.'
    }
  ];
}
