import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TopNav from '@/layout/top-nav/top-nav';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Info, Terminal } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function TestDetail() {
  const params = useParams();

  return (
    <TopNav withSidebar>
      <Alert variant="destructive" className="mb-3">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          Some of information in this test detail is missing. Please complete
          before you run the test
        </AlertDescription>
      </Alert>
      <div className="flex items-center gap-2">
        <div className="text-3xl font-semibold">page_view</div>
        <Badge>Pending</Badge>
        <div className="ml-auto">
          <div>Last test: </div>
          {new Date().toISOString()}
        </div>
      </div>
      <div className=" mt-8 grow relative ">
        <div className="absolute inset-0 grid grid-cols-2 gap-4">
          <img
            src="/karsten-winegeart-GtEkuOZ9qdQ-unsplash.jpg"
            className="rounded-lg object-cover h-96 w-96"
            alt="test-detail"
          />
          <AccordionDemo />
        </div>
      </div>
      <div className="flex justify-between items-center mt-8">
        <Link to={`/project/${params.id}`}>
          <Button>Back</Button>
        </Link>
        <Button>Rerun test</Button>
      </div>
    </TopNav>
  );
}

export function AccordionDemo() {
  const [editDlObject, setEditDlObject] = useState(false);
  const [editTestRequest, setEditTestRequest] = useState(false);
  const [editChromeRecording, setEditChromeRecording] = useState(false);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            Test data layer object <Info />
          </span>
        </AccordionTrigger>
        <AccordionContent>
          {!editDlObject ? (
            <pre>
              {JSON.stringify(
                {
                  id: 10,
                  title: 'HP Pavilion 15-DK1056WM',
                  description: 'HP Pavilion 15-DK1056WM Gaming...',
                  price: 1099,
                  discountPercentage: 6.18,
                  rating: 4.43,
                  stock: 89,
                  brand: 'HP Pavilion',
                  category: 'laptops',
                  thumbnail:
                    'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                  images: [
                    'https://i.dummyjson.com/data/products/10/1.jpg',
                    'https://i.dummyjson.com/data/products/10/2.jpg',
                    'https://i.dummyjson.com/data/products/10/3.jpg',
                    'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                  ],
                },
                null,
                4
              )}
            </pre>
          ) : (
            <div className="px-1 py-1">
              <Textarea
                rows={10}
                value={JSON.stringify(
                  {
                    id: 10,
                    title: 'HP Pavilion 15-DK1056WM',
                    description: 'HP Pavilion 15-DK1056WM Gaming...',
                    price: 1099,
                    discountPercentage: 6.18,
                    rating: 4.43,
                    stock: 89,
                    brand: 'HP Pavilion',
                    category: 'laptops',
                    thumbnail:
                      'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                    images: [
                      'https://i.dummyjson.com/data/products/10/1.jpg',
                      'https://i.dummyjson.com/data/products/10/2.jpg',
                      'https://i.dummyjson.com/data/products/10/3.jpg',
                      'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                    ],
                  },
                  null,
                  4
                )}
              />
            </div>
          )}

          {!editDlObject ? (
            <div
              className="mt-3 underline cursor-pointer"
              onClick={() => setEditDlObject(true)}
            >
              Edit
            </div>
          ) : (
            <Button
              variant="ghost"
              className="mt-1"
              onClick={() => setEditDlObject(false)}
            >
              Save
            </Button>
          )}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Test request</AccordionTrigger>
        <AccordionContent>
          {!editTestRequest ? (
            'https://tagmanager.google.com'
          ) : (
            <div className="p-1">
              <Input value={'https://tagmanager.google.com'} />
            </div>
          )}{' '}
          {!editTestRequest ? (
            <div
              className="mt-3 underline cursor-pointer"
              onClick={() => setEditTestRequest(true)}
            >
              Edit
            </div>
          ) : (
            <Button
              variant="ghost"
              className="mt-1"
              onClick={() => setEditTestRequest(false)}
            >
              Save
            </Button>
          )}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Chrome recording</AccordionTrigger>
        <AccordionContent>
          {!editChromeRecording ? (
            <pre>
              {JSON.stringify(
                {
                  id: 10,
                  title: 'HP Pavilion 15-DK1056WM',
                  description: 'HP Pavilion 15-DK1056WM Gaming...',
                  price: 1099,
                  discountPercentage: 6.18,
                  rating: 4.43,
                  stock: 89,
                  brand: 'HP Pavilion',
                  category: 'laptops',
                  thumbnail:
                    'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                  images: [
                    'https://i.dummyjson.com/data/products/10/1.jpg',
                    'https://i.dummyjson.com/data/products/10/2.jpg',
                    'https://i.dummyjson.com/data/products/10/3.jpg',
                    'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                  ],
                },
                null,
                4
              )}
            </pre>
          ) : (
            <div className="p-1">
              <Textarea
                value={JSON.stringify(
                  {
                    id: 10,
                    title: 'HP Pavilion 15-DK1056WM',
                    description: 'HP Pavilion 15-DK1056WM Gaming...',
                    price: 1099,
                    discountPercentage: 6.18,
                    rating: 4.43,
                    stock: 89,
                    brand: 'HP Pavilion',
                    category: 'laptops',
                    thumbnail:
                      'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                    images: [
                      'https://i.dummyjson.com/data/products/10/1.jpg',
                      'https://i.dummyjson.com/data/products/10/2.jpg',
                      'https://i.dummyjson.com/data/products/10/3.jpg',
                      'https://i.dummyjson.com/data/products/10/thumbnail.jpeg',
                    ],
                  },
                  null,
                  4
                )}
                rows={10}
              />
            </div>
          )}
          {!editChromeRecording ? (
            <div
              className="mt-3 underline cursor-pointer"
              onClick={() => setEditChromeRecording(true)}
            >
              Edit
            </div>
          ) : (
            <Button
              variant="ghost"
              className="mt-1"
              onClick={() => setEditChromeRecording(false)}
            >
              Save
            </Button>
          )}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>Test result</AccordionTrigger>
        <AccordionContent>
          Download <span className="underline cursor-pointer">here</span>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default TestDetail;
