export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ContainerWithCategory = {
  id: string;
  owner_id: string;
  title: string;
  category_id: string | null;
  container_type: string;
  size: string;
  location: string;
  price_per_day: number;
  total_quantity: number;
  description: string | null;
  is_available: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  container_categories?: Category | null;
};
