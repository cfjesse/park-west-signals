import { Injectable, computed, signal } from '@angular/core';
import { httpResource, HttpErrorResponse } from '@angular/common/http';
import { Customer, ApiError } from '../interfaces/app.interface';

@Injectable({
  providedIn: 'root',
})
export class CustomerApi {
  private readonly url = '/api/customers';

  readonly customerListResource = httpResource<Customer[]>(() => ({
    url: this.url,
    method: 'GET',
  }));

  /**
   * Reactive payload signal to trigger an update via httpResource.
   */
  readonly updatePayload = signal<{ id: string; body: Partial<Customer> } | undefined>(undefined);

  /**
   * Reactive update resource using httpResource with PATCH method and JSON payload.
   */
  readonly updateCustomerResource = httpResource<Customer>(() => {
    const payload = this.updatePayload();
    if (!payload) return undefined;
    return {
      url: `${this.url}/${payload.id}`,
      method: 'PATCH',
      body: payload.body,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  });

  /**
   * Formatted error message derived reactively from updateCustomerResource.error().
   */
  readonly updateError = computed<string | null>(() => {
    const err = this.updateCustomerResource.error() as HttpErrorResponse | null;
    if (!err) return null;
    const api = err.error as ApiError | undefined;
    if (Array.isArray(api?.details) && api.details.length) {
      return (api.details as string[]).join(', ');
    }
    return api?.error || err.message || 'Failed to update record';
  });

  /**
   * Trigger an update request via signals.
   */
  updateCustomer(id: string, body: Partial<Customer>) {
    this.updatePayload.set({ id, body });
  }

  /**
   * Reset update state.
   */
  resetUpdate() {
    this.updatePayload.set(undefined);
  }
}