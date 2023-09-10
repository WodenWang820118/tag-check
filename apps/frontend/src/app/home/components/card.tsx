import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router-dom';

type Props = {
  isCreate?: boolean;
};

export function CardWithForm({ isCreate }: Props) {
  return (
    <Link to={`/project/${isCreate ? 'new' : 'id'}`}>
      <Card className="cursor-pointer hover:border-black transition-colors h-full">
        <CardHeader>
          <CardTitle>{isCreate ? 'Create project' : 'Project A'}</CardTitle>
          <CardDescription>
            {isCreate
              ? 'Deploy your new project in one-click.'
              : 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Similique, ea!'}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
