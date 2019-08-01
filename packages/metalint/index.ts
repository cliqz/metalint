import { applyFix } from './src/fix';
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
import checkPackageNormalization from './src/rules/package-normalize';

// Rules - lerna
import checkLernaAttributes from './src/rules/lerna-unknown-attributes';
import checkLernaWorkspaces from './src/rules/lerna-workspaces';

// Rule - license
import { checkLicenses } from './src/licences';

async function main() {
  const runInCI = process.argv[process.argv.length - 1] === '--ci';
  if (runInCI === true) {
    console.log('Running in CI mode. Auto-fix disabled.');
  }

  const project = await loadProject();
  const rules: Rule[] = [
    // dependencies
    checkInternalDependenciesVersions,
    checkExternalDependenciesVersions,

    // naming consistency
    checkPackageFolderName,
    checkPackageNamespaceConsistency,

    // check that mandatory fields exist + consistency
    checkPackageAttributesMandatory,
    checkPackageAttributesConsistency,
    checkPackageNormalization,

    // Lerna
    checkLernaWorkspaces,
    checkLernaAttributes,
  ];

  let numberOfErrors = 0;

  // TODO - make optional
  for await (const diagnostic of checkLicenses(project)) {
    numberOfErrors += 1;
    console.log(`- ${diagnostic.code} ${diagnostic.message}`);
    if (diagnostic.fix !== undefined && runInCI === false) {
      console.log('  ~ auto-fixing!');
      await applyFix(diagnostic.fix);
    }
  }

  console.log();
  console.log('start linting...');
  for (const rule of rules) {
    for (const diagnostic of rule(project)) {
      numberOfErrors += 1;
      console.log(`- ${diagnostic.code} ${diagnostic.message}`);
      if (diagnostic.fix !== undefined && runInCI === false) {
        console.log('  ~ auto-fixing!');
        await applyFix(diagnostic.fix);
      }
    }
  }

  // Return non-zero error code if warnings were emitted
  if (numberOfErrors !== 0) {
    process.exit(1);
  }
}

main();
