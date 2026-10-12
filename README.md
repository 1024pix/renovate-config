# Pix Renovate Config

Shared [Renovate](https://docs.renovatebot.com/) configuration for the 1024pix repositories,
so developers keep their dependencies up-to-date with a consistent policy.

Dependency updates for this repository can be monitored on the dashboard
https://app.renovatebot.com/dashboard#github/1024pix/renovate-config/

## Available configurations

A repository extends **one entry point**, picked according to its stack.
Each entry point builds on `default`.

| Entry point    | For                                             | Key differences from `default`                                                   |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `default`      | Common base, extended by the others             | —                                                                                |
| `js-app`       | For JS applications                             | Adds the `presets/js-v2/*` families and pin `dependencies` and `devDependencies` |
| `js-lib`       | For JS libraries                                | Adds the `presets/js-v2/*` families and pin only `devDependencies`               |
| `data-project` | Python, Scala/Spark, Airflow, dbt, JVM projects | Adds the `presets/data/*` families                                               |

## Project onboarding

Create a `renovate.json` file under the `.github` folder:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>1024pix/renovate-config:<ENTRY_POINT>"]
}
```

Ask a Github organization administrator to activate the application [Renovate][renovate] on
the repository.

> Auto-merge also requires the application [Renovate Approve][renovate-approve] to be enabled
> on the repository.

Check the Renovate dashboard:
Eg. for `pix-bot` repository https://app.renovatebot.com/dashboard#github/1024pix/pix-bot

### Onboarding forked projects

For any entry point on a fork, add `"forkProcessing": "enabled"` to the `renovate.json` file.

Issues are disabled by default on forked projects, and the Dependency Dashboard needs Github
Issues to appear.

## Development

```sh
npm install
npm run lint       # prettier --check
npm run lint:fix   # prettier --write
npm test           # renovate-config-validator on every entry point and preset
```

[renovate]: https://github.com/apps/renovate/installations/new
[renovate-approve]: https://github.com/apps/renovate-approve/installations/new
