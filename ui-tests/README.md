# UI tests (Playwright + TypeScript)

## Setup

From repo root:

```bash
npm --prefix ui-tests i
npx --prefix ui-tests playwright install
```

Or from inside `ui-tests/`:

```bash
npm i
npx playwright install
```

## Run

- `PW_BASE_URL` задає baseUrl (default: `http://127.0.0.1:5173`)

From repo root:

```bash
PW_BASE_URL=http://127.0.0.1:5173 npm --prefix ui-tests test
```

Or from inside `ui-tests/`:

```bash
PW_BASE_URL=http://127.0.0.1:5173 npm test
```

Headed:

```bash
PW_BASE_URL=http://127.0.0.1:5173 npm --prefix ui-tests run test:headed
```
