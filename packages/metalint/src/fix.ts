/*!
 * Copyright (c) 2019 Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { promises as fs } from 'fs';

export interface FixReplaceFile {
  type: 'replace-file';
  path: string;
  content: string;
}


export interface FixReplaceJsonAttribute {
  type: 'replace-json-attribute';
  path: string;
  attribute: [string] | string;
  value: any;
}

// TODO - allow fix to replace section of existing file

export type Fix = FixReplaceFile | FixReplaceJsonAttribute;

export async function applyFix(fix: Fix): Promise<void> {
  if (fix.type === 'replace-file') {
    await fs.writeFile(fix.path, fix.content, 'utf-8');
  } else if (fix.type === 'replace-json-attribute') {
    if (fix.path.endsWith('.json') === false) {
      throw new Error(`cannot fix non-JSON file ${fix.path}`);
    }

    // read original file
    const json = JSON.parse(await fs.readFile(fix.path, 'utf-8'));

    // handle cases where selector is an array or a string
    const selector: string[] = Array.isArray(fix.attribute) ? [...fix.attribute] : [fix.attribute];

    // selector cannot be empty
    if (selector.length === 0) {
      throw new Error(`invalid empty JSON selector`);
    }

    // use selector to target a nested part of `json`
    let target = json;
    for (let i = 0; i < (selector.length - 1); i += 1) {
      const attribute: string = selector[i];
      let subTarget = target[attribute];
      if (subTarget === undefined) {
        subTarget = {};
        target[attribute] = subTarget;
      }

      target = subTarget;
    }

    // replace selected part
    target[selector[selector.length - 1]] = fix.value;

    // Write file on disk
    await fs.writeFile(fix.path, JSON.stringify(target, null, 2), 'utf-8');
  }
}
