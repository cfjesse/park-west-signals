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
import { Customer } from '../../interfaces/app.interface';
import { CustomerApi } from '../../services/customer.api';
import { InitialsPipe } from '../../pipes/initials-pipe';

@Component({
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    InitialsPipe,
  ],
  selector: 'app-customer-dialog',
  templateUrl: './customer-dialog.html',
  styleUrl: './customer-dialog.scss',
})
export class CustomerDialog {
  readonly customerData = signal<Customer>(inject(MAT_DIALOG_DATA));
  get customer(): Customer {
    return this.customerData();
  }

  readonly dialogRef = inject(MatDialogRef<CustomerDialog>);
  private customerApi = inject(CustomerApi);

  // Linked signal: Initializes and resets form data whenever underlying customer changes
  readonly formData = linkedSignal({
    source: this.customerData,
    computation: (c) => ({
      name: c?.name || '',
      email: c?.email || '',
      phone: c?.phone || '',
      address: c?.address || '',
      credit: c?.credit ?? 0,
      age: c?.age ?? 30,
    }),
  });

  // Linked signal: Automatically clears validation errors whenever the user modifies form fields
  readonly localError = linkedSignal({
    source: this.formData,
    computation: () => null as string | null,
  });

  readonly updateError = computed(() => this.localError() || this.customerApi.updateError());
  readonly isSubmitting = signal<boolean>(false);
  readonly isSaving = computed(
    () => this.isSubmitting() || this.customerApi.updateCustomerResource.isLoading()
  );

  constructor() {
    this.customerApi.resetUpdate();

    effect(() => {
      if (!this.isSubmitting()) return;

      const status = this.customerApi.updateCustomerResource.status();
      if (status === 'resolved') {
        untracked(() => {
          this.isSubmitting.set(false);
          this.customerApi.customerListResource.reload();
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

  updateField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = field === 'credit' || field === 'age' ? Number(target.value) : target.value;
    this.formData.update((d) => ({ ...d, [field]: value }));
  }

  saveEdit(): void {
    if (!this.customer?.id) return;

    const form = this.formData();
    if (!form.name || form.name.trim() === '') {
      this.localError.set('Name is required');
      return;
    }
    if (!form.email || form.email.trim() === '') {
      this.localError.set('Email is required');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email.trim())) {
      this.localError.set('Please provide a valid email address (e.g. user@example.com)');
      return;
    }

    this.isSubmitting.set(true);
    this.dialogRef.disableClose = true;

    const payload: Partial<Customer> = {
      name: form.name.trim(),
      email: form.email.trim(),
      credit: Math.max(0, Math.round(Number(form.credit) || 0)),
      age: Math.min(150, Math.max(0, Math.round(Number(form.age) || 30))),
    };

    if (form.phone && form.phone.trim()) {
      payload.phone = form.phone.trim();
    }
    if (form.address && form.address.trim()) {
      payload.address = form.address.trim();
    }

    this.customerApi.updateCustomer(this.customer.id, payload);
  }
}
