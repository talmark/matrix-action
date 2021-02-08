# matrix-action

![verify](https://github.com/Numericas/matrix-action/workflows/verify/badge.svg?branch=main)

A Github Action to report the result of a workflow run to a matrix room.

![image](./assets/screenshot.png)

## Usage

### Report all build results (success, failure, cancelled) to the matrix room.

```yaml
name: verify
on: push
jobs:
  verify:
    runs-on: ubuntu-20.04
    steps:
      - uses: Numericas/matrix-action@v1
        with:
          server: ${{ secrets.MATRIX_SERVER }}
          room-id: ${{ secrets.MATRIX_ROOM_ID }}
          user: ${{ secrets.MATRIX_USER }}
          password: ${{ secrets.MATRIX_PASSWORD }}
          status: ${{ job.status }}
```

### Report only failed builds

If you just want to report specific build results use the `if` directive as shown below, together with the `success()`, `failure()` and `cancelled()` function.

```yaml
name: verify
on: push
jobs:
  verify:
    runs-on: ubuntu-20.04
    steps:
      - uses: Numericas/matrix-action@v1
        with:
          server: ${{ secrets.MATRIX_SERVER }}
          room-id: ${{ secrets.MATRIX_ROOM_ID }}
          user: ${{ secrets.MATRIX_USER }}
          password: ${{ secrets.MATRIX_PASSWORD }}
          status: ${{ job.status }}
        if: failure()
```

### Send a custom message with build result

You can provide a custom message via the `message` input.

```yaml
name: verify
on: push
jobs:
  verify:
    runs-on: ubuntu-20.04
    steps:
      - uses: Numericas/matrix-action@v1
        with:
          server: ${{ secrets.MATRIX_SERVER }}
          room-id: ${{ secrets.MATRIX_ROOM_ID }}
          user: ${{ secrets.MATRIX_USER }}
          password: ${{ secrets.MATRIX_PASSWORD }}
          status: ${{ job.status }}
          message: Integration tests failed
        if: failure()
```


## Access Token Authentication

It is also possible to authenticate to matrix via an access token, but since this will/should expire for security reasons `user` & `password` is recommended.

```yaml
name: verify
on: push
jobs:
  verify:
    runs-on: ubuntu-20.04
    steps:
      - uses: Numericas/matrix-action@v1
        with:
          server: ${{ secrets.MATRIX_SERVER }}
          room-id: ${{ secrets.MATRIX_ROOM_ID }}
          access_token: ${{ secrets.MATRIX_ACCESS_TOKEN }}
          status: ${{ job.status }}
          message: Integration tests failed
        if: failure()
```
