/*!
 * Copyright (c) 2019 Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// NOTE - should we embrave LanguageServer protocol here, or use something higher level for now?

// TODO - use LanguageServer codes
// import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver-protocol';
import { DiagnosticSeverity } from 'vscode-languageserver-protocol';

import { Fix } from './fix';
import { Project } from './project';

export interface Diagnostic {
  severity?: DiagnosticSeverity;
  code?: string;
  message: string;
  fix?: Fix;
}

export type Rule = (project: Project) => IterableIterator<Diagnostic>;

export { DiagnosticSeverity };
