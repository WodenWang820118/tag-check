import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TopNav from '@/layout/top-nav/top-nav';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NewProject() {
  const navigate = useNavigate();
  const [testType, setTestType] = useState<string>();

  return (
    <TopNav>
      <div className="mb-4">
        <Label htmlFor="projectName">Project name</Label>
        <Input type="text" id="projectName" placeholder="Project name" />
      </div>
      <div className="mb-4">
        <Label htmlFor="projectName">Test type</Label>
        <Select value={testType} onValueChange={setTestType}>
          <SelectTrigger>
            <SelectValue placeholder="Select a test type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Type</SelectLabel>
              <SelectItem value="dl-checker">Data layer checker</SelectItem>
              {/* <SelectItem value="automated-qa">Automated QA</SelectItem> */}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {testType === 'dl-checker' && (
        <div className="my-4">
          <div className="flex gap-3 mb-4">
            <InputFile />
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="spreadsheetUrl">
                or google spreadsheet link below:
              </Label>
              <Input
                type="spreadsheetUrl"
                id="spreadsheetUrl"
                placeholder="Spreadsheet url"
              />
            </div>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Label htmlFor="tagManagerUrl">Tag manager URL</Label>
            <Input
              type="tagManagerUrl"
              id="tagManagerUrl"
              placeholder="Tag manager url"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Label htmlFor="gtmId">GTM ID</Label>
            <Input type="gtmId" id="gtmId" placeholder="GTM ID" />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Label htmlFor="containerName">Container name</Label>
            <Input
              type="containerName"
              id="containerName"
              placeholder="Container name"
            />
          </div>
        </div>
      )}
      <div className="flex">
        <Link to={'/'}>
          <Button variant={'ghost'}>Cancel</Button>
        </Link>
        <div className="ml-auto">
          <Button
            className="mr-3"
            onClick={() => {
              setTimeout(() => {
                navigate('/project/5');
              }, 200);
            }}
          >
            Create
          </Button>
          <Button
            onClick={() => {
              setTimeout(() => {
                navigate('/project/5');
              }, 200);
            }}
          >
            Create and test
          </Button>
        </div>
      </div>
    </TopNav>
  );
}

function InputFile() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Upload your file here</Label>
      <Input id="picture" type="file" />
    </div>
  );
}

export default NewProject;
