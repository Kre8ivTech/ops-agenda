import { EntitySwitcherClient } from '@/components/chrome/entity-switcher-client';
import { getEntitySelection } from '@/lib/entities/queries';

export async function EntitySwitcher() {
  const { entities, selectedEntityId } = await getEntitySelection();
  if (entities.length === 0) return null;

  return (
    <EntitySwitcherClient
      key={selectedEntityId}
      entities={entities}
      selectedEntityId={selectedEntityId}
    />
  );
}
