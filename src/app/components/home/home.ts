import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, debounce, pattern, applyWhen } from '@angular/forms/signals';
import { Customer, SearchForm } from '../../interfaces/app.interface';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { CustomerApi } from '../../services/customer.api';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InitialsPipe } from '../../pipes/initials-pipe';
import { CustomerDialog } from '../customer-dialog/customer-dialog';

@Component({
  imports: [
    FormField,
    MatInput,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatRadioModule,
    MatTableModule,
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDialogModule,
    InitialsPipe,
    CurrencyPipe,
  ],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {

  private dialog = inject(MatDialog);
  readonly customersApi = inject(CustomerApi);
  readonly selectedView = signal<string>('card');
  readonly caseSensitive = signal<boolean>(false);
  readonly fuzzySearch = signal<boolean>(false);

  selectMenu = [
    {
      key: '',
      label: 'All Fields',
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'address',
      label: 'Address',
    },
    {
      key: 'credit',
      label: 'Credit',
    },
  ];

  search = signal<SearchForm>({
    keyword: '',
    filter: '',
  });

  searchForm = form(this.search, (path) => {
    minLength(path.keyword, 2, {
      message: 'Search term must be at least 2 characters long',
    });
    debounce(path.keyword, 400);

    applyWhen(
      path.keyword,
      () =>
        this.search().filter !== 'phone' &&
        this.search().filter !== 'credit',
      (keyword) => {
        pattern(keyword, /^[a-zA-Z0-9\s@.-]+$/, {
          message:
            'Search term can only contain letters, numbers, spaces, @, ., and -.',
        });
      }
    );

    applyWhen(
      path.keyword,
      () =>
        this.search().filter === 'phone' ||
        this.search().filter === 'credit',
      (keyword) => {
        pattern(keyword, /^[0-9-]+$/, {
          message: 'Search term must contain only numbers and hyphens.',
        });
      }
    );
  });

  protected readonly customersResource = this.customersApi.customerListResource;
  customerList = computed<Customer[]>(() => this.customersResource.value() || []);
  customerListFilterd = computed<Customer[]>(() => {
    const searchTerm = this.search();
    const customerList = this.customerList();
    const caseSensitive = this.caseSensitive();

    if (!searchTerm.keyword || searchTerm.keyword.length < 2) return customerList;

    return customerList.filter((customer) => {
      const searchKey = this.fuzzySearch() ? this.applyFuzzySearch(searchTerm.keyword) : searchTerm.keyword;

      const regex = new RegExp(searchKey, `g${caseSensitive ? '' : 'i'}`);
      if (searchTerm.filter === '') {
        const stringifiedData = JSON.stringify(customer).replace(/[\{\}\,\:"]+/g, '').trim();
        return regex.test(stringifiedData);
      } else {
        const value = customer[searchTerm.filter as keyof Customer];
        return value != null ? regex.test(String(value)) : false;
      }
    });
  });

  onViewChange(view: string): void {
    this.selectedView.set(view);
  }

  onCaseSensitiveChange(value: boolean): void {
    this.caseSensitive.set(value);
  }

  onRefresh(): void {
    this.customersResource.reload();
  }

  onFuzzySearchChange(checked: boolean): void {
    this.fuzzySearch.set(checked);
  }

  applyFuzzySearch(search: string): string {
    return search
      .split('')
      .map(char => `${char}.*`)
      .join('');
  }

  clearSearch(): void {
    this.search.update((s) => ({ ...s, keyword: '' }));
  }

  openEditModal(customer: Customer): void {
    this.dialog.open(CustomerDialog, {
      data: customer,
      width: '600px',
      maxWidth: '95vw',
    });
  }
}