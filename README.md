# Pix Renovate Config

Shared [Renovate](https://docs.renovatebot.com/) configuration for the 1024pix repositories,
so developers keep their dependencies up-to-date with a consistent policy.

Dependency updates for this repository can be monitored on the dashboard
https://app.renovatebot.com/dashboard#github/1024pix/renovate-config/

## Available configurations

A repository extends **one entry point**, picked according to its stack. Each entry point
builds on `default`.

| Entry point         | For                                             | Key differences from `default`                                                                                                                              |
| ------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`           | Common base, extended by the others             | —                                                                                                                                                           |
| `js-project`        | JS / Ember applications and libraries           | Adds the `presets/js/*` families ; `rangeStrategy: "bump"` on `devDependencies`                                                                             |
| `data-project`      | Python, Scala/Spark, Airflow, dbt, JVM projects | Adds the `presets/data/*` families ; `prConcurrentLimit: 10` ; runs any time on weekdays ; automerges patches for the data stack (except Airflow and Spark) |
| `buildpack-project` | Buildpack repositories (typically forks)        | `forkProcessing: "enabled"` ; `minimumReleaseAge: "0"` ; runs any time on weekdays                                                                          |

### What `default` provides

- based on `config:best-practices`;
- runs on weekdays, at night (00:00–03:59 UTC);
- waits 7 days after a version is published on npm before selecting it;
- at most 5 concurrent PRs, no hourly PR limit;
- `[BUMP]` commit-message prefix, `dependencies` label, never rebases open PRs;
- shared building blocks from `presets/`: Scalingo addon datasources and custom managers
  for Postgres/Redis, Docker Hub authentication, the CircleCI orb custom manager,
  GitHub Actions (pinned to digests, grouped, auto-merged), and lockfile maintenance.

### Dependency families

Auto-merge is a property of a **dependency family**, not of the whole repository. Each family
lives in its own preset with a `groupName` and its own policy: an update to a family is
gathered into a single PR (across every folder of a monorepo), and eligible updates are
labelled `auto-bump` and merged automatically.

- `js-project` families: internal `@1024pix/*` packages, infra images (`nginx`, `redis`,
  `postgres`), `node`, lint & test tooling (`eslint`, `stylelint`, `prettier`, `sinon`,
  `qunit`, `mocha`, `cypress`, …), other tools, and OpenTelemetry source directories.
- `data-project` families: `spark`, `airflow`, `dbt`, `python`, `jmx-prometheus`,
  `toolchain-jvm`, `toolchain-python`, `toolchain-scala`, plus version constraints imposed
  by Spark (JDK 17, Scala 2.12) and Airflow (Python 3.13).

Anything not covered by a family keeps the default per-folder isolation
(`presets/js/group-by-directory`).

### Deprecated presets

`no-auto`, `auto-patch`, `auto-minor` and `aggressive` no longer exist. Repositories that
extended them must migrate to `js-project` or `data-project`.

## Project onboarding

Create a `renovate.json` file under the `.github` folder:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>1024pix/renovate-config:<ENTRY_POINT>"]
}
```

Substitute your entry point, e.g. `github>1024pix/renovate-config:js-project`.

Ask a Github organization administrator to activate the application [Renovate][renovate] on
the repository.

> Auto-merge also requires the application [Renovate Approve][renovate-approve] to be enabled
> on the repository.

Check the execution logs to make sure it starts for the first time, even if it does not
detect any outdated dependency.
Eg. for `pix-bot` repository https://app.renovatebot.com/dashboard#github/1024pix/pix-bot

### Onboarding forked projects

`buildpack-project` already enables fork processing. For any other entry point on a fork, add
`"forkProcessing": "enabled"` to the `renovate.json` file.

Issues are disabled by default on forked projects, and the Dependency Dashboard needs Github
Issues to appear.

## Repository layout

```
default.json              # common base
js-project.json           # entry point: JS / Ember
data-project.json         # entry point: data stack
buildpack-project.json    # entry point: buildpack repos
presets/                  # shared building blocks (Scalingo, Docker, CircleCI, GitHub Actions, lockfile)
presets/js/               # JS dependency families
presets/data/             # data dependency families
scripts/                  # generators for OpenTelemetry monorepo presets
```

The order of `extends` is significant: the family presets must stay **after**
`presets/js/group-by-directory` so that their `additionalBranchPrefix: ""` takes precedence.
Reordering these lists alphabetically would silently change the behaviour.

## Development

Requires Node.js (see `package.json` `engines`).

```sh
npm install
npm run lint       # prettier --check
npm run lint:fix   # prettier --write
npm test           # renovate-config-validator on every entry point and preset
```

The `local>` references in `extends` are not resolved by the validator: when adding one,
check by hand that the target path exists on the branch.

The `scripts/` helpers regenerate the OpenTelemetry presets (`presets/js/open-telemetry-*`)
by listing the packages of a monorepo and mapping each one to its source directory. Set
`GITHUB_TOKEN` to avoid API rate limits; run with `--help` for usage.

[renovate]: https://github.com/apps/renovate/installations/new
[renovate-approve]: https://github.com/apps/renovate-approve/installations/new
