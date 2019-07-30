/*!
 * Copyright (c) 2019-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { join } from 'path';

import { Fix } from '../fix';
import { Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

const MANDATORY_ATTRIBUTES = [
  'author',
  'bugs',
  'contributors',
  'description',
  'files',
  'homepage',
  'license',
  'name',
  'repository',
  'version',
];

/**
 * Check that mandatory attributes are specified
 */
export default function* packageAttributesMandatory(
  project: Project,
): IterableIterator<Diagnostic> {
  for (const { name, pkg, root } of project.packages) {
    const ignoredAttributes = new Set(
      (
        project.metalint.workspaces !== undefined &&
          project.metalint.workspaces.pkg !== undefined
      ) ? Object.keys(project.metalint.workspaces.pkg) : []
    );

    for (const attribute of MANDATORY_ATTRIBUTES) {
      if (ignoredAttributes.has(attribute) === false) {
        if (pkg[attribute] === undefined) {
          let fix: undefined | Fix;

          // custom auto-fix for some attributes
          if (attribute === 'homepage' && project.git !== undefined) {
            fix = {
              attribute,
              path: join(root, 'package.json'),
              type: 'replace-json-attribute',
              value: project.git.homepage,
            };
          } else if (attribute === 'bugs' && project.git !== undefined) {
            fix = {
              attribute,
              path: join(root, 'package.json'),
              type: 'replace-json-attribute',
              value: project.git.bugs,
            };
          } else if (attribute === 'repository' && project.git !== undefined) {
            fix = {
              attribute,
              path: join(root, 'package.json'),
              type: 'replace-json-attribute',
              value: project.git.repository,
            };
          }

          yield {
            code: '[pkg/attributes-mandatory]',
            fix,
            message: `package '${name}' does not specify mandatory attribute '${attribute}'`,
            severity: DiagnosticSeverity.Error,
          };
        }
      }
    }
  }
}
