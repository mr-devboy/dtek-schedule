# Changelog

## [2.1.0](https://github.com/mr-devboy/dtek-schedule/compare/v2.0.0...v2.1.0) (2026-10-05)


### Features

* extend silent night mode to 22:00-08:00 ([0cb1214](https://github.com/mr-devboy/dtek-schedule/commit/0cb1214098a553d61740d05af3c6e3769c1c81b2))

## [2.0.0](https://github.com/mr-devboy/dtek-schedule/compare/v1.1.1...v2.0.0) (2026-10-05)


### ⚠ BREAKING CHANGES

* the PAT secret is no longer used. Remove it from the repository secrets and revoke the token.
* bot state moved from the artifacts/ folder in main to the artifacts branch. The branch is created on the first run, which sends a new message. Bot commits "chore: update artifacts" no longer land in main.
* when the schedule changes during the day, the bot sends a new message (with a notification) as a reply to the previous one instead of editing a single message per day.

### Features

* replace timestamps emoji and drop seconds ([7c82aa6](https://github.com/mr-devboy/dtek-schedule/commit/7c82aa6b5276d3a842235964440444f8ddab3145))
* reply with a new message when the schedule changes ([6700b11](https://github.com/mr-devboy/dtek-schedule/commit/6700b11ff5e36f397644026a961c03234ce27243))
* store bot state in a separate artifacts branch ([e2ea131](https://github.com/mr-devboy/dtek-schedule/commit/e2ea1319dc9795eab562358165572c30be9c3008))


### Bug Fixes

* close the browser before retrying ([31dc16c](https://github.com/mr-devboy/dtek-schedule/commit/31dc16c5d5a1927f959827e305c3dc1b71af3a0b))
* correct the missing bot token error message ([e0d2705](https://github.com/mr-devboy/dtek-schedule/commit/e0d27059ba6ca60bd1ac0bc847cda4751d823af4))
* exit with non-zero code on failure ([8842841](https://github.com/mr-devboy/dtek-schedule/commit/8842841e5fed6ef3300f9d15c1478baeb13110ad))
* ignore "message is not modified" error ([6cf6431](https://github.com/mr-devboy/dtek-schedule/commit/6cf6431470d958d69ef34807b5f0799487382a00))
* limit shutdowns data retries ([5100b25](https://github.com/mr-devboy/dtek-schedule/commit/5100b25959433855cce2fa308365b08912903bfd))
* remove extra blank line and stray backslash from the message ([5323955](https://github.com/mr-devboy/dtek-schedule/commit/5323955487d06946fcf71da3388c0ec14f014a24))
* report the actual error when schedule generation fails ([f618bf7](https://github.com/mr-devboy/dtek-schedule/commit/f618bf734cb43e4151bc64c8bc1ac6ef747faae4))
* retry sending the same notification ([1fe5e38](https://github.com/mr-devboy/dtek-schedule/commit/1fe5e383f5fb5240133285c9147ddde4ead9a955))
* show a clear error when the group is not found ([ef43656](https://github.com/mr-devboy/dtek-schedule/commit/ef43656e2b5ef027d91fa6297d32452f0d72b517))
* skip the run when there is no schedule for today ([964beec](https://github.com/mr-devboy/dtek-schedule/commit/964beec90a6492f7f79a345543f85bc30185f977))
* use disable_notification for silent night mode ([2b59b0e](https://github.com/mr-devboy/dtek-schedule/commit/2b59b0e646e85d7b9ba178551bb6c301aff959a3))


### Documentation

* link releases in README ([be35642](https://github.com/mr-devboy/dtek-schedule/commit/be356420a776a78cc2cb2083518e37afdd22b178))
* remove yarn and multiple groups sections from README ([3b2ede0](https://github.com/mr-devboy/dtek-schedule/commit/3b2ede03ac7042fcba1af9c1493ccc0636505fc4))
* switch README to informal address and polish wording ([95978ab](https://github.com/mr-devboy/dtek-schedule/commit/95978ab9a9f2c4855576db8ef26fd1ff08069b3b))


### Continuous Integration

* add release-please ([5c287b0](https://github.com/mr-devboy/dtek-schedule/commit/5c287b08d34631b181904efc68a9a82d357344c4))
* keep scheduled workflow enabled via GitHub API ([3396564](https://github.com/mr-devboy/dtek-schedule/commit/339656421aacd41d98c1feb29fccdbfbe67ae7fa))
* replace PAT with GITHUB_TOKEN ([34a5355](https://github.com/mr-devboy/dtek-schedule/commit/34a53551461f54bdcf828bf897d0626674311744))
* use npm ci ([1ab5a4c](https://github.com/mr-devboy/dtek-schedule/commit/1ab5a4caf16bea17ed230b4311b5304be80b9bfa))
