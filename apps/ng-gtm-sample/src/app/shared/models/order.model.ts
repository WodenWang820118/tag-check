export interface Order {
  id: string;
  title: string;
  category: string;
  quantity: number;
  date: Date;
  image: string;
  currency: string;
  value: number;
}
