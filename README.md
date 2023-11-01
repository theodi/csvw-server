# CSVW Server

CSVW Server is an express-based server that provides an interface to interact with data following the CSV on the Web (CSVW) format. It is designed to support various content negotiation options to deliver data in the most suitable format for the consumer.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Usage](#usage)
4. [API Endpoints](#api-endpoints)
5. [Content Negotiation](#content-negotiation)
6. [Configuration](#configuration)
7. [Contributing](#contributing)
8. [License](#license)
9. [Contact](#contact)

## Features

- **Content Negotiation:** Delivers data in various formats such as JSON-LD, CSV, JSON, and HTML based on the `Accept` header or query parameters.
- **Language Negotiation:** Supports multiple languages for labels and descriptions based on the `Accept-Language` header.
- **Custom Rendering:** Utilizes EJS templates for custom HTML rendering of data.
- **Configurable:** Easily configurable via environment variables.

## Installation

To install CSVW Server, you need to have Node.js and npm installed on your system. If they are not installed, you can download and install them from [the official Node.js website](https://nodejs.org/).

Once Node.js and npm are installed, you can install the CSVW Server using the following commands:

```bash
git clone https://github.com/theodi/csvw-server.git
cd csvw-server
npm install
```

## Usage

To start the server, run:

```bash
npm start
```

By default, the server will run on port 3000. You can access it by visiting [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `GET /transactions/`: Fetches a list of all transactions.
- `GET /transactions/:id`: Fetches a specific transaction by ID.

## Content Negotiation

CSVW Server supports content negotiation to provide responses in various formats. You can request a specific format using the `Accept` header in your HTTP request.

Supported formats:

- `application/ld+json`: JSON-LD format.
- `text/csv`: CSV format.
- `application/json`: JSON format.
- `text/html`: HTML format.

## Configuration

You can configure the server using a `.env` file. Here is an example configuration:

```env
PORT=3000
HOST=localhost
```

## Contributing

Contributions to the CSVW Server project are welcome. Please check out our [GitHub repository](https://github.com/theodi/csvw-server) for more information on how to get involved.

## License

CSVW Server is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for more details.

## Contact

For any questions or concerns, please open an issue on our [GitHub repository](https://github.com/theodi/csvw-server/issues), and we will get back to you as soon as possible.

---

Created and maintained by [The Open Data Institute](https://theodi.org/).