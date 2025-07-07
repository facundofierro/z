#!/bin/bash

# Z Language Extension Deployment Script
# This script automates testing, building, versioning, packaging, and installing the Z Language extension

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to increment version
increment_version() {
    local version=$1
    local type=${2:-patch}  # patch, minor, major

    local major=$(echo $version | cut -d. -f1)
    local minor=$(echo $version | cut -d. -f2)
    local patch=$(echo $version | cut -d. -f3)

    case $type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
    esac

    echo "$major.$minor.$patch"
}

# Parse command line arguments
VERSION_TYPE="patch"
SKIP_TESTS=false
FORCE_INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --major)
            VERSION_TYPE="major"
            shift
            ;;
        --minor)
            VERSION_TYPE="minor"
            shift
            ;;
        --patch)
            VERSION_TYPE="patch"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --force)
            FORCE_INSTALL=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --major       Increment major version (x.0.0)"
            echo "  --minor       Increment minor version (0.x.0)"
            echo "  --patch       Increment patch version (0.0.x) [default]"
            echo "  --skip-tests  Skip running tests"
            echo "  --force       Force install even if version exists"
            echo "  -h, --help    Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Z Language Extension Deployment${NC}"
echo "================================="

# Check if we're in the right directory
if [[ ! -f "vscode/package.json" ]] || [[ ! -f "z-language-server/package.json" ]]; then
    print_error "Please run this script from the root of the Z language project"
    exit 1
fi

# Step 1: Run tests
if [[ "$SKIP_TESTS" == false ]]; then
    print_step "Running tests in z-language-server..."
    cd z-language-server
    if pnpm test; then
        print_success "All tests passed!"
    else
        print_error "Tests failed! Aborting deployment."
        exit 1
    fi
    cd ..
else
    print_warning "Skipping tests (--skip-tests flag used)"
fi

# Step 2: Build language server
print_step "Building z-language-server..."
cd z-language-server
if pnpm build; then
    print_success "Language server built successfully!"
else
    print_error "Language server build failed!"
    exit 1
fi
cd ..

# Step 3: Get current version and increment
print_step "Managing version..."
CURRENT_VERSION=$(node -p "require('./vscode/package.json').version")
NEW_VERSION=$(increment_version $CURRENT_VERSION $VERSION_TYPE)

print_step "Updating version from $CURRENT_VERSION to $NEW_VERSION..."

# Update version in vscode/package.json
cd vscode
npm version $NEW_VERSION --no-git-tag-version
cd ..

# Step 4: Compile VSCode extension
print_step "Compiling VSCode extension..."
cd vscode
if npm run compile; then
    print_success "VSCode extension compiled successfully!"
else
    print_error "VSCode extension compilation failed!"
    exit 1
fi

# Step 5: Package the extension
print_step "Packaging extension..."
EXTENSION_FILE="z-language-$NEW_VERSION.vsix"

if npm run package; then
    print_success "Extension packaged as $EXTENSION_FILE"
else
    print_error "Extension packaging failed!"
    exit 1
fi

cd ..

# Step 6: Check if extension file exists
if [[ ! -f "vscode/$EXTENSION_FILE" ]]; then
    print_error "Extension file not found: vscode/$EXTENSION_FILE"
    exit 1
fi

# Step 7: Check if Cursor is available
if ! command -v cursor &> /dev/null; then
    print_warning "Cursor command not found. Please install the extension manually:"
    print_warning "File location: $(pwd)/vscode/$EXTENSION_FILE"
    print_warning "Run: cursor --install-extension $(pwd)/vscode/$EXTENSION_FILE"
    exit 0
fi

# Step 8: Install extension in Cursor
print_step "Installing extension in Cursor..."

# Check if extension is already installed (if not forcing)
if [[ "$FORCE_INSTALL" == false ]]; then
    if cursor --list-extensions | grep -q "z-language@$NEW_VERSION"; then
        print_warning "Extension version $NEW_VERSION is already installed. Use --force to reinstall."
        exit 0
    fi
fi

if cursor --install-extension "$(pwd)/vscode/$EXTENSION_FILE"; then
    print_success "Extension installed successfully in Cursor!"
else
    print_error "Failed to install extension in Cursor"
    print_warning "You can install it manually with:"
    print_warning "cursor --install-extension $(pwd)/vscode/$EXTENSION_FILE"
    exit 1
fi

# Step 9: Clean up old extension files (keep last 3 versions)
print_step "Cleaning up old extension files..."
cd vscode
ls -t z-language-*.vsix 2>/dev/null | tail -n +4 | xargs -r rm
print_success "Cleanup completed"
cd ..

# Final summary
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================="
echo "📦 Extension: z-language-$NEW_VERSION.vsix"
echo "📁 Location: $(pwd)/vscode/"
echo "🔄 Version: $CURRENT_VERSION → $NEW_VERSION"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test the extension in Cursor with a .z file"
echo "2. Commit the version change: git add . && git commit -m \"Release v$NEW_VERSION\""
echo "3. Create a git tag: git tag v$NEW_VERSION"
echo ""