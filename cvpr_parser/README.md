# CVPR Papers Parser

A Node.js tool to parse CVPR conference papers from HTML into CSV format.

## Features

- Extracts paper titles, authors, poster session information, location, and URLs
- Converts extracted data to CSV format
- Can fetch HTML directly from the CVPR website or parse from a local file
- Simple command-line interface

## Installation

```bash
npm install
```

## Usage

### Direct from URL

Run the parser to fetch data directly from the CVPR website:

```bash
npm run parse
```

This will use the default URL: https://cvpr.thecvf.com/Conferences/2025/AcceptedPapers

### From a custom URL

```bash
node parse_cvpr.js https://example.com/custom-cvpr-url [output_csv_file]
```

### From a local HTML file

If you've already saved the HTML content:

```bash
node parse_cvpr.js <input_html_file> [output_csv_file]
```

Example:

```bash
node parse_cvpr.js cvpr_sample.html custom_output.csv
```

### Using npm scripts

The package includes convenience scripts:

```bash
# Default URL
npm run parse

# Use sample HTML file
npm run parse:sample

# Explicitly use the CVPR URL
npm run parse:url
```

## Output Format

The parser produces a CSV file with the following columns:

- Title
- Authors
- Poster Session
- Location (includes Poster Number in the format "ExHall D Poster #417")
- URL (if available)

## License

ISC
