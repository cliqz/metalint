import { Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

/**
 * Check that names of sub-packages are consistent with folder names.
 */
export default function* packageNamespaceConsistency(
  project: Project,
): IterableIterator<Diagnostic> {
  const namespaces: Array<{ name: string; namespace: string }> = [];

  // TODO - allow to specify value in `.metalint.json`
  // Collect namespaces of all sub-packages
  for (const { pkg } of project.packages) {
    const packageName = pkg.name;
    if (packageName !== undefined) {
      const parts = packageName.split('/');
      namespaces.push({
        name: packageName,
        namespace: parts.slice(0, -1).join('/'),
      });
    }
  }

  // Check that all namespaces are the same
  if (namespaces.length !== 0) {
    const namespace = namespaces[0].namespace;
    for (const namespaceInfo of namespaces) {
      if (namespace !== namespaceInfo.namespace) {
        yield {
          code: '[pkg/namespace]',
          message: `sub-package ${namespaceInfo.name} has wrong namespace ${namespaceInfo.namespace}, expected ${namespace}`,
          severity: DiagnosticSeverity.Error,
        }
      }
    }
  }
}
