# Pix Renovate Config

Shared [Renovate](https://docs.renovatebot.com/) configuration for the 1024pix repositories,
so developers keep their dependencies up-to-date with a consistent policy.

Dependency updates for this repository can be monitored on the dashboard
https://app.renovatebot.com/dashboard#github/1024pix/renovate-config/

## Available configurations

A repository extends **one entry point**, picked according to its stack. Each entry point
builds on `default`.

| Entry point         | For                                             | Key differences from `default`                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `default`           | Common base, extended by the others             | —                                                                                                                                                                                                                                                      |
| `js-project`        | JS / Ember applications and libraries           | Adds the `presets/js/*` families ; `rangeStrategy: "bump"` on `devDependencies`                                                                                                                                                                        |
| `data-project`      | Python, Scala/Spark, Airflow, dbt, JVM projects | Adds the `presets/data/*` families ; `prConcurrentLimit: 10` ; runs any time on weekdays ; automerges patches for the data stack (except Airflow and Spark) ; rebases open PR ([auto](https://docs.renovatebot.com/configuration-options/#rebasewhen)) |
| `buildpack-project` | Buildpack repositories (typically forks)        | `forkProcessing: "enabled"` ; `minimumReleaseAge: "0"` ; runs any time on weekdays                                                                                                                                                                     |

### What `default` provides

- based on [`config:best-practices`](https://docs.renovatebot.com/presets-config/#configbest-practices);
- runs on weekdays, at night (00:00–03:59 UTC);
- waits 7 days after a version is published on npm before selecting it;
- at most 5 concurrent PRs, no hourly PR limit;
- `[BUMP]` commit-message prefix, `dependencies` label, never rebases open PRs;
- shared building blocks from `presets/`: Scalingo addon datasources and custom managers
  for Postgres/Redis, Docker Hub authentication, the CircleCI orb custom manager,
  GitHub Actions (pinned to digests, grouped, auto-merged), and lockfile maintenance.

### Dependency families

A **dependency family** bundles packages that must move together. Each family lives in its own
preset under `presets/js/` or `presets/data/`: it sets a `groupName` so every update to the
family lands in a **single PR** (across every folder of a monorepo, via
`additionalBranchPrefix: ""`), and it carries its own auto-merge policy. Auto-merge is decided
**per family**, not for the whole repository — some families auto-merge minor/patch (label
`auto-bump`), some auto-merge every update type, and some never merge on their own.

Anything not matched by a family keeps the default per-folder isolation
(`presets/js/group-by-directory`) and gets one PR per folder.

#### `js-project` families (`presets/js/`)

| Family                                                                                     | Packages                                                                                                                            | Grouping & auto-merge                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1024pix`                                                                                  | `@1024pix/*`                                                                                                                        | `minimumReleaseAge: 0`, no concurrent-PR limit, `rangeStrategy: bump`. Minor/patch auto-merged, **except `@1024pix/epreuves-components`**. Dedicated groups: `pix-ui` (npm), `pix-ember-testing-library`, `pix-stylelint-config` — one PR per app; `pix-eslint-config`, `pix-eslint-plugin` — one PR across all apps. |
| `infra`                                                                                    | `nginx`, `redis`, `postgres` images (CircleCI, docker-compose, Dockerfile, GitHub Actions)                                          | One PR per image, not folder-isolated. **No auto-merge.** The `postgres`/`redis` Docker datasource is disabled (these images are tracked through the Scalingo addons instead), and Scalingo addon bumps are explicitly never auto-merged.                                                                             |
| `lint-and-test`                                                                            | `eslint`, `@eslint`, `stylelint`, `prettier`, `sinon`, `qunit`, `mocha`, `chai`, `cypress`, `@ember/test-helpers`, `@formatjs/intl` | One PR across all folders, majors not split. **All update types auto-merged** (`auto-bump`), including majors. Sub-grouped by tool: `eslint` (+ `globals`), `stylelint`, `prettier`, `sinon`, `qunit`, `mocha`, `chai`, `cypress`, `@formatjs/intl`.                                                                  |
| `node`                                                                                     | `node`, `cimg/node`                                                                                                                 | `rangeStrategy: bump`, `versioning: node`. Only **minor/patch** are grouped as `node` and auto-merged; majors stay manual.                                                                                                                                                                                            |
| `tools`                                                                                    | `npm-run-all2`, `p-queue`                                                                                                           | One PR across folders, majors not split. Minor/patch auto-merged (`auto-bump`), majors manual.                                                                                                                                                                                                                        |
| OpenTelemetry (`open-telemetry-api`, `-experimental`, `-contrib`, `-semantic-conventions`) | `@opentelemetry/*`                                                                                                                  | Not an auto-merge family: only maps each package to its `sourceDirectory` in the `opentelemetry-js` monorepo so Renovate shows the right release notes.                                                                                                                                                               |

#### `data-project` families (`presets/data/`)

Baseline for the data stack (`data-project.json`): every **patch** is auto-merged (`auto-bump`),
**except the exact package `apache-airflow` and any package whose name contains `spark`**
(`apache-airflow-providers-*` and the `apache/airflow` image are not covered by that exclusion).

| Family             | Packages                                                                                                                            | Grouping & auto-merge                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spark`            | `spark` image, `org.apache.spark:*`, `com.holdenkarau:spark-*`, and `SPARK_VERSION` in the Kubernetes-operator DAG (custom manager) | One PR, minor/patch and majors not split. **Never auto-merged** (excluded from the baseline).                                                                |
| `airflow`          | `apache/airflow` image, `apache-airflow*` providers                                                                                 | One PR, minor/patch and majors not split. The baseline patch auto-merge is switched off for the exact name `apache-airflow`.                                 |
| `dbt`              | `dbt-*` (core + adapters)                                                                                                           | One PR. Minor/patch auto-merged (`auto-bump`), majors manual.                                                                                                |
| `python`           | `python` (`.python-version`)                                                                                                        | One PR (`python`). `requires-python` and the `-pythonX.Y` suffix of the airflow image tag stay manual.                                                       |
| `jmx-prometheus`   | `prometheus/jmx_exporter` — Dockerfile `ENV` and the JAR path in the DAG (custom manager)                                           | One PR, majors not split.                                                                                                                                    |
| `postgresql`       | `org.postgresql:*` JDBC driver in `build.sbt`                                                                                       | `groupName: null` — **not grouped**, one PR per update. The Scalingo Postgres addon is handled by the shared presets.                                        |
| `toolchain-jvm`    | `org.scala-lang:scala-library`, `sbt/sbt`, `java-jdk`, `eclipse-temurin`                                                            | One PR (`toolchain-jvm`) covering `build.sbt`, the sbt image tag, `build.properties` and the CI JDK. No auto-merge of its own (patches follow the baseline). |
| `toolchain-python` | `ruff`, `pytest`, `pytest-*`, `pre-commit` in `[dependency-groups] dev` / `tool.uv.dev-dependencies`                                | One PR (`outillage-python`). **All updates auto-merged** (`auto-bump`).                                                                                      |
| `toolchain-scala`  | sbt plugins + `scalafmt` (`outillage-scala`); `org.scalatest:*` + `org.scalactic:*` (`tests-scala`)                                 | Two PRs, both **fully auto-merged** (`auto-bump`). `tests-scala` keeps scalatest/scalactic on the same version.                                              |

Version ceilings (`presets/data/constraints.json`, not a family): JDK pinned to 17 and Scala to
2.12 (required by Spark < 4), Python pinned to 3.13 (imposed by the airflow image tag suffix).

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
