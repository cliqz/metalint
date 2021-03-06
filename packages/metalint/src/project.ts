/*!
 * Copyright (c) 2019-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { promises as fs } from 'fs';
import path from 'path';

import { AJSONSchemaForLernaJsonFiles as Lerna } from '@schemastore/lerna';
import { JSONSchemaForNPMPackageJsonFiles as Package } from '@schemastore/package';
import { JSONSchemaForTheTypeScriptCompilerSConfigurationFile as TsConfig } from '@schemastore/tsconfig';
import { JSONSchemaForTheTSLintConfigurationFiles as Tslint } from '@schemastore/tslint';
import getGit from 'simple-git/promise';

import { fileExists, globs } from './fs-utils';
import { loadLicense } from './licences';

interface Metalint {
  license: {
    name?: string;
    date?: string;
    owner?: string;

    include?: string[];
    exclude?: string[];
  };
  workspaces?: {
    pkg?: Partial<Package>;
  };
}

async function findProjectRoot(): Promise<string> {
  console.debug('+ looking for project root...');

  let current = path.resolve();
  while (current.length > 1) {
    console.debug(' ?', current);

    // Check if we find 'lerna.json' or '.metalint.json' or '.git'
    const files = new Set(await fs.readdir(current));
    if (files.has('lerna.json') || files.has('.metalint.json') || files.has('.git')) {
      return current;
    }

    current = path.dirname(current);
  }
  return current;
}

async function loadConfig<T>(name: string, root: string): Promise<T> {
  const configPath = path.join(root, name);
  const configExists = await fileExists(configPath);

  if (configExists === false) {
    throw new Error(`could not find ${name} in workspace ${root}, abort!`);
  }

  const config: T = JSON.parse(await fs.readFile(configPath, 'utf-8'));

  return config;
}

async function loadTSConfig(root: string): Promise<TsConfig> {
  return loadConfig<TsConfig>('tsconfig.json', root);
}

// async function loadTslintConfig(root: string): Promise<Tslint> {
//   return loadConfig<Tslint>('tslint.json', root);
// }

async function loadMetalintConfig(root: string): Promise<Metalint> {
  return loadConfig<Metalint>('.metalint.json', root);
}

async function loadLernaConfig(root: string): Promise<Lerna> {
  return loadConfig<Lerna>('lerna.json', root);
}

async function loadPackageConfig(root: string): Promise<Package> {
  return loadConfig<Package>('package.json', root);
}

interface Workspace {
  subWorkspace: boolean;
  root: string;
  name: string;

  tslint?: Tslint;
  pkg: Package;
  tsconfig?: TsConfig;
}

interface Git {
  homepage: string;
  bugs: {
    url: string;
  };
  repository: {
    type: 'git';
    url: string;
  };
}

export interface License {
  notice: string;
  full: string;
}

export interface Project {
  root: string;
  name: string;
  metalint: Metalint;
  pkg: Package;
  packages: Workspace[];

  git?: Git;
  lerna?: Lerna;
  license?: License;
}

async function getGitInformation(root: string): Promise<Git | undefined> {
  const git = getGit(root);
  if ((await git.checkIsRepo()) === false) {
    return undefined;
  }

  let upstream: string | undefined;
  for (const { name, refs: { fetch } } of await git.getRemotes(true)) {
    if (name === 'upstream') {
      upstream = fetch;
    }

    if (name === 'origin' && upstream === undefined) {
      upstream = fetch;
    }
  }

  // Only support Github for now
  if (upstream !== undefined && upstream.includes('github.com')) {
    let url = upstream;
    if (url.endsWith('.git')) {
      url = url.slice(0, -4);
    }

    if (url.startsWith('git@github.com:')) {
      url = `https://github.com/${url.slice(15)}`;
    }

    return {
      bugs: { url: `${url}/issues` },
      homepage: `${url}#readme`,
      repository: {
        type: 'git',
        url: upstream,
      },
    };
  }

  return undefined;
}

async function loadListOfPackages(root: string, lerna: Lerna | undefined, npm: Package): Promise<string[]> {
  console.debug('+ listing packages...');
  const patterns: string[] = [];

  if (npm.workspaces !== undefined && Array.isArray(npm.workspaces)) {
    console.debug(' > found globs in package.json', npm.workspaces);
    patterns.push(...npm.workspaces);
  }

  if (lerna !== undefined && lerna.packages !== undefined && Array.isArray(lerna.packages)) {
    console.debug(' > found globs in lerna.json', lerna.packages);
    patterns.push(...lerna.packages);
  }

  return ([] as string[]).concat(...(await globs(patterns.map(p => p.endsWith('/') === false ? `${p}/` : p), root)));
}

async function loadWorkspace(root: string, subWorkspace: boolean = true): Promise<Workspace> {
  // Load mandatory 'package.json'
  const pkg = await loadPackageConfig(root);

  // Optionally load 'tsconfig.json'
  let tsconfig: TsConfig | undefined;
  try {
    tsconfig = await loadTSConfig(root);
  } catch (ex) {
    // tsconfig.json is optional in sub-packages
  }

  return {
    name: path.basename(root),
    pkg,
    root,
    subWorkspace,
    tsconfig,
    // tslint,
  };
}

async function loadPackages(root: string, lerna: Lerna | undefined, npm: Package): Promise<Workspace[]> {
  const workspaces = await Promise.all((await loadListOfPackages(root, lerna, npm)).map((p: string) => loadWorkspace(p, true)));

  // root workspace is always added
  workspaces.push(await loadWorkspace(root, false));

  return workspaces;
}

type DependencyScope = 'peerDependencies' | 'devDependencies' | 'dependencies';

export function* iterDependencies(
  project: Project,
): IterableIterator<{
  pkg: string;
  version: string;
  scope: DependencyScope;
  workspace: Workspace | Project;
}> {
  for (const workspace of [project, ...project.packages]) {
    const {
      pkg: { dependencies, devDependencies, peerDependencies },
    } = workspace;
    for (const [pkg, version] of Object.entries(dependencies || {})) {
      yield { pkg, version, scope: 'dependencies', workspace };
    }

    for (const [pkg, version] of Object.entries(devDependencies || {})) {
      yield { pkg, version, scope: 'devDependencies', workspace };
    }

    for (const [pkg, version] of Object.entries(peerDependencies || {})) {
      yield { pkg, version, scope: 'peerDependencies', workspace };
    }
  }
}

export default async function loadProject(): Promise<Readonly<Project>> {
  const projectRoot = await findProjectRoot();
  const projectName = path.basename(projectRoot);

  // Load git information if available
  const git: Git | undefined = await getGitInformation(projectRoot);

  const [metalint, lerna, pkg] = await Promise.all([
    loadMetalintConfig(projectRoot),
    loadLernaConfig(projectRoot).catch(() => undefined),
    loadPackageConfig(projectRoot),
  ]);

  const packages = await loadPackages(projectRoot, lerna, pkg);
  console.log('+ found packages', packages.map((p) => p.name));

  // Load optional license related data
  let license;
  if (metalint.license !== undefined) {
    license = await loadLicense(metalint.license);
  }

  return {
    name: projectName,
    root: projectRoot,

    git,

    // metalint config
    metalint,

    // lerna config (TODO: should be optional in the future)
    lerna,

    // root package.json
    pkg,

    // root tslint.json

    // list of packages for this repository
    packages,

    license,
  };
}
