/*!
 * Copyright (c) 2019-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { join } from 'path';

import normalize from 'normalize-package-data';

// import { Fix } from '../fix';
import { Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Apply normalization to package.json using 'normalize-package-data' used by npm.
 */
export default function* packageNormalize(project: Project): IterableIterator<Diagnostic> {
  if (project.packages.length === 0) {
    return;
  }

  // Only auto-fix attributes which are not specified in '.metalint.json'
  const attributeBlacklist: Set<string> = new Set(
    Object.keys((project.metalint.workspaces && project.metalint.workspaces.pkg) || {}),
  );

  // Collect extra warnings
  const normalizationWarnings: string[] = [];
  const warn = (warning: string): void => {
    // Ignore warnings about 'readme' attribute
    if (warning.includes('No README data')) {
      return;
    }

    normalizationWarnings.push(warning);
  };

  for (const { root, pkg } of project.packages) {
    // Normalize `pkg`
    const normalized = clone(pkg);

    try {
      normalize(normalized, warn, true /* strict validation */);
    } catch (ex) {
      // it can happen that `normalize` throws exceptions if the structure of
      // 'package.json' is not valid. In this case we just abort and except
      // some other linting rule to enforce presence of mandatory attributes.
      return;
    }

    // Compare what changed
    for (const [attribute, value] of Object.entries(pkg)) {
      if (
        attributeBlacklist.has(attribute) === false &&
        deepEqual(normalized[attribute], value) === false
      ) {
        yield {
          code: '[pkg/normalize]',
          fix: {
            attribute,
            path: join(root, 'package.json'),
            type: 'replace-json-attribute',
            value: normalized[attribute],
          },
          message: `package attribute ${attribute} needs to be normalized: ${JSON.stringify(
            normalized[attribute],
          )}`,
          severity: DiagnosticSeverity.Error,
        };
      }
    }

    // Emit extra warnings as diagnostics
    for (const warning of normalizationWarnings) {
      yield {
        code: '[pkg/normalize]',
        message: `additional package.json normalization warning: ${warning}`,
        severity: DiagnosticSeverity.Warning,
      };
    }
  }
}
