import {
  Component, OnInit, Input, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { imageUrl } from '../../../../shared/utils/image-url';

export interface HairSolutionItem {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  mrp: number | null;
  primary_image: string | null;
  gender: string | null;
  size_info: string | null;
  colour_info: string | null;
}

@Component({
  selector: 'lk-hair-solutions-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './hair-solutions-list.component.html',
  styleUrls: ['./hair-solutions-list.component.scss']
})
export class HairSolutionsListComponent implements OnInit {
  private readonly api = inject(ApiService);

  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) type!: 'wig' | 'patch';
  @Input({ required: true }) viewAllLink!: string;

  items = signal<HairSolutionItem[]>([]);
  loading = signal(true);
  readonly imgUrl = imageUrl;

  ngOnInit(): void {
    const endpoint = this.type === 'wig' ? '/hair-solutions/wigs' : '/hair-solutions/patches';
    this.api.get<HairSolutionItem[]>(endpoint).subscribe({
      next: (res) => {
        this.items.set((res.data ?? []).slice(0, 8));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  trackById(_: number, item: HairSolutionItem): number {
    return item.id;
  }
}
