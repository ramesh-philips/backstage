/*
 * Copyright 2023 The Backstage Authors
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

import React from 'react';
import {
  ExtensionBoundary,
  coreExtensionData,
  createComponentExtension,
  createExtension,
  createExtensionInput,
  IconBundleBlueprint,
  ThemeBlueprint,
  ApiBlueprint,
  TranslationBlueprint,
} from '@backstage/frontend-plugin-api';

export const App = createExtension({
  namespace: 'app',
  attachTo: { id: 'root', input: 'default' }, // ignored
  inputs: {
    apis: createExtensionInput([ApiBlueprint.dataRefs.factory]),
    themes: createExtensionInput([ThemeBlueprint.dataRefs.theme]),
    components: createExtensionInput([
      createComponentExtension.componentDataRef,
    ]),
    translations: createExtensionInput([
      TranslationBlueprint.dataRefs.translation,
    ]),
    icons: createExtensionInput([IconBundleBlueprint.dataRefs.icons]),
    root: createExtensionInput([coreExtensionData.reactElement], {
      singleton: true,
    }),
  },
  output: [coreExtensionData.reactElement],
  factory: ({ node, inputs }) => [
    coreExtensionData.reactElement(
      <ExtensionBoundary node={node}>
        {inputs.root.get(coreExtensionData.reactElement)}
      </ExtensionBoundary>,
    ),
  ],
});
