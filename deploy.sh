#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "${GREEN}PureChess Deployment Script${RESET}"
echo "------------------------------"

# Check if javascript-obfuscator is installed
if ! command -v javascript-obfuscator &>/dev/null; then
    echo -e "${RED}Error: javascript-obfuscator is not installed.${RESET}"
    echo "Install it using npm: npm install -g javascript-obfuscator"
    exit 1
fi

# Create upload directory or clear it if it exists
if [ -d "upload" ]; then
    echo -e "${YELLOW}Cleaning existing upload directory...${RESET}"
    rm -rf upload/*
else
    echo "Creating upload directory..."
    mkdir upload
fi

# Create necessary subdirectories in upload folder
echo "Creating directory structure..."
mkdir -p upload/js
mkdir -p upload/js/controllers
mkdir -p upload/js/models
mkdir -p upload/js/models/pieces
mkdir -p upload/js/services
mkdir -p upload/js/utils
mkdir -p upload/js/views
mkdir -p upload/css
mkdir -p upload/img

# Copy HTML files
echo "Copying HTML files..."
cp index.html upload/

# Copy CSS files
echo "Copying CSS files..."
cp css/*.css upload/css/

# Copy image files
echo "Copying image files..."
cp -r img/* upload/img/

# Process and obfuscate JavaScript files
echo -e "${YELLOW}Obfuscating JavaScript files...${RESET}"

# Function to obfuscate a JavaScript file
obfuscate_js() {
    input_file=$1
    output_file=$2
    echo "  Processing $input_file"

    # Create the directory structure if it doesn't exist
    output_dir=$(dirname "$output_file")
    mkdir -p "$output_dir"

    # Obfuscate the JavaScript file
    javascript-obfuscator "$input_file" --output "$output_file" \
        --compact true \
        --control-flow-flattening false \
        --dead-code-injection false \
        --disable-console-output true \
        --identifier-names-generator 'hexadecimal' \
        --rename-globals false \
        --rename-properties false \
        --self-defending true \
        --string-array true
}

# Find and obfuscate all JavaScript files
find js -name "*.js" | while read js_file; do
    output_file="upload/$js_file"
    obfuscate_js "$js_file" "$output_file"
done

# Copy server configuration files for proper MIME types
echo -e "${YELLOW}Copying server configuration files for proper MIME types...${RESET}"

# Check and copy _headers file (Cloudflare Pages)
if [ -f "_headers" ]; then
    cp _headers upload/
    echo "  Copied _headers file for Cloudflare Pages"
else
    echo -e "${RED}  Warning: _headers file not found in project root${RESET}"
    echo "  Creating _headers file in upload directory..."
    cat >upload/_headers <<EOL
/*.js
  Content-Type: application/javascript
EOL
fi

# Check and copy .htaccess file (Apache)
if [ -f ".htaccess" ]; then
    cp .htaccess upload/
    echo "  Copied .htaccess file for Apache servers"
else
    echo -e "${RED}  Warning: .htaccess file not found in project root${RESET}"
    echo "  Creating .htaccess file in upload directory..."
    cat >upload/.htaccess <<EOL
<IfModule mod_mime.c>
  AddType application/javascript .js
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\.(js)$">
    Header set Content-Type "application/javascript"
  </FilesMatch>
</IfModule>
EOL
fi

# Check and copy web.config file (IIS)
if [ -f "web.config" ]; then
    cp web.config upload/
    echo "  Copied web.config file for IIS servers"
else
    echo -e "${RED}  Warning: web.config file not found in project root${RESET}"
    echo "  Creating web.config file in upload directory..."
    cat >upload/web.config <<EOL
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <remove fileExtension=".js" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
    </staticContent>
  </system.webServer>
</configuration>
EOL
fi

echo -e "${GREEN}Deployment preparation completed!${RESET}"
echo "All files are now available in the 'upload' directory."
echo "------------------------------"

# Print statistics
js_count=$(find js -name "*.js" | wc -l)
echo "Files processed:"
echo "  JavaScript files: $js_count"
echo "  CSS files: $(ls -1 css/*.css 2>/dev/null | wc -l)"
echo "  HTML files: $(ls -1 *.html 2>/dev/null | wc -l)"
echo "  Image files: $(find img -type f | wc -l)"
echo "  Server configuration files: 3 (_headers, .htaccess, web.config)"
