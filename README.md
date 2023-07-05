# Pix Renovate Config

## Why ?

To help developers maintain dependencies up-to-date, we use Renovate with a shared configuration.

Dependencies update can be monitored on the dashboard
https://app.renovatebot.com/dashboard#github/1024pix/renovate-config/

## Available configurations

Three `presets` are available :

- `default`:
  - runs hourly every weekday;
  - wait 7 days after a version is published on npm to select it;
  - create at most 5 pull request per week;
  - do not merge.
- `confident`:
  - runs hourly every weekday;
  - wait 7 days after a version is published on npm to select it;
  - create at most 5 pull request per week;
  - approves its own PR using Github App Renovate Approve;
  - adds label ":rocket: Ready to Merge" to the PR if [Renovate's confidence](https://docs.renovatebot.com/merge-confidence/) is "high" or "very high";
  - Jean Pierre rebases and merges the PR if required status checks are ok (ex: Actions, CircleCi, Deploy ...).
- `aggressive`:
  - runs hourly every weekday;
  - wait 7 days after a version is published on npm to select it;
  - create as many pull request as necessary;
  - approves its own PR using Github App Renovate Approve;
  - adds label ":rocket: Ready to Merge" to the PR;
  - Jean Pierre rebases and merges the PR if required status checks are ok (ex: Actions, CircleCi, Deploy ...).

## Project onboarding

Create a `renovate.json` file under `.github` folder.

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>1024pix/renovate-config:<PRESET>"],
  "enabled": true
}
```

Substitute your preset, eg. `github>1024pix/renovate-config:default`.

Ask a Github organization administrator to activate the application [Renovate][renovate] on the repository.

> Automerge functionnality also requires the application [Renovate Approve][renovate-approve] to be enabled on the repository.

Check the execution logs to make sure it starts for the first time, even if it does not detect any outdated dependency.
Eg. for `pix-bot` repository https://app.renovatebot.com/dashboard#github/1024pix/pix-bot

### Onboarding forked projects

If the project is a fork, you need to add the following configuration in the `renovate.json` file : `"includeForks": true`

Issues are disabled by default on forked projects, Dependency dashboard needs Github Issues to appear.

[renovate]: https://github.com/apps/renovate/installations/new
[renovate-approve]: https://github.com/apps/renovate-approve/installations/new
