import { Injectable, computed, signal } from '@angular/core';
import { httpResource, HttpErrorResponse } from '@angular/common/http';
import { ApiError, Artist, ArtistData } from '../interfaces/app.interface';

@Injectable({
  providedIn: 'root',
})
export class ArtworkApi {
  private readonly artworksUrl = '/api/artworks';
  private readonly artistsUrl = '/api/artists';

  readonly artworkListResource = httpResource<ArtistData[]>(() => ({
    url: this.artworksUrl,
    method: 'GET',
  }));

  readonly updateArtistPayload = signal<{ id: string; body: Partial<Artist> } | undefined>(undefined);

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

  readonly updateError = computed<string | null>(() => {
    const err = this.updateArtistResource.error() as HttpErrorResponse | null;
    if (!err) return null;
    const api = err.error as ApiError | undefined;
    if (Array.isArray(api?.details) && api.details.length) {
      return (api.details as string[]).join(', ');
    }
    return api?.error || err.message || 'Failed to update artist';
  });

  updateArtist(id: string, body: Partial<Artist>) {
    this.updateArtistPayload.set({ id, body });
  }

  resetUpdate() {
    this.updateArtistPayload.set(undefined);
  }
}
