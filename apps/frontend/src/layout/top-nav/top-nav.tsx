import { ModeToggle } from '@/components/theme-toggle';
import { playlists } from '@/constants/data';
import { cn } from '@/lib/utils';
import { Sidebar } from '../sidebar/sidebar';
import { MainNav } from './components/main-nav';

type Props = {
  children?: React.ReactNode;
  containerClassName?: string;
  withSidebar?: boolean;
};

function TopNav({ children, containerClassName, withSidebar }: Props) {
  return (
    <div className="h-screen flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4 mr-4">
            {/* <Search /> */}
          </div>
          <ModeToggle />
        </div>
      </div>
      <div
        className={cn(
          'grow ',
          !withSidebar && 'container my-8',
          containerClassName
        )}
      >
        {withSidebar ? (
          <div className="h-full grid lg:grid-cols-5">
            <Sidebar playlists={playlists} />
            <div className="col-span-3 lg:col-span-4 lg:border-l flex flex-col container py-4">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default TopNav;
