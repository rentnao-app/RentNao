Grant Token

# Grant Token

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.2.0-beta",
    "title": "Checkout API"
  },
  "paths": {
    "/checkout/token/grant": {
      "post": {
        "tags": [
          "Token"
        ],
        "summary": "Grant Token",
        "operationId": "getTokenUsingPOST",
        "parameters": [
          {
            "name": "username",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "password",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/GetTokenRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "200 response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GetTokenResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "servers": [
    {
      "url": "https://checkout.sandbox.bka.sh/v1.2.0-beta"
    }
  ],
  "components": {
    "schemas": {
      "GetTokenRequest": {
        "type": "object",
        "required": [
          "app_key",
          "app_secret"
        ],
        "properties": {
          "app_key": {
            "type": "string",
            "description": "App Key"
          },
          "app_secret": {
            "type": "string",
            "description": "App Secret"
          }
        }
      },
      "GetTokenResponse": {
        "type": "object",
        "properties": {
          "expires_in": {
            "type": "string"
          },
          "id_token": {
            "type": "string"
          },
          "refresh_token": {
            "type": "string"
          },
          "token_type": {
            "type": "string"
          }
        }
      }
    }
  },
  "x-readme": {
    "explorer-enabled": true,
    "proxy-enabled": true
  }
}
```

Refresh Token

# Refresh Token

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.2.0-beta",
    "title": "Checkout API"
  },
  "paths": {
    "/checkout/token/refresh": {
      "post": {
        "tags": [
          "Token"
        ],
        "summary": "Refresh Token",
        "operationId": "refreshTokenUsingPOST",
        "parameters": [
          {
            "name": "username",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "password",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RefreshTokenRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "200 response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RefreshTokenResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "servers": [
    {
      "url": "https://checkout.sandbox.bka.sh/v1.2.0-beta"
    }
  ],
  "components": {
    "schemas": {
      "RefreshTokenResponse": {
        "type": "object",
        "properties": {
          "expires_in": {
            "type": "string"
          },
          "id_token": {
            "type": "string"
          },
          "refresh_token": {
            "type": "string"
          },
          "token_type": {
            "type": "string"
          }
        }
      },
      "RefreshTokenRequest": {
        "type": "object",
        "required": [
          "app_key",
          "app_secret",
          "refresh_token"
        ],
        "properties": {
          "app_key": {
            "type": "string",
            "description": "App Key"
          },
          "app_secret": {
            "type": "string",
            "description": "App Secret"
          },
          "refresh_token": {
            "type": "string",
            "description": "Refresh Token"
          }
        }
      }
    }
  },
  "x-readme": {
    "explorer-enabled": true,
    "proxy-enabled": true
  }
}
```

Create Payment (Sale or Authorize)

# Create Payment (Sale or Authorize)

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.2.0-beta",
    "title": "Checkout API"
  },
  "paths": {
    "/checkout/payment/create": {
      "post": {
        "tags": [
          "Payment"
        ],
        "summary": "Create Payment (Sale or Authorize)",
        "operationId": "createPaymentUsingPOST",
        "parameters": [
          {
            "name": "Authorization",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "X-APP-Key",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreatePaymentRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "200 response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreatePaymentResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "cognitoAuthorizer": []
          }
        ]
      }
    }
  },
  "servers": [
    {
      "url": "https://checkout.sandbox.bka.sh/v1.2.0-beta"
    }
  ],
  "components": {
    "securitySchemes": {
      "cognitoAuthorizer": {
        "type": "apiKey",
        "name": "Authorization",
        "in": "header",
        "x-amazon-apigateway-authtype": "cognito_user_pools"
      }
    },
    "schemas": {
      "CreatePaymentRequest": {
        "type": "object",
        "required": [
          "amount",
          "currency",
          "intent",
          "merchantInvoiceNumber"
        ],
        "properties": {
          "amount": {
            "type": "string",
            "description": "Amount"
          },
          "currency": {
            "type": "string",
            "description": "Currency(BDT)"
          },
          "intent": {
            "type": "string",
            "description": "Intent(sale/authorization)"
          },
          "merchantInvoiceNumber": {
            "type": "string",
            "description": "Merchant Invoice Number"
          },
          "merchantAssociationInfo": {
            "type": "string",
            "description": "Merchant Association Info"
          }
        }
      },
      "CreatePaymentResponse": {
        "type": "object",
        "properties": {
          "paymentID": {
            "type": "string"
          },
          "createTime": {
            "type": "string"
          },
          "orgLogo": {
            "type": "string"
          },
          "orgName": {
            "type": "string"
          },
          "transactionStatus": {
            "type": "string"
          },
          "amount": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          },
          "intent": {
            "type": "string"
          },
          "merchantInvoiceNumber": {
            "type": "string"
          }
        }
      }
    }
  },
  "x-readme": {
    "explorer-enabled": true,
    "proxy-enabled": true
  }
}
```

Execute Payment

# Execute Payment

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.2.0-beta",
    "title": "Checkout API"
  },
  "paths": {
    "/checkout/payment/execute/{paymentID}": {
      "post": {
        "tags": [
          "Payment"
        ],
        "summary": "Execute Payment",
        "operationId": "executePaymentUsingPOST",
        "parameters": [
          {
            "name": "paymentID",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "Authorization",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "X-APP-Key",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200 response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ExecutePaymentResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "cognitoAuthorizer": []
          }
        ]
      }
    }
  },
  "servers": [
    {
      "url": "https://checkout.sandbox.bka.sh/v1.2.0-beta"
    }
  ],
  "components": {
    "securitySchemes": {
      "cognitoAuthorizer": {
        "type": "apiKey",
        "name": "Authorization",
        "in": "header",
        "x-amazon-apigateway-authtype": "cognito_user_pools"
      }
    },
    "schemas": {
      "ExecutePaymentResponse": {
        "type": "object",
        "properties": {
          "paymentID": {
            "type": "string"
          },
          "createTime": {
            "type": "string"
          },
          "updateTime": {
            "type": "string"
          },
          "trxID": {
            "type": "string"
          },
          "transactionStatus": {
            "type": "string"
          },
          "amount": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          },
          "intent": {
            "type": "string"
          },
          "merchantInvoiceNumber": {
            "type": "string"
          }
        }
      }
    }
  },
  "x-readme": {
    "explorer-enabled": true,
    "proxy-enabled": true
  }
}
```

Query Payment

# Query Payment

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.2.0-beta",
    "title": "Checkout API"
  },
  "paths": {
    "/checkout/payment/query/{paymentID}": {
      "get": {
        "tags": [
          "Payment"
        ],
        "summary": "Query Payment",
        "operationId": "queryPaymentUsingGET",
        "parameters": [
          {
            "name": "paymentID",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "Authorization",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "X-APP-Key",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200 response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/QueryPaymentResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "cognitoAuthorizer": []
          }
        ]
      }
    }
  },
  "servers": [
    {
      "url": "https://checkout.sandbox.bka.sh/v1.2.0-beta"
    }
  ],
  "components": {
    "securitySchemes": {
      "cognitoAuthorizer": {
        "type": "apiKey",
        "name": "Authorization",
        "in": "header",
        "x-amazon-apigateway-authtype": "cognito_user_pools"
      }
    },
    "schemas": {
      "QueryPaymentResponse": {
        "type": "object",
        "properties": {
          "paymentID": {
            "type": "string"
          },
          "createTime": {
            "type": "string"
          },
          "updateTime": {
            "type": "string"
          },
          "trxID": {
            "type": "string"
          },
          "transactionStatus": {
            "type": "string"
          },
          "amount": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          },
          "intent": {
            "type": "string"
          },
          "merchantInvoiceNumber": {
            "type": "string"
          },
          "refundAmount": {
            "type": "string"
          }
        }
      }
    }
  },
  "x-readme": {
    "explorer-enabled": true,
    "proxy-enabled": true
  }
}
```

Void

# Void

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.2.0-beta",
    "title": "Checkout API"
  },
  "paths": {
    "/checkout/payment/void/{paymentID}": {
      "post": {
        "tags": [
          "Payment"
        ],
        "summary": "Void",
        "operationId": "voidPaymentUsingPOST",
        "parameters": [
          {
            "name": "paymentID",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "Authorization",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "X-APP-Key",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "200 response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/VoidPaymentResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "cognitoAuthorizer": []
          }
        ]
      }
    }
  },
  "servers": [
    {
      "url": "https://checkout.sandbox.bka.sh/v1.2.0-beta"
    }
  ],
  "components": {
    "securitySchemes": {
      "cognitoAuthorizer": {
        "type": "apiKey",
        "name": "Authorization",
        "in": "header",
        "x-amazon-apigateway-authtype": "cognito_user_pools"
      }
    },
    "schemas": {
      "VoidPaymentResponse": {
        "type": "object",
        "properties": {
          "paymentID": {
            "type": "string"
          },
          "createTime": {
            "type": "string"
          },
          "updateTime": {
            "type": "string"
          },
          "trxID": {
            "type": "string"
          },
          "transactionStatus": {
            "type": "string"
          }
        }
      }
    }
  },
  "x-readme": {
    "explorer-enabled": true,
    "proxy-enabled": true
  }
}
```