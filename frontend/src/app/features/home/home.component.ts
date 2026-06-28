import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { SeoService } from "../../core/services/seo.service";
import { HeroComponent } from "./components/hero/hero.component";
import { CategoryGridComponent } from "./components/category-grid/category-grid.component";
import { BestSellersComponent } from "./components/best-sellers/best-sellers.component";
import { HairSolutionsListComponent } from "./components/hair-solutions-list/hair-solutions-list.component";
import { IngredientsShowcaseComponent } from "./components/ingredients-showcase/ingredients-showcase.component";
import { WisdomSectionComponent } from "./components/wisdom-section/wisdom-section.component";
import { WhyChooseUsComponent } from "./components/why-choose-us/why-choose-us.component";
import { TestimonialsComponent } from "./components/testimonials/testimonials.component";

@Component({
  selector: "lk-home",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroComponent,
    CategoryGridComponent,
    BestSellersComponent,
    HairSolutionsListComponent,
    IngredientsShowcaseComponent,
    WisdomSectionComponent,
    WhyChooseUsComponent,
    TestimonialsComponent
  ],
  template: `
    <lk-hero />
    <lk-category-grid />
    <lk-best-sellers />
    <lk-ingredients-showcase />
    <lk-wisdom-section />
    <lk-why-choose-us />
    <lk-hair-solutions-list
      title="Premium Hair Wigs"
      subtitle="Undetectable natural hairlines, custom-crafted for you"
      type="wig"
      viewAllLink="/hair-wigs"
    />
    <lk-hair-solutions-list
      title="Custom Hair Patches"
      subtitle="Seamless coverage and instant density where you need it"
      type="patch"
      viewAllLink="/hair-patches"
    />
    <lk-testimonials />
  `
})
export class HomeComponent {
  constructor() {
    inject(SeoService).updateSeo({
      title: "Luv Kush Natural — Ayurvedic Hair Care & Beauty",
      description: "Premium Ayurvedic hair care, hair wigs and hair patches. 100% natural ingredients. Free delivery on orders above Rs.499.",
      keywords: "Ayurvedic hair care, natural hair oil, hair wig India, hair patch, bhringraj, amla"
    });
  }
}
