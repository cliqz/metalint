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
  'publishConfig',
  'repository',
  'version',
];

/**
 * Check that mandatory attributes are specified
 */
export default function* packageAttributesMandatory(
  project: Project,
): IterableIterator<Diagnostic> {
  for (const { name, pkg } of project.packages) {
    const ignoredAttributes = new Set(
      (
        project.metalint.workspaces !== undefined &&
          project.metalint.workspaces.pkg !== undefined
      ) ? Object.keys(project.metalint.workspaces.pkg) : []
    );

    for (const attribute of MANDATORY_ATTRIBUTES) {
      if (ignoredAttributes.has(attribute) === false) {
        if (pkg[attribute] === undefined) {
          yield {
            code: '[pkg/attributes-mandatory]',
            message: `sub-package '${name}' does not specify mandatory attribute '${attribute}'`,
            severity: DiagnosticSeverity.Error,
          };
        }
      }
    }
  }
}
