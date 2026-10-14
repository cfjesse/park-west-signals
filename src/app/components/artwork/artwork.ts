import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  Chart,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { ArtworkApi } from '../../services/artwork.api';
import { ArtistData, ArtistDisplayData } from '../../interfaces/app.interface';
import { ArtistDialog } from '../artist-dialog/artist-dialog';

Chart.register(
  DoughnutController,
  ArcElement,
  CategoryScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  LinearScale,
  Tooltip,
  Legend
);

const DYNAMIC_PALETTE = [
  '#2563eb', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b',
  '#3b82f6', '#d97706', '#6366f1', '#0ea5e9', '#22c55e',
  '#f97316', '#a855f7', '#84cc16', '#e11d48', '#0284c7'
];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  titleFont: { size: 13, weight: 'bold' as const },
  bodyFont: { size: 12 },
  cornerRadius: 8,
};

function aggregateCategories(items: ArtistData[]) {
  const media: Record<string, number> = {};
  const style: Record<string, number> = {};
  for (const item of items) {
    if (item.media) media[item.media] = (media[item.media] || 0) + 1;
    if (item.style) style[item.style] = (style[item.style] || 0) + 1;
  }
  return { media, style };
}

@Component({
  imports: [
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
  ],
  selector: 'app-artwork',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './artwork.scss',
  templateUrl: './artwork.html',
})
export class Artwork {
  private dialog = inject(MatDialog);
  private artworkApi = inject(ArtworkApi);
  private destroyRef = inject(DestroyRef);
  private artworkListApiResource = this.artworkApi.artworkListResource;

  // Signal holding all artworks from API resource
  readonly artworkList = computed(() => this.artworkListApiResource.value() || []);

  // Filter signals
  selectedMedia = signal<string>('');
  selectedStyle = signal<string>('');

  // Overall catalog metrics for dropdown options
  readonly catalogMetrics = computed(() => aggregateCategories(this.artworkList()));

  readonly mediaOptions = computed(() =>
    Object.entries(this.catalogMetrics().media)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ key, label: key, count }))
  );

  readonly styleOptions = computed(() =>
    Object.entries(this.catalogMetrics().style)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ key, label: key, count }))
  );

  // Filtered artworks reacting to active dropdown filters
  readonly filteredArtworks = computed<ArtistData[]>(() => {
    const list = this.artworkList();
    const media = this.selectedMedia();
    const style = this.selectedStyle();
    if (!media && !style) return list;
    return list.filter((art) => (!media || art.media === media) && (!style || art.style === style));
  });

  // Artworks with valid prices, sorted ascending by price
  readonly sortedPriceArtworks = computed(() =>
    this.filteredArtworks()
      .filter((art) => art.price != null)
      .sort((a, b) => a.price - b.price)
  );

  // Dynamic priceList signal: sorted array of prices from filtered artworks
  readonly priceList = computed<number[]>(() =>
    this.sortedPriceArtworks().map((art) => art.price)
  );

  // Price summary metrics derived dynamically from priceList()
  readonly lowestPrice = computed(() => this.priceList()[0] || null);
  readonly highestPrice = computed(() => this.priceList()[this.priceList().length - 1] || null);
  readonly averagePrice = computed(() => {
    const prices = this.priceList();
    return prices.length ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) : null;
  });
  readonly medianPrice = computed(() => {
    const prices = this.priceList();
    if (!prices.length) return null;
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 !== 0 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
  });

  // Filtered metrics for mediums and styles
  readonly metricsDisplayData = computed(() => aggregateCategories(this.filteredArtworks()));

  // Grouped filtered artists and the pieces they have in the selected category
  readonly filteredArtists = computed<ArtistDisplayData[]>(() => {
    const artworks = this.filteredArtworks();
    if (!artworks.length) return [];

    const map = new Map<string, ArtistDisplayData>();
    for (const art of artworks) {
      const key = art.artist_id || art.artist_name;
      let artist = map.get(key);
      if (!artist) {
        artist = {
          artist_name: art.artist_name,
          artist_avatar: art.artist_avatar?.replace(/300/, '60'),
          artist_bio: art.artist_bio,
          artist_id: art.artist_id,
          artworks: [],
        };
        map.set(key, artist);
      }
      artist.artworks.push({
        id: art.id,
        title: art.title,
        media: art.media,
        style: art.style,
        date_created: art.date_created,
        price: art.price,
        size: art.size,
      });
    }
    return Array.from(map.values());
  });

  // Total counts
  readonly totalAllPiecesCount = linkedSignal(() => this.artworkList().length);
  readonly totalPiecesCount = linkedSignal(() => this.filteredArtworks().length);
  readonly totalMediaCount = linkedSignal(() => Object.keys(this.metricsDisplayData().media).length);
  readonly totalStylesCount = linkedSignal(() => Object.keys(this.metricsDisplayData().style).length);
  readonly totalAllArtistsCount = linkedSignal(() => new Set(this.artworkList().map((a) => a.artist_id || a.artist_name)).size);
  readonly isFiltered = computed(() => !!this.selectedMedia() || !!this.selectedStyle());

  // Filter interaction
  onMediaChange(media: string): void {
    this.selectedMedia.set(media);
  }

  onStyleChange(style: string): void {
    this.selectedStyle.set(style);
  }

  toggleMediaFilter(media: string): void {
    this.selectedMedia.update((curr) => (curr === media ? '' : media));
  }

  toggleStyleFilter(style: string): void {
    this.selectedStyle.update((curr) => (curr === style ? '' : style));
  }

  clearFilters(): void {
    this.selectedMedia.set('');
    this.selectedStyle.set('');
  }

  // Chart view children
  mediaChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('mediaChartCanvas');
  styleChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('styleChartCanvas');
  priceChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('priceChartCanvas');

  private charts = new Map<string, Chart>();

  constructor() {
    // Reactively update all charts whenever filter signals or filteredArtworks change
    effect(() => {
      const mediaEl = this.mediaChartCanvas()?.nativeElement;
      const styleEl = this.styleChartCanvas()?.nativeElement;
      const priceEl = this.priceChartCanvas()?.nativeElement;
      if (!mediaEl || !styleEl || !priceEl) return;

      const { media, style } = this.metricsDisplayData();
      this.renderDoughnut('media', mediaEl, media, 0, (label) => this.toggleMediaFilter(label));
      this.renderDoughnut('style', styleEl, style, 4, (label) => this.toggleStyleFilter(label));
      this.renderPriceLine(priceEl, this.sortedPriceArtworks());
    });

    this.destroyRef.onDestroy(() => {
      this.charts.forEach((chart) => chart.destroy());
      this.charts.clear();
    });
  }

  private renderDoughnut(
    id: string,
    canvas: HTMLCanvasElement,
    dataMap: Record<string, number>,
    paletteOffset: number,
    onSliceClick: (label: string) => void
  ): void {
    const labels = Object.keys(dataMap);
    const data = Object.values(dataMap);
    const backgroundColor = labels.map((_, i) => DYNAMIC_PALETTE[(i + paletteOffset) % DYNAMIC_PALETTE.length]);
    const chart = this.charts.get(id);

    if (chart && chart.canvas === canvas) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = backgroundColor;
      chart.update();
      return;
    }

    chart?.destroy();
    this.charts.set(
      id,
      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor, borderWidth: 2, borderColor: '#ffffff', hoverOffset: 6 }],
        },
        options: this.getDoughnutChartOptions(onSliceClick),
      })
    );
  }

  private renderPriceLine(canvas: HTMLCanvasElement, artworks: ArtistData[]): void {
    const data = artworks.map((art, i) => ({
      x: i + 1,
      y: art.price,
      title: art.title,
      artist: art.artist_name,
    }));
    const chart = this.charts.get('price');

    if (chart && chart.canvas === canvas) {
      chart.data.datasets[0].data = data;
      chart.update();
      return;
    }

    chart?.destroy();
    this.charts.set(
      'price',
      new Chart(canvas, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Artwork Price Curve',
            data,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: artworks.length > 50 ? 0 : 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#059669',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          }],
        },
        options: this.getLineChartOptions(),
      })
    );
  }

  private getDoughnutChartOptions(onSliceClick: (label: string) => void): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_event, elements, chart) => {
        const index = elements[0]?.index;
        const label = index != null ? (chart.data.labels?.[index] as string) : undefined;
        if (label) onSliceClick(label);
      },
      onHover: (event, elements) => {
        const target = event.native?.target as HTMLElement | undefined;
        if (target) target.style.cursor = elements.length ? 'pointer' : 'default';
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 10,
            boxWidth: 8,
            boxHeight: 8,
            font: { family: 'Roboto, sans-serif', size: 11, weight: 'bold' },
            color: '#334155',
          },
        },
        tooltip: {
          ...TOOLTIP_STYLE,
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} pieces`,
          },
        },
      },
      cutout: '35%',
      animation: { duration: 500 },
    };
  }

  private getLineChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false, axis: 'x' },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_STYLE,
          padding: 12,
          callbacks: {
            title: (items: any[]) => items[0]?.raw?.title || 'Artwork',
            label: (ctx: any) => {
              const { y, artist } = ctx.raw || {};
              const price = y ?? ctx.parsed?.y ?? 0;
              return `${artist ? ` by ${artist}` : ''} • $${Number(price).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Artworks (Ranked by Price)', color: '#334155', font: { size: 11, weight: 'bold' } },
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', precision: 0 },
        },
        y: {
          title: { display: true, text: 'Price ($)', color: '#334155', font: { size: 11, weight: 'bold' } },
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', callback: (val) => `$${Number(val).toLocaleString()}` },
        },
      },
      animation: { duration: 500 },
    };
  }

  openEditModal(artist: ArtistDisplayData): void {
    this.dialog.open(ArtistDialog, {
      data: artist,
      width: '580px',
      maxWidth: '95vw',
    });
  }
}
