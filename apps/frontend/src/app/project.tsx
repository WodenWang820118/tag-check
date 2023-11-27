import { useParams } from 'react-router-dom';
import NewProject from './new-project';
import ProjectDetail from './project-detail';

function Project() {
  const params = useParams();

  if (params.id !== 'new') {
    return <ProjectDetail />;
  }

  return <NewProject />;
}

export default Project;
