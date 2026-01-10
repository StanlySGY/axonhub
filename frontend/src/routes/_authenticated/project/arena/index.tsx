import { createFileRoute } from '@tanstack/react-router';
import { ProjectGuard } from '@/components/project-guard';
import { RouteGuard } from '@/components/route-guard';
import Arena from '@/features/arena';

function ProtectedArena() {
  return (
    <ProjectGuard>
      <RouteGuard requiredScopes={['write_requests']}>
        <Arena />
      </RouteGuard>
    </ProjectGuard>
  );
}

export const Route = createFileRoute('/_authenticated/project/arena/')({
  component: ProtectedArena,
});
