import { Injectable, computed, signal } from '@angular/core';
import { httpResource, HttpErrorResponse } from '@angular/common/http';
import { ApiError, Artist, ArtistData } from '../interfaces/app.interface';

@Injectable({
  providedIn: 'root',
})
export class ArtworkApi {
  private readonly artworksUrl = '/api/artworks';
  private readonly artistsUrl = '/api/artists';

  /**
   * Default resource fetching all artworks in the gallery with artist details.
   */
  readonly artworkListResource = httpResource<ArtistData[]>(() => ({
    url: this.artworksUrl,
    method: 'GET',
  }));

  /**
   * Reactive payload signal to trigger an update for an artist.
   */
  readonly updateArtistPayload = signal<{ id: string; body: Partial<Artist> } | undefined>(undefined);

  /**
   * Reactive update resource using httpResource with PATCH method and JSON payload.
   */
  readonly updateArtistResource = httpResource<Artist>(() => {
    const payload = this.updateArtistPayload();
    if (!payload) return undefined;
    return {
      url: `${this.artistsUrl}/${payload.id}`,
      method: 'PATCH',
      body: payload.body,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  });

  /**
   * Formatted error message derived reactively from updateArtistResource.error().
   */
  readonly updateError = computed<string | null>(() => {
    const err = this.updateArtistResource.error() as HttpErrorResponse | null;
    if (!err) return null;
    const api = err.error as ApiError | undefined;
    if (Array.isArray(api?.details) && api.details.length) {
      return (api.details as string[]).join(', ');
    }
    return api?.error || err.message || 'Failed to update artist';
  });

  /**
   * Trigger an artist update request via signals.
   */
  updateArtist(id: string, body: Partial<Artist>) {
    this.updateArtistPayload.set({ id, body });
  }

  /**
   * Reset update state.
   */
  resetUpdate() {
    this.updateArtistPayload.set(undefined);
  }
}
