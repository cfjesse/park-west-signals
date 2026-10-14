export interface SearchForm {
  keyword: string;
  filter: string;
}

export interface ApiError {
  error: string;
  details?: unknown[];
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  artwork_count?: number;
}

export interface ArtistData {
  id: string;
  artist_id?: string;
  artist_name: string;
  artist_avatar?: string;
  artist_bio?: string;
  title: string;
  media: string;
  size: string;
  style: string;
  date_created: string;
  price: number;
  status: 'available' | 'sold';
  customer_id?: string | null;
  customer_name?: string | null;
  sold_date?: string | null;
}

export interface Metrics {
  style: {
    [key: string]: number;
  };
  media: {
    [key: string]: number;
  };
}

export interface ArtworkItem {
  id: string;
  title: string;
  media: string;
  style: string;
  date_created: string;
  price: number;
  size: string;
}

export interface ArtistDisplayData {
  artist_name: string;
  artist_avatar?: string;
  artist_bio?: string;
  artist_id?: string;
  artworks: ArtworkItem[];
}

export interface Customer extends CustomerSummary {
  age?: number;
  address?: string;
  credit: number;
}
