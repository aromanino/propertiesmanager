# PropertiesManager - Test Suite

This directory contains the test suite for the propertiesmanager package.

## Test Structure

The test suite is organized into the following files:

### 1. `basic-loading.test.js`
Tests the basic functionality of loading properties:
- Loading default production properties
- Verifying all expected properties exist
- Checking correct structure for nested objects
- Validating data types

### 2. `environment-switching.test.js`
Tests environment-based configuration loading:
- Loading production properties (NODE_ENV=production)
- Loading development properties (NODE_ENV=dev)
- Loading test properties (NODE_ENV=test)
- Fallback to production for invalid environments
- Environment-specific property differences

### 3. `command-line-override.test.js`
Tests command-line parameter override functionality:
- Overriding simple string properties
- Overriding numeric properties
- Overriding nested properties using dot notation
- Overriding deeply nested properties
- Multiple property overrides at once
- Boolean property overrides
- Preventing addition of non-existent properties

### 4. `complex-objects.test.js`
Tests handling of complex nested objects:
- Correct handling of nested object structures
- Preservation of object structure during loading
- Maintaining correct data types in nested objects
- Multiple levels of nesting
- Environment-specific nested properties

## Running Tests

To run all tests:
```bash
npm test
```

To run a specific test file:
```bash
npx mocha test/basic-loading.test.js
```

To run tests with verbose output:
```bash
npx mocha test/**/*.test.js --reporter spec
```

## Test Configuration

The tests use a sample configuration file located at `config/default.json` with the following structure:

```json
{
    "production": { ... },
    "dev": { ... },
    "test": { ... }
}
```

## Dependencies

- **Mocha**: Test framework
- **Chai**: Assertion library

## Test Coverage

The test suite covers:
- ✅ Basic property loading
- ✅ Environment switching (production, dev, test)
- ✅ Command-line parameter overrides
- ✅ Nested object handling
- ✅ Data type preservation
- ✅ Fallback behavior
- ✅ Edge cases

## Notes

- Tests clean the require cache before each test to ensure isolation
- Command-line override tests spawn child processes to test actual CLI behavior
- The helper directory contains scripts used by the command-line override tests
