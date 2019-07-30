/*!
 * Copyright (c) 2019 Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { join } from 'path';

import { Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

/**
 * Check that lerna is configured properly using yarn workspaces.
 */
export default function* lernaConfigWorkspaces(
  { lerna, root }: Project,
): IterableIterator<Diagnostic> {
  if (lerna !== undefined) {
    if (lerna.npmClient !== 'yarn') {
      yield {
        code: '[lerna/npm-client]',
        fix: {
          attribute: 'npmClient',
          path: join(root, 'lerna.json'),
          type: 'replace-json-attribute',
          value: 'yarn',
        },
        message: `lerna.json should specify 'yarn' as 'npmClient' (reason: workspaces!)`,
        severity: DiagnosticSeverity.Error,
      };
    }

    if (lerna.useWorkspaces !== true) {
      yield {
        code: '[lerna/use-workspaces]',
        fix: {
          attribute: 'useWorkspaces',
          path: join(root, 'lerna.json'),
          type: 'replace-json-attribute',
          value: true,
        },
        message: `lerna.json should specify 'true' as 'useWorkspaces'`,
        severity: DiagnosticSeverity.Error,
      };
    }

    if (lerna.version === undefined) {
      yield {
        code: '[lerna/version]',
        message: `lerna.json should specify a 'version' attribute for sub-packages`,
        severity: DiagnosticSeverity.Error,
      };
    }

    if (lerna.packages !== undefined) {
      yield {
        code: '[lerna/packages]',
        message: `consider moving the 'packages' section of lerna.json to 'workspaces' section of package.json`,
        severity: DiagnosticSeverity.Warning,
      };
    }

    if (lerna.workspaces !== undefined) {
      yield {
        code: '[lerna/workspaces]',
        message: `consider moving the 'workspaces' section of lerna.json to 'workspaces' section of package.json`,
        severity: DiagnosticSeverity.Warning,
      };
    }

  }
}
