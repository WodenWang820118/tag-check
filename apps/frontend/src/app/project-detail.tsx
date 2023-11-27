import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TopNav from '@/layout/top-nav/top-nav';
import {
  Check,
  CheckCircle,
  CheckCircle2,
  InfoIcon,
  PlayIcon,
  X,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

function ProjectDetail() {
  const [isRunningMultipleTests, setIsRunningMultipleTests] = useState(false);

  return (
    <TopNav withSidebar>
      <div className="flex mb-4">
        <div>
          <div className="mb-3">
            <div className="font-medium">Tag Manager URL:</div>
            <div className="text-sm">
              https://tagmanager.google.com/#/container/accounts/1309987100/containers/10578705/
            </div>
          </div>
          <div className="mb-3">
            <div className="font-medium">GTM-ID: </div>
            <div className="text-sm">GTM-MCQWFPD</div>
          </div>
          <div className="mb-3">
            <div className="font-medium">Container name: </div>
            <div className="text-sm">NARS - SAPAC - Analytics</div>
          </div>
        </div>
        <div className="ml-auto">
          <DialogDemo isRunningMultipleTests={isRunningMultipleTests} />
        </div>
      </div>
      <TableDemo
        isRunningMultipleTests={isRunningMultipleTests}
        setIsRunningMultipleTests={setIsRunningMultipleTests}
      />
    </TopNav>
  );
}

export function DialogDemo({
  isRunningMultipleTests,
}: {
  isRunningMultipleTests: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isRunningMultipleTests}>
          Create new test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new test</DialogTitle>
          <DialogDescription>
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Eaque
            facere labore, inventore illum voluptates, quod nisi atque id quia
            autem quos rem sint odio dicta reiciendis nulla quas tempora ipsam?
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value="Pedro Duarte" />
        </div>
        <div>
          <Label htmlFor="username" className="text-right">
            dL Specs
          </Label>
          <Textarea id="username" value="@peduarte" />
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const invoices = [
  {
    invoice: 'page_view',
    dlSpecs: 'Paid',
    lastModification: new Date().toISOString(),
    paymentMethod: 'Credit Card',
    status: 'idle',
  },
  {
    invoice: 'view_item',
    dlSpecs: 'Pending',
    lastModification: new Date().toISOString(),
    paymentMethod: 'PayPal',
    status: 'failed',
  },
  {
    invoice: 'view_promotion',
    dlSpecs: 'Unpaid',
    lastModification: new Date().toISOString(),
    paymentMethod: 'Bank Transfer',
    status: 'pending',
  },
  {
    invoice: 'view_item_list',
    dlSpecs: 'Paid',
    lastModification: new Date().toISOString(),
    paymentMethod: 'Credit Card',
    status: 'success',
  },
];

export function TableDemo({
  isRunningMultipleTests,
  setIsRunningMultipleTests,
}: {
  isRunningMultipleTests: boolean;
  setIsRunningMultipleTests: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const params = useParams();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {isRunningMultipleTests && <TableHead></TableHead>}
            <TableHead>Name</TableHead>
            <TableHead>dL Specs</TableHead>
            <TableHead>Expected values</TableHead>
            <TableHead className="text-right">Last modification</TableHead>
            <TableHead className="text-right">Run test</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.invoice}>
              {isRunningMultipleTests && (
                <TableCell className="font-medium">
                  <Checkbox
                    checked={selectedTests.includes(invoice.invoice)}
                    onCheckedChange={(checked) => {
                      setSelectedTests((prev) =>
                        checked
                          ? [...prev, invoice.invoice]
                          : prev.filter((_prev) => _prev !== invoice.invoice)
                      );
                    }}
                    disabled={invoice.status !== 'idle'}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <Link to={`/project/${params.id}/test`}>
                  <span className="underline">{invoice.invoice}</span>
                </Link>
              </TableCell>
              <TableCell>{invoice.dlSpecs}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right">
                {invoice.lastModification}
              </TableCell>
              <TableCell className="flex justify-end cursor-pointer">
                {invoice.status === 'pending' ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Information not completed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : invoice.status === 'idle' ? (
                  <PlayIcon />
                ) : invoice.status === 'success' ? (
                  <CheckCircle2 />
                ) : (
                  <X />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex  w-full mt-2">
        {isRunningMultipleTests && (
          <Button
            variant="ghost"
            onClick={() => {
              setIsRunningMultipleTests(false);
              setSelectedTests([]);
            }}
          >
            Cancel
          </Button>
        )}

        <div className="ml-auto">
          {!isRunningMultipleTests ? (
            <Button onClick={() => setIsRunningMultipleTests(true)}>
              Run multiple tests
            </Button>
          ) : (
            <Button onClick={() => setIsRunningMultipleTests(true)}>
              Run selected tests
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export default ProjectDetail;
