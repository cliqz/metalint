/*!
 * Copyright (c) 2019-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { iterDependencies, Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

/**
 * Check that packages defined in this mono-repository and referring to each
 * other have the same version as defined in `lerna.json`.
 */
export default function* internalDependenciesVersions(project: Project): IterableIterator<Diagnostic> {
  // This rule requires 'lerna.json'
  if (project.lerna === undefined) {
    return;
  }

  if (project.lerna.version === undefined) {
    yield {
      code: '[deps/internal]',
      message: `no 'version' defined in root 'lerna.json'`,
      severity: DiagnosticSeverity.Error,
    };
  } else {
    const lernaVersion = `^${project.lerna.version}`;
    const packageNames = new Set(project.packages.map(({ name }) => name));

    for (const { pkg, version, workspace: { name } } of iterDependencies(project)) {
      if (packageNames.has(pkg) && version !== lernaVersion) {
        yield {
          code: '[deps/internal]',
          message: `dependency ${pkg} from ${name} has wrong version; found ${version}, expected ${lernaVersion}`,
          severity: DiagnosticSeverity.Error,
        };
      }
    }
  }
}
