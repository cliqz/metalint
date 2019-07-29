/*!
 * Copyright (c) 2019 Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { constants, promises as fs } from 'fs';
import path from 'path';

import globPattern from 'glob';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, constants.R_OK | constants.W_OK);
    return true;
  } catch (ex) {
    return false;
  }
}

export async function glob(pattern: string, root: string, ignore?: string[]): Promise<string[]> {
  return new Promise((resolve) => {
    globPattern(
      pattern,
      {
        cwd: root,
        dot: false,
        ignore,
        nomount: true,
        nonull: false,
        nosort: true,
      },
      (err, files) => {
        if (err !== null) {
          console.error(` > error while globbing ${pattern}`, err);
          resolve([]);
        } else {
          resolve(files.map((p) => path.join(root, p)));
        }
      },
    );
  });
}

export async function globs(patterns: string[], root: string, ignore?: string[]): Promise<string[]> {
  return ([] as string[]).concat(
    ...(await Promise.all(patterns.map((pattern) => glob(pattern, root, ignore)))),
  );
}
