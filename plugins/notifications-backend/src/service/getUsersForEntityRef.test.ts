/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { mockServices } from '@backstage/backend-test-utils';
import { getUsersForEntityRef } from './getUsersForEntityRef';
import { CatalogApi } from '@backstage/catalog-client';
import {
  RELATION_HAS_MEMBER,
  RELATION_OWNED_BY,
  RELATION_PARENT_OF,
} from '@backstage/catalog-model';

describe('getUsersForEntityRef', () => {
  const catalogApiMock = {
    getEntitiesByRefs: jest.fn(),
    getEntityByRef: jest.fn(),
  };
  const authMock = mockServices.auth();

  it('should return empty array if entityRef is null', async () => {
    await expect(
      getUsersForEntityRef(null, [], {
        auth: authMock,
        catalogClient: catalogApiMock as unknown as CatalogApi,
      }),
    ).resolves.toEqual([]);
  });

  it('should resolve users without calling catalog', async () => {
    await expect(
      getUsersForEntityRef(['user:foo', 'user:ignored'], ['user:ignored'], {
        auth: authMock,
        catalogClient: catalogApiMock as unknown as CatalogApi,
      }),
    ).resolves.toEqual(['user:foo']);
    expect(catalogApiMock.getEntitiesByRefs).not.toHaveBeenCalled();
  });

  it('should resolve group entities to users', async () => {
    catalogApiMock.getEntitiesByRefs.mockResolvedValueOnce({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Group',
          metadata: {
            name: 'parent_group',
          },
          relations: [
            {
              type: RELATION_HAS_MEMBER,
              targetRef: 'user:default/foo',
            },
            {
              type: RELATION_PARENT_OF,
              targetRef: 'group:default/child_group',
            },
          ],
        },
      ],
    });

    catalogApiMock.getEntitiesByRefs.mockResolvedValueOnce({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Group',
          metadata: {
            name: 'child_group',
          },
          relations: [
            {
              type: RELATION_HAS_MEMBER,
              targetRef: 'user:default/bar',
            },
            {
              type: RELATION_HAS_MEMBER,
              targetRef: 'user:default/ignored',
            },
          ],
        },
      ],
    });

    await expect(
      getUsersForEntityRef(
        'group:default/parent_group',
        ['user:default/ignored'],
        {
          auth: authMock,
          catalogClient: catalogApiMock as unknown as CatalogApi,
        },
      ),
    ).resolves.toEqual(['user:default/foo', 'user:default/bar']);
  });

  it('should resolve user owner of entity from entity ref', async () => {
    catalogApiMock.getEntitiesByRefs.mockResolvedValueOnce({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'test_component',
          },
          relations: [
            {
              type: RELATION_OWNED_BY,
              targetRef: 'user:default/foo',
            },
          ],
        },
      ],
    });

    await expect(
      getUsersForEntityRef('component:default/test_component', [], {
        auth: authMock,
        catalogClient: catalogApiMock as unknown as CatalogApi,
      }),
    ).resolves.toEqual(['user:default/foo']);
  });

  it('should resolve group owner of entity from entity ref', async () => {
    catalogApiMock.getEntitiesByRefs.mockResolvedValueOnce({
      items: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'test_component',
          },
          relations: [
            {
              type: RELATION_OWNED_BY,
              targetRef: 'group:default/owner_group',
            },
          ],
        },
      ],
    });

    catalogApiMock.getEntityByRef.mockResolvedValueOnce({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: 'owner_group',
      },
      relations: [
        {
          type: RELATION_HAS_MEMBER,
          targetRef: 'user:default/foo',
        },
      ],
    });

    await expect(
      getUsersForEntityRef('component:default/test_component', [], {
        auth: authMock,
        catalogClient: catalogApiMock as unknown as CatalogApi,
      }),
    ).resolves.toEqual(['user:default/foo']);
  });
});
