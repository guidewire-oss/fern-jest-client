# Makefile for fern-jest-client

.PHONY: help build test test-unit test-integration lint format clean install dev

# Default target
help:
	@echo "Available targets:"
	@echo "  install          - Install dependencies"
	@echo "  build           - Build the TypeScript project"
	@echo "  test            - Run all tests"
	@echo "  test-unit       - Run unit tests only"
	@echo "  test-integration - Run integration tests only" 
	@echo "  lint            - Run ESLint"
	@echo "  format          - Format code with Prettier"
	@echo "  clean           - Clean build artifacts"
	@echo "  dev             - Build and run tests in development mode"
	@echo "  publish-prep    - Prepare package for publishing"

# Install dependencies
install:
	npm install

# Build TypeScript
build:
	npm run build

# Run all tests
test: build
	npm test

# Run unit tests only
test-unit: build
	npm run test:unit

# Run integration tests only  
test-integration: build
	npm run test:integration

# Lint code
lint:
	npm run lint

# Format code
format:
	npm run format

# Clean build artifacts
clean:
	npm run clean

# Development workflow
dev: clean install build test

# Prepare for publishing
publish-prep: clean install lint format build test
	@echo "Package ready for publishing"
	@echo "Run 'npm publish' to publish to npm registry"

# Test with Fern platform (requires fern-platform to be running)
test-with-fern:
	@echo "Testing integration with Fern platform..."
	@echo "Make sure fern-platform is running on http://localhost:8090"
	FERN_REPORTER_BASE_URL=http://localhost:8090 npm test

# Check package
check:
	npm run build
	npm run lint
	npm test
	@echo "All checks passed!"