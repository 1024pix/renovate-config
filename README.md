# Pix Renovate Config

## Why ?

To help developers maintain dependencies up-to-date, we use Renovate with a shared configuration.

Dependencies update can be monitored on the dashboard
https://app.renovatebot.com/dashboard#github/1024pix/renovate-config/

## Setup

Choose your `preset` :

- `default`:
  - wait 7 days after a version is published on npm to select it;
  - runs hourly every weekday;
  - create at most 5 pull request per week;
  - do not merge.
- `aggressive`:
  - runs several times per day;
  - create as many pull request as necessary;
  - merge if tests pass (do not wait for review).

Create a `renovate.json` file under `.github` folder.

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>1024pix/renovate-config:<PRESET>"],
  "enabled": true
}
```

Substitute your preset, eg. `github>1024pix/renovate-config:default`.

Ask an organization Github administrator to activate Renovate application on the repository.

Check the logs to make sure it starts for the first time, even if it does not detect any outdated dependency.
Eg. for `pix-bot` repository https://app.renovatebot.com/dashboard#github/1024pix/pix-bot
