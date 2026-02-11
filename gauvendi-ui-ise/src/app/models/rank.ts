export interface Rank
{
  option: number;
  category: Category;
}

export interface Category
{
  name: string;
  code: string;
  iconImageUrl: string;
  features: { code: string; name: string, image: string }[];
}
