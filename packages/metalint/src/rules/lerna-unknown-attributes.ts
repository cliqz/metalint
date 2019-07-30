/*!
 * Copyright (c) 2018 Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

const ALLOWED_ATTRIBUTES = new Set([
  'version',
  'npmClient',
  'npmClientArgs',
  'useWorkspaces',
  'workspaces',
  'packages',
  'ignoreChanges',
  'command',
]);

/**
 * Check that lerna only contains known keys.
 */
export default function* lernaConfigAttributes(
  { lerna }: Project,
): IterableIterator<Diagnostic> {
  if (lerna !== undefined) {
    for (const attribute of Object.keys(lerna)) {
      if (ALLOWED_ATTRIBUTES.has(attribute) === false) {
        yield {
          code: '[lerna/unknown-attribute]',
          // NOTE: might be too aggressive to auto-fix this
          // fix: {
          //   attribute,
          //   path: join(root, 'lerna.json'),
          //   type: 'replace-json-attribute',
          //   value: undefined,
          // },
          message: `lerna.json contains unknown attribute '${attribute}'`,
          severity: DiagnosticSeverity.Error,
        };
      }
    }
  }
}
