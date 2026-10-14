import { DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
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
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { ArtworkApi } from '../../services/artwork.api';
import { ArtistData, ArtistDisplayData, Metrics } from '../../interfaces/app.interface';
import { ArtistDialog } from '../artist-dialog/artist-dialog';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

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
  styleUrl: './artwork.scss',
  templateUrl: './artwork.html',
})
export class Artwork {
  private dialog = inject(MatDialog);
  private artworkApi = inject(ArtworkApi);
  private destroyRef = inject(DestroyRef);
  private artworkListApiResource = this.artworkApi.artworkListResource;

  readonly artworkList = computed(() => this.artworkListApiResource.value() || []);

  readonly displayData = computed<ArtistDisplayData[]>(() => {
    const list = this.artworkList();
    if (!list || list.length === 0) return [];

    const map = new Map<string, ArtistDisplayData>();
    for (const artwork of list) {
      const key = artwork.artist_id || artwork.artist_name;
      let artist = map.get(key);
      if (!artist) {
        artist = {
          artist_name: artwork.artist_name,
          artist_avatar: artwork.artist_avatar?.replace(/300/, '60'),
          artist_bio: artwork.artist_bio,
          artist_id: artwork.artist_id,
          artworks: [],
        };
        map.set(key, artist);
      }
      artist.artworks.push({
        id: artwork.id,
        title: artwork.title,
        media: artwork.media,
        style: artwork.style,
        date_created: artwork.date_created,
        price: artwork.price,
        size: artwork.size,
      });
    }
    return Array.from(map.values());
  });

  readonly metricsDisplayData = computed<Metrics>(() => {
    const list = this.artworkList();
    const metrics: Metrics = { style: {}, media: {} };
    for (const artwork of list) {
      if (artwork.style) {
        metrics.style[artwork.style] = (metrics.style[artwork.style] || 0) + 1;
      }
      if (artwork.media) {
        metrics.media[artwork.media] = (metrics.media[artwork.media] || 0) + 1;
      }
    }
    return metrics;
  });

  selectedMedia = signal<string>('');
  selectedStyle = signal<string>('');

  readonly mediaOptions = computed(() => {
    const mediaObj = this.metricsDisplayData().media;
    return Object.keys(mediaObj).sort().map((key) => ({
      key,
      label: key,
      count: mediaObj[key],
    }));
  });

  readonly styleOptions = computed(() => {
    const styleObj = this.metricsDisplayData().style;
    return Object.keys(styleObj).sort().map((key) => ({
      key,
      label: key,
      count: styleObj[key],
    }));
  });

  readonly filteredArtists = computed<ArtistDisplayData[]>(() => {
    const allArtists = this.displayData();
    const mediaFilter = this.selectedMedia();
    const styleFilter = this.selectedStyle();

    if (!mediaFilter && !styleFilter) {
      return allArtists;
    }

    return allArtists
      .map((artist) => {
        const matchingArtworks = artist.artworks.filter((art) => {
          const matchMedia = !mediaFilter || art.media === mediaFilter;
          const matchStyle = !styleFilter || art.style === styleFilter;
          return matchMedia && matchStyle;
        });

        if (matchingArtworks.length === 0) return null;

        return {
          ...artist,
          artworks: matchingArtworks,
        };
      })
      .filter((artist): artist is ArtistDisplayData => artist !== null);
  });

  onMediaChange(media: string): void {
    this.selectedMedia.set(media);
  }

  onStyleChange(style: string): void {
    this.selectedStyle.set(style);
  }

  clearFilters(): void {
    this.selectedMedia.set('');
    this.selectedStyle.set('');
  }

  readonly totalMediaCount = computed(() => Object.keys(this.metricsDisplayData().media).length);
  readonly totalStylesCount = computed(() => Object.keys(this.metricsDisplayData().style).length);
  readonly totalPiecesCount = computed(() => {
    const styleCounts = Object.values(this.metricsDisplayData().style);
    return styleCounts.reduce((acc, count) => acc + count, 0);
  });

  mediaChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('mediaChartCanvas');
  styleChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('styleChartCanvas');

  private mediaChart: Chart | null = null;
  private styleChart: Chart | null = null;

  constructor() {
    // 1. Reactively update charts whenever metricsDisplayData signal updates
    effect(() => {
      const metrics = this.metricsDisplayData();
      const mediaEl = this.mediaChartCanvas()?.nativeElement;
      const styleEl = this.styleChartCanvas()?.nativeElement;

      if (!mediaEl || !styleEl) return;
      if (Object.keys(metrics.media).length === 0 && Object.keys(metrics.style).length === 0) return;

      this.updateCharts(metrics, mediaEl, styleEl);
    });

    this.destroyRef.onDestroy(() => {
      this.mediaChart?.destroy();
      this.styleChart?.destroy();
    });
  }

  private updateCharts(metrics: Metrics, mediaCanvas: HTMLCanvasElement, styleCanvas: HTMLCanvasElement) {
    const mediaLabels = Object.keys(metrics.media);
    const mediaData = Object.values(metrics.media);

    const styleLabels = Object.keys(metrics.style);
    const styleData = Object.values(metrics.style);

    // Media Chart
    if (this.mediaChart && this.mediaChart.canvas === mediaCanvas) {
      this.mediaChart.data.labels = mediaLabels;
      this.mediaChart.data.datasets[0].data = mediaData;
      this.mediaChart.update();
    } else {
      this.mediaChart?.destroy();
      this.mediaChart = new Chart(mediaCanvas, {
        type: 'doughnut',
        data: {
          labels: mediaLabels,
          datasets: [{
            data: mediaData,
            backgroundColor: [
              '#2563eb', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b',
              '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
          }],
        },
        options: this.getChartOptions(),
      });
    }

    // Style Chart
    if (this.styleChart && this.styleChart.canvas === styleCanvas) {
      this.styleChart.data.labels = styleLabels;
      this.styleChart.data.datasets[0].data = styleData;
      this.styleChart.update();
    } else {
      this.styleChart?.destroy();
      this.styleChart = new Chart(styleCanvas, {
        type: 'doughnut',
        data: {
          labels: styleLabels,
          datasets: [{
            data: styleData,
            backgroundColor: [
              '#6366f1', '#0ea5e9', '#14b8a6', '#22c55e', '#eab308',
              '#f97316', '#f43f5e', '#a855f7', '#3b82f6', '#64748b'
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
          }],
        },
        options: this.getChartOptions(),
      });
    }
  }

  private getChartOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            boxWidth: 8,
            boxHeight: 8,
            font: {
              family: 'Roboto, "Helvetica Neue", sans-serif',
              size: 11,
              weight: 'bold',
            },
            color: '#334155',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => ` ${context.label}: ${context.raw} pieces`,
          },
        },
      },
      cutout: '35%',
      animation: {
        duration: 750,
      },
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
