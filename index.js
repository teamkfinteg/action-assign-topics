/*
* Build the stub/support file for README.md
* Each store_type defined in the integration-manifest.json will generate a set of tables to be included in the readme build
* This should be run each time the store_types object gets regenerated
 */
const fs = require('fs');
const core = require('@actions/core');

const JSONFILE = process.env.JSONFILE // integration-manifest.json
const STUBFILE = process.env.STUBFILE // readme-src/store-types-tables.md

const checked = 'Checked [x]'
const unchecked = 'Unchecked [ ]'
function createCustomFieldsTable(PropertiesObject) {
  try {
    var customTable = '';
    for (const param in PropertiesObject) {
      const CustomFields = PropertiesObject[param]
      const { Name,
        DisplayName,
        Type,
        DefaultValue,
        Required } = CustomFields
      customTable += `|${Name}|${DisplayName}|${Type}|${DefaultValue}|${Required}|
`
    };
    return customTable;
  }
  catch (error) {
    core.setFailed(error.message);
  }
}
function createEntryParametersTable(PropertiesObject) {
  try {
    var entryParametersTable = '';
    for (const param in PropertiesObject) {
      const EntryParameters = PropertiesObject[param]
      const { Name,
        DisplayName,
        Type,
        DefaultValue,
        DependsOn,
        Options,
        RequiredWhen } = EntryParameters;
      const RequiredWhenArray = []
      RequiredWhen.OnAdd ? RequiredWhenArray.push('Adding') : false;
      RequiredWhen.HasPrivateKey ? RequiredWhenArray.push('Using Private Key') : false;
      RequiredWhen.OnRemove ? RequiredWhenArray.push('Removing') : false;
      RequiredWhen.OnReenrollment ? RequiredWhenArray.push('Reenrolling') : false;
      entryParametersTable += `|${Name}|${DisplayName}|${Type}|${DefaultValue}|${RequiredWhenArray}|
`;
    };
    return entryParametersTable;
  }
  catch (error) {
    core.setFailed(error.message);
  }
}
function buildStoreTypesMD() {
  try {
    const inputFile = core.getInput('input-file') || 'integration-manifest.json';
    const outputFile = core.getInput('output-file') || 'readme-src/store-types-tables.md';
    const newdata = JSON.parse(fs.readFileSync(inputFile));
    var stores = newdata.about.orchestrator.store_types;
    var markdown = '';
    for (const store in stores) {
      const storeDefinition = stores[store];
      const { ShortName,
        Name,
        CustomAliasAllowed,
        PrivateKeyAllowed,
        Properties, // Array of Properties Parameters
        EntryParameters, // Array of Entry Parameters
        PasswordOptions // get the .Style for PFXPasswordStyle
      } = storeDefinition;
      var { ServerRequired,
        BlueprintAllowed,
        StorePathValue,
        PowerShell,
        SupportedOperations
      } = storeDefinition;

      // Update the varialbes with the text to display in markdown
      ServerRequired ? ServerRequired = checked : ServerRequired = unchecked;
      StorePathValue == '' ? StorePathValue = 'Freeform' : StorePathValue = StorePathValue;
      ServerRequired ? ServerRequired = checked : ServerRequired = unchecked;
      BlueprintAllowed ? BlueprintAllowed = checked : BlueprintAllowed = unchecked;
      PowerShell ? PowerShell = checked : PowerShell = unchecked;
      PasswordOptions.StoreRequired ? StoreRequired = checked : StoreRequired = unchecked;
      PasswordOptions.EntrySupported ? EntrySupported = checked : EntrySupported = unchecked;
      PFXPasswordStyle = PasswordOptions.Style;
      imagePre = ShortName.toLowerCase()
      const supportedOperationsArray = Object.keys(SupportedOperations)
        .filter(key => SupportedOperations[key])
        .map(key => key);
      var customTable = createCustomFieldsTable(Properties);
      var entryParametersTable = createEntryParametersTable(EntryParameters);
      

// Contents of the markdown file with template string replacement
      var markdown = markdown + `
### ${Name} Store Type
#### kfutil Create ${Name} Store Type
The following commands can be used with [kfutil](https://github.com/Keyfactor/kfutil). Please refer to the kfutil documentation for more information on how to use the tool to interact w/ Keyfactor Command.

\`\`\`
bash
kfutil login
kfutil store - types create--name ${Name} 
\`\`\`

#### UI Configuration
##### UI Basic Tab
| Field Name              | Required | Value                                     |
|-------------------------|----------|-------------------------------------------|
| Name                    | &check;  | ${Name}                          |
| ShortName               | &check;  | ${ShortName}                          |
| Custom Capability       |          | Unchecked [ ]                             |
| Supported Job Types     | &check;  | Inventory,${supportedOperationsArray}     |
| Needs Server            | &check;  | ${ServerRequired}                         |
| Blueprint Allowed       |          | ${BlueprintAllowed}                       |
| Uses PowerShell         |          | ${PowerShell}                             |
| Requires Store Password |          | ${StoreRequired}                          |
| Supports Entry Password |          | ${EntrySupported}                         |
      
![${imagePre}_basic.png](docs%2Fscreenshots%2Fstore_types%2F${imagePre}_basic.png)

##### UI Advanced Tab
| Field Name            | Required | Value                 |
|-----------------------|----------|-----------------------|
| Store Path Type       |          | ${StorePathValue}      |
| Supports Custom Alias |          | ${CustomAliasAllowed} |
| Private Key Handling  |          | ${PrivateKeyAllowed}  |
| PFX Password Style    |          | ${PFXPasswordStyle}   |

![${imagePre}_advanced.png](docs%2Fscreenshots%2Fstore_types%2F${imagePre}_advanced.png)

##### UI Custom Fields Tab
| Name           | Display Name         | Type   | Required | Default Value |
| -------------- | -------------------- | ------ | -------- | ------------- |
${customTable}

**Entry Parameters:**

Entry parameters are inventoried and maintained for each entry within a certificate store.
They are typically used to support binding of a certificate to a resource.

|Name|Display Name| Type|Default Value|Required When |
|----|------------|-----|-------------|--------------|
${entryParametersTable}
`
    }
    fs.writeFile(outputFile, markdown, (err) => {
      if (err)
        console.log(err);
      else {
        console.log(`File written successfully: ${outputFile}`);
      }
    });
  }
  catch (error) {
    core.setFailed(error.message);
  }
}
buildStoreTypesMD();
