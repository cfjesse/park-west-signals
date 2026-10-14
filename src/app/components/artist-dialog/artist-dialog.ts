import { Component, computed, effect, inject, linkedSignal, signal, untracked } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Artist, ArtistDisplayData } from '../../interfaces/app.interface';
import { ArtworkApi } from '../../services/artwork.api';

@Component({
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-artist-dialog',
  templateUrl: './artist-dialog.html',
  styleUrl: './artist-dialog.scss',
})
export class ArtistDialog {
  readonly artistData = signal<ArtistDisplayData>(inject(MAT_DIALOG_DATA));
  get artist(): ArtistDisplayData {
    return this.artistData();
  }

  readonly dialogRef = inject(MatDialogRef<ArtistDialog>);
  private artworkApi = inject(ArtworkApi);


  readonly formData = linkedSignal({
    source: this.artistData,
    computation: (artist) => ({
      name: artist?.artist_name || '',
      avatar: artist?.artist_avatar || '',
      bio: artist?.artist_bio || '',
    }),
  });

  readonly localError = linkedSignal({
    source: this.formData,
    computation: () => null as string | null,
  });

  readonly updateError = computed(() => this.localError() || this.artworkApi.updateError());
  readonly isSubmitting = signal<boolean>(false);
  readonly isSaving = computed(
    () => this.isSubmitting() || this.artworkApi.updateArtistResource.isLoading()
  );

  constructor() {
    this.artworkApi.resetUpdate();

    effect(() => {
      if (!this.isSubmitting()) return;

      const status = this.artworkApi.updateArtistResource.status();
      if (status === 'resolved') {
        untracked(() => {
          this.isSubmitting.set(false);
          this.artworkApi.artworkListResource.reload();
          this.dialogRef.close(true);
        });
      } else if (status === 'error') {
        untracked(() => {
          this.isSubmitting.set(false);
          this.dialogRef.disableClose = false;
        });
      }
    });
  }

  updateField(field: 'name' | 'avatar' | 'bio', event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.formData.update((d) => ({ ...d, [field]: target.value }));
  }

  saveEdit(): void {
    if (!this.artist?.artist_id) return;

    const form = this.formData();
    if (!form.name || form.name.trim() === '') {
      this.localError.set('Artist name is required');
      return;
    }

    this.isSubmitting.set(true);
    this.dialogRef.disableClose = true;

    const payload: Partial<Artist> = {
      name: form.name.trim(),
    };
    if (form.avatar && form.avatar.trim()) {
      payload.avatar = form.avatar.trim();
    }
    if (form.bio !== undefined) {
      payload.bio = form.bio.trim();
    }

    this.artworkApi.updateArtist(this.artist.artist_id, payload);
  }
}
