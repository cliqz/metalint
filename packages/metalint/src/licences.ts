/*!
 * Copyright (c) 2019-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { promises as fs } from 'fs';
import { join } from 'path';

import nunjucks from 'nunjucks';

import { fileExists, globs } from './fs-utils';
import { License, Project } from './project';
import { Diagnostic, DiagnosticSeverity } from './rules';

/**
 * Get license template from static assets and generate `full` + `notice`
 */
export async function loadLicense({
  name,
  owner,
  date,
}: {
  name?: string;
  owner?: string;
  date?: string;
}): Promise<{ full: string; notice: string } | undefined> {
  if (owner === undefined || date === undefined || name === undefined) {
    console.error('! license information missing, mandatory fields are: owner, date, name');
    return undefined;
  }

  const licenseDir = join(__dirname, '..', '..', '..', 'licenses', name);
  const licenseExists = await fileExists(licenseDir);

  if (licenseExists === false) {
    console.error(`! license unknown: ${name}`);
    return undefined;
  }

  const [fullTemplate, noticeTemplate] = await Promise.all([
    fs.readFile(join(licenseDir, 'LICENSE.njk'), 'utf-8'),
    fs.readFile(join(licenseDir, 'notice.njk'), 'utf-8'),
  ]);

  return {
    full: nunjucks.renderString(fullTemplate, { owner, date }).trim(),
    notice: nunjucks.renderString(noticeTemplate, { owner, date }).trim(),
  };
}

/**
 * Make sure that LICENSE file is up-to-date.
 */
function checkLicenseFile(content: string, full: string): string | undefined {
  // TODO detect if some sub-package does not have a LICENSE file at all
  if (content.trim() !== full) {
    return full;
  }

  return undefined;
}

/**
 * Make sure that license notice at the top of a source file is up-to-date.
 */
function checkLicenseNotice(path: string, content: string, notice: string): string | undefined {
  let start = 0;

  // Skip spaces at the beginning of file
  while (content.charCodeAt(start) <= 20) {
    start += 1;
  }

  // Check if what comes next is a copyright long comment: /*!
  if (
    content.charCodeAt(start) === 47 /* '/' */ &&
    content.charCodeAt(start + 1) === 42 /* '*' */ &&
    content.charCodeAt(start + 2) === 33 /* '!' */
  ) {
    // detect end of notice
    let end = start + 3;
    while (
      end < content.length &&
      !(content.charCodeAt(end) === 42 /* '*' */ && content.charCodeAt(end + 1) === 47) /* '/' */
    ) {
      end += 1;
    }

    end += 2; // skip: '*/'

    // Either notice does not end, or file contains only notice
    if (end >= content.length) {
      console.log(`+ File ${path} only consists in a copyright comment?`);
      if (content.trim() !== notice) {
        return `${notice}`;
      }
      return undefined;
    }

    // Update notice if needed
    if (content.slice(start, end).trim() !== notice) {
      return `${notice}\n\n${content.slice(end).trim()}\n`;
    }
  } else {
    return `${notice}\n\n${content.trim()}\n`;
  }

  return undefined;
}

/**
 * Given a path, make sure that notice is up-to-date.
 */
async function check(path: string, license: License): Promise<Diagnostic | undefined> {
  const content = await fs.readFile(path, { encoding: 'utf-8' });
  if (path.endsWith('/LICENSE')) {
    const fix = checkLicenseFile(content, license.full);
    if (fix !== undefined) {
      return {
        code: '[license/main]',
        message: `LICENSE out-dated: ${path}`,
        severity: DiagnosticSeverity.Error,

        fix: {
          content: fix,
          path,
          type: 'replace-file',
        }
      };
    }
  } else {
    const fix = checkLicenseNotice(path, content, license.notice);
    if (fix !== undefined) {
      return {
        code: '[license/notice]',
        message: `license notice out-dated: ${path}`,
        severity: DiagnosticSeverity.Error,

        fix: {
          content: fix,
          path,
          type: 'replace-file',
        }
      };
    }
  }

  return undefined;
}

/**
 * Check that all licenses are up-to-date.
 */
export async function* checkLicenses(project: Project): AsyncIterableIterator<Diagnostic> {
  const license: License | undefined = project.license;

  // If not information was given regarding license, then we ignore this check
  if (license === undefined) {
    console.log('! no license information available, not checking.');
    return;
  }

  // Providing an array of globs in 'metalint.license.include' is mandatory
  if (project.metalint.license.include === undefined) {
    console.error('! license information specified in config but "include" was not specified');
    return;
  }

  // List all files and check their license
  for (const diagnostic of (await Promise.all((await globs(
    project.metalint.license.include,
    project.root,
    project.metalint.license.exclude,
  )).map((path) => check(path, license))))) {
    if (diagnostic !== undefined) {
      yield diagnostic;
    }
  }
}
