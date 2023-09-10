import TopNav from '@/layout/top-nav/top-nav';
import { CardWithForm } from './components/card';

export default function DashboardPage() {
  return (
    <TopNav containerClassName="grid grid-cols-4 gap-4">
      <CardWithForm isCreate />
      <CardWithForm />
      <CardWithForm />
      <CardWithForm />
      <CardWithForm />
      <CardWithForm />
    </TopNav>
  );
}
