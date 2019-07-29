import { Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

/**
 * Check that names of sub-packages are consistent with folder names.
 */
export default function* packageFolderName(
  project: Project,
): IterableIterator<Diagnostic> {
  for (const { name, pkg } of project.packages) {
    const packageName = pkg.name;

    // TODO - move this check somewhere else: mandatory properties?
    if (packageName === undefined) {
      yield {
        code: '[pkg/folder-name]',
        message: `sub-package ${name} has not 'name' property defined in 'package.json'`,
        severity: DiagnosticSeverity.Error,
      };
    } else {
      const parts = packageName.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart !== name) {
        yield {
          code: '[pkg/folder-name]',
          message: `name of sub-package ${name}/${packageName} is not consistent with folder name ${name}`,
          severity: DiagnosticSeverity.Error,
        };
      }
    }
  }
}
