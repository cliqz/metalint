import loadProject from './src/project';
import { Rule } from './src/rules';

// Rules - dependencies
import checkExternalDependenciesVersions from './src/rules/external-dependencies-versions';
import checkInternalDependenciesVersions from './src/rules/internal-dependencies-versions';

// Rules - packages
import checkPackageAttributesConsistency from './src/rules/package-attributes-consistency';
import checkPackageAttributesMandatory from './src/rules/package-attributes-mandatory';
import checkPackageFolderName from './src/rules/package-folder-name';
import checkPackageNamespaceConsistency from './src/rules/package-namespace-consistency';

// Rule - license
import { checkLicenses } from './src/licences';

async function main() {
  const project = await loadProject();
  const rules: Rule[] = [
    checkInternalDependenciesVersions,
    checkExternalDependenciesVersions,
    checkPackageFolderName,
    checkPackageNamespaceConsistency,
    checkPackageAttributesConsistency,
    checkPackageAttributesMandatory,
  ];

  // TODO - make optional
  console.log('CHECK LICENSE?');
  await checkLicenses(project);

  console.log();
  console.log('start linting...');
  for (const rule of rules) {
    for (const warning of rule(project)) {
      console.log(`- ${warning.code} ${warning.message}`);
    }
  }
}

main();
