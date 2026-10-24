import { swaggerDocument } from './swagger.js';

/**
 * Generates standalone, CDN-backed Swagger UI HTML.
 * This completely avoids serverless file-system missing asset issues (e.g., on Vercel, AWS Lambda)
 * where swagger-ui-dist static files are missing, causing 'Unexpected token <' errors.
 */
export function getSwaggerHtml(): string {
  // Safely escape '<' to prevent script-closing injection in the spec literal
  const specJson = JSON.stringify(swaggerDocument).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemeHub REST API Docs</title>
  <link rel="icon" type="image/png" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/favicon-32x32.png" sizes="32x32" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .swagger-ui .topbar {
      background-color: #071330;
      padding: 12px 0;
      border-bottom: 2px solid #0284c7;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
    .swagger-ui .info {
      margin: 30px 0 20px 0;
    }
    .swagger-ui .info .title {
      color: #0284c7;
      font-size: 30px;
      font-weight: 700;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: #334155;
    }
    .swagger-ui .scheme-container {
      background: #ffffff;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      border-radius: 8px;
      margin-bottom: 24px;
      padding: 16px 20px;
    }
    .swagger-ui .btn.authorize {
      background-color: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
      border-radius: 6px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #0369a1;
      border-color: #0369a1;
    }
    .swagger-ui .btn.authorize svg {
      fill: #ffffff;
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #0284c7;
      background: rgba(2, 132, 199, 0.05);
    }
    .swagger-ui .opblock.opblock-delete {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }
    .swagger-ui .opblock-tag {
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${specJson},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        displayRequestDuration: true,
        tryItOutEnabled: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;
}
